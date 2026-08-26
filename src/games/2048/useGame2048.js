import { useCallback, useEffect, useRef, useState } from 'react'
import { ANIMATION_MS, createInitialTiles, isGameOver, performMove, spawnRandomTile } from './gameEngine.js'
import {
  applyShieldClear,
  detectNewMilestone,
  getFourChance,
  getMultiplier,
  pickUpgradeOptions,
  tidyRemoveSmallest,
} from './upgrades.js'

const BEST_SCORE_KEY = 'game-hub:2048:best'
const HISTORY_LIMIT = 10
const BIG_MERGE_THRESHOLD = 64
const HUGE_MERGE_THRESHOLD = 256

let popupCounter = 1

export function useGame2048() {
  const [tiles, setTiles] = useState(createInitialTiles)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem(BEST_SCORE_KEY)
    return stored ? Number(stored) : 0
  })
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [isAnimating, setIsAnimating] = useState(false)
  const [upgradeStacks, setUpgradeStacks] = useState({})
  const [reachedMilestones, setReachedMilestones] = useState({})
  const [pendingChoice, setPendingChoice] = useState(null)
  const [toast, setToast] = useState(null)
  const [popups, setPopups] = useState([]) // floating "+N" score popups
  const [combo, setCombo] = useState(null) // { count } or null
  const [shakeClass, setShakeClass] = useState('') // '' | 'is-shaking' | 'is-shaking-big'

  const historyRef = useRef([])
  const toastTimerRef = useRef(null)
  const comboTimerRef = useRef(null)
  const shakeTimerRef = useRef(null)

  useEffect(() => {
    if (score > best) {
      setBest(score)
      localStorage.setItem(BEST_SCORE_KEY, String(score))
    }
  }, [score, best])

  const showToast = useCallback((message) => {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 1800)
  }, [])

  const triggerShake = useCallback((intensity) => {
    setShakeClass(intensity)
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current)
    shakeTimerRef.current = setTimeout(() => setShakeClass(''), 360)
  }, [])

  const triggerCombo = useCallback((count) => {
    setCombo({ count })
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => setCombo(null), 900)
  }, [])

  const spawnPopups = useCallback((merges, multiplier) => {
    const fresh = merges.map((m) => ({
      id: `popup-${popupCounter++}`,
      row: m.row,
      col: m.col,
      amount: Math.round(m.value * multiplier),
    }))
    setPopups((prev) => [...prev, ...fresh])
    fresh.forEach((p) => {
      setTimeout(() => {
        setPopups((prev) => prev.filter((x) => x.id !== p.id))
      }, 900)
    })
  }, [])

  const move = useCallback(
    (direction) => {
      if (isAnimating || status === 'lost' || pendingChoice) return
      const result = performMove(tiles, direction)
      if (!result.moved) return

      historyRef.current = [...historyRef.current, { tiles, score }].slice(-HISTORY_LIMIT)

      const multiplier = getMultiplier(upgradeStacks)
      const fourChance = getFourChance(upgradeStacks)

      setIsAnimating(true)
      setTiles(result.slidTiles) // phase 1: slide

      setTimeout(() => {
        let nextTiles = spawnRandomTile(result.settledTiles, fourChance) // phase 2: merge pop + spawn
        const gained = Math.round(result.scoreGained * multiplier)
        let nextStatus = status

        if (result.merges.length > 0) {
          spawnPopups(result.merges, multiplier)

          const maxMergeValue = Math.max(...result.merges.map((m) => m.value))
          if (result.merges.length >= 2) {
            triggerCombo(result.merges.length)
            triggerShake(maxMergeValue >= HUGE_MERGE_THRESHOLD ? 'is-shaking-big' : 'is-shaking')
          } else if (maxMergeValue >= HUGE_MERGE_THRESHOLD) {
            triggerShake('is-shaking-big')
          } else if (maxMergeValue >= BIG_MERGE_THRESHOLD) {
            triggerShake('is-shaking')
          }
        }

        if (isGameOver(nextTiles)) {
          if ((upgradeStacks.shield || 0) > 0) {
            nextTiles = applyShieldClear(nextTiles)
            setUpgradeStacks((prev) => ({ ...prev, shield: prev.shield - 1 }))
            showToast('🛡 Shield used — cleared your weakest tiles')
          } else {
            nextStatus = 'lost'
          }
        }

        setTiles(nextTiles)
        setScore((s) => s + gained)
        setIsAnimating(false)
        setStatus(nextStatus === 'lost' ? 'lost' : status)

        if (nextTiles.some((t) => t.value === 2048) && status !== 'won') {
          setStatus('won')
        } else if (nextStatus === 'lost') {
          setStatus('lost')
        }

        const reachedSet = new Set(Object.keys(reachedMilestones).map(Number))
        const newMilestone = detectNewMilestone(nextTiles, reachedSet)
        if (newMilestone) {
          setReachedMilestones((prev) => ({ ...prev, [newMilestone]: true }))
          setPendingChoice({ milestone: newMilestone, options: pickUpgradeOptions(upgradeStacks, 3) })
        }
      }, ANIMATION_MS)
    },
    [tiles, score, status, isAnimating, pendingChoice, upgradeStacks, reachedMilestones, showToast, spawnPopups, triggerCombo, triggerShake],
  )

  const chooseUpgrade = useCallback((id) => {
    setUpgradeStacks((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
    setPendingChoice(null)
  }, [])

  const undo = useCallback(() => {
    if (isAnimating || pendingChoice) return
    if ((upgradeStacks.undo || 0) <= 0) return
    const prevState = historyRef.current.pop()
    if (!prevState) return
    setTiles(prevState.tiles)
    setScore(prevState.score)
    setUpgradeStacks((prev) => ({ ...prev, undo: prev.undo - 1 }))
    setStatus('playing')
  }, [isAnimating, pendingChoice, upgradeStacks])

  const tidyUp = useCallback(() => {
    if (isAnimating || pendingChoice || status === 'lost') return
    if ((upgradeStacks.tidy || 0) <= 0) return
    setTiles((prev) => tidyRemoveSmallest(prev))
    setUpgradeStacks((prev) => ({ ...prev, tidy: prev.tidy - 1 }))
  }, [isAnimating, pendingChoice, status, upgradeStacks])

  const reset = useCallback(() => {
    setTiles(createInitialTiles())
    setScore(0)
    setStatus('playing')
    setIsAnimating(false)
    setUpgradeStacks({})
    setReachedMilestones({})
    setPendingChoice(null)
    setToast(null)
    setPopups([])
    setCombo(null)
    setShakeClass('')
    historyRef.current = []
  }, [])

  return {
    tiles,
    score,
    best,
    status,
    upgradeStacks,
    pendingChoice,
    toast,
    popups,
    combo,
    shakeClass,
    undoCharges: upgradeStacks.undo || 0,
    tidyCharges: upgradeStacks.tidy || 0,
    move,
    reset,
    undo,
    tidyUp,
    chooseUpgrade,
  }
}