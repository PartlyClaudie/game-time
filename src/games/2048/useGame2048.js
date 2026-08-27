import { useCallback, useEffect, useRef, useState } from 'react'
import { ANIMATION_MS, createInitialTiles, isGameOver, performMove, spawnRandomTile } from './gameEngine.js'
import {
  applyShieldClear,
  COOLDOWN_BY_TIER,
  detectNewMilestone,
  getFourChance,
  getMultiplier,
  getUpgrade,
  pickUpgradeOptions,
  tidyRemoveSmallest,
} from './upgrades.js'
import { coinsForScore } from './themes.js'

const BEST_SCORE_KEY = 'game-hub:2048:best'
const COINS_KEY = 'game-hub:2048:coins'
const THEMES_KEY = 'game-hub:2048:themes'
const SELECTED_THEME_KEY = 'game-hub:2048:selectedTheme'

const DEFAULT_DIMS = { rows: 4, cols: 4 }
const BIG_MERGE_THRESHOLD = 64
const HUGE_MERGE_THRESHOLD = 256

let popupCounter = 1

function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useGame2048() {
  const [dims, setDims] = useState(DEFAULT_DIMS)
  const [tiles, setTiles] = useState(() => createInitialTiles(DEFAULT_DIMS))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(readJSON(BEST_SCORE_KEY, 0)))
  const [status, setStatus] = useState('playing')
  const [isAnimating, setIsAnimating] = useState(false)
  const [upgradeStacks, setUpgradeStacks] = useState({})
  const [reachedMilestones, setReachedMilestones] = useState({})
  const [pendingChoice, setPendingChoice] = useState(null)
  const [toast, setToast] = useState(null)
  const [popups, setPopups] = useState([])
  const [combo, setCombo] = useState(null)
  const [shakeClass, setShakeClass] = useState('')
  const [acquireBanner, setAcquireBanner] = useState(null)
  const [undoCooldown, setUndoCooldown] = useState(0)
  const [tidyCooldown, setTidyCooldown] = useState(0)

  const [coins, setCoins] = useState(() => {
    const value = Number(readJSON(COINS_KEY, 0))
    return Number.isFinite(value) ? value : 0
  })
  const [ownedThemes, setOwnedThemes] = useState(() => readJSON(THEMES_KEY, ['arcade']))
  const [selectedTheme, setSelectedTheme] = useState(() => readJSON(SELECTED_THEME_KEY, 'arcade'))

  const historyRef = useRef([])
  const toastTimerRef = useRef(null)
  const comboTimerRef = useRef(null)
  const shakeTimerRef = useRef(null)
  const acquireTimerRef = useRef(null)
  const coinsAwardedRef = useRef(false)

  useEffect(() => {
    if (score > best) {
      setBest(score)
      localStorage.setItem(BEST_SCORE_KEY, JSON.stringify(score))
    }
  }, [score, best])

  useEffect(() => {
    localStorage.setItem(COINS_KEY, JSON.stringify(coins))
  }, [coins])
  useEffect(() => {
    localStorage.setItem(THEMES_KEY, JSON.stringify(ownedThemes))
  }, [ownedThemes])
  useEffect(() => {
    localStorage.setItem(SELECTED_THEME_KEY, JSON.stringify(selectedTheme))
  }, [selectedTheme])

  // Award coins exactly once when a run ends
  useEffect(() => {
    if ((status === 'won' || status === 'lost') && !coinsAwardedRef.current) {
      coinsAwardedRef.current = true
      const earned = coinsForScore(score)
      if (earned > 0) {
        setCoins((c) => c + earned)
        showToast(`🪙 +${earned} coins earned`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

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

  const growBoard = useCallback((afterTier) => {
    setDims((prevDims) => {
      const nextDims = afterTier === 1 ? { rows: prevDims.rows, cols: prevDims.cols + 1 } : { rows: prevDims.rows + 1, cols: prevDims.cols }
      setTiles((prevTiles) => spawnRandomTile(prevTiles, 0.1, nextDims))
      return nextDims
    })
  }, [])

  const move = useCallback(
    (direction) => {
      if (isAnimating || status === 'lost' || status === 'confirmingLoss' || pendingChoice) return
      const result = performMove(tiles, direction, dims)
      if (!result.moved) return

      historyRef.current = [...historyRef.current, { tiles, score }].slice(-10)

      const multiplier = getMultiplier(upgradeStacks)
      const fourChance = getFourChance(upgradeStacks)

      setIsAnimating(true)
      setTiles(result.slidTiles)

      setTimeout(() => {
        let nextTiles = spawnRandomTile(result.settledTiles, fourChance, dims)
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

        if (isGameOver(nextTiles, dims)) {
          if ((upgradeStacks.shield || 0) > 0) {
            nextTiles = applyShieldClear(nextTiles)
            setUpgradeStacks((prev) => ({ ...prev, shield: prev.shield - 1 }))
            showToast('🛡 Shield used — cleared your weakest tiles')
          } else {
            const undoReady = (upgradeStacks.undo || 0) > 0 && undoCooldown === 0 && historyRef.current.length > 0
            nextStatus = undoReady ? 'confirmingLoss' : 'lost'
          }
        }

        setTiles(nextTiles)
        setScore((s) => s + gained)
        setIsAnimating(false)

        if ((upgradeStacks.undo || 0) > 0) setUndoCooldown((c) => Math.max(0, c - 1))
        if ((upgradeStacks.tidy || 0) > 0) setTidyCooldown((c) => Math.max(0, c - 1))

        if (nextTiles.some((t) => t.value === 2048) && status !== 'won') {
          setStatus('won')
        } else if (nextStatus === 'lost') {
          setStatus('lost')
        } else if (nextStatus === 'confirmingLoss') {
          setStatus('confirmingLoss')
        }

        const reachedSet = new Set(Object.keys(reachedMilestones).map(Number))
        const newMilestone = detectNewMilestone(nextTiles, reachedSet)
        if (newMilestone) {
          setReachedMilestones((prev) => ({ ...prev, [newMilestone]: true }))
          setPendingChoice({ milestone: newMilestone, options: pickUpgradeOptions(upgradeStacks, newMilestone, 3) })
        }
      }, ANIMATION_MS)
    },
    [tiles, score, status, isAnimating, pendingChoice, upgradeStacks, reachedMilestones, dims, showToast, spawnPopups, triggerCombo, triggerShake],
  )

  const chooseUpgrade = useCallback(
    (id) => {
      const currentTier = upgradeStacks[id] || 0
      const newTier = currentTier + 1

      setUpgradeStacks((prev) => ({ ...prev, [id]: newTier }))

      if (id === 'undo') setUndoCooldown(0)
      if (id === 'tidy') setTidyCooldown(0)
      if (id === 'boardGrow') growBoard(newTier)

      const def = getUpgrade(id)
      setAcquireBanner({ icon: def.icon, name: def.name, tier: newTier, description: def.describe(newTier) })
      if (acquireTimerRef.current) clearTimeout(acquireTimerRef.current)
      acquireTimerRef.current = setTimeout(() => setAcquireBanner(null), 1700)

      setPendingChoice(null)
    },
    [upgradeStacks, growBoard],
  )

  const undo = useCallback(() => {
    if (isAnimating || pendingChoice) return
    if ((upgradeStacks.undo || 0) <= 0 || undoCooldown > 0) return
    const prevState = historyRef.current.pop()
    if (!prevState) return
    setTiles(prevState.tiles)
    setScore(prevState.score)
    setUndoCooldown(COOLDOWN_BY_TIER[(upgradeStacks.undo || 1) - 1])
    setStatus('playing')
  }, [isAnimating, pendingChoice, upgradeStacks, undoCooldown])

  const confirmGameOver = useCallback(() => {
    setStatus('lost')
  }, [])

  const tidyUp = useCallback(() => {
    if (isAnimating || pendingChoice || status === 'lost' || status === 'confirmingLoss') return
    if ((upgradeStacks.tidy || 0) <= 0 || tidyCooldown > 0) return
    setTiles((prev) => tidyRemoveSmallest(prev))
    setTidyCooldown(COOLDOWN_BY_TIER[(upgradeStacks.tidy || 1) - 1])
  }, [isAnimating, pendingChoice, status, upgradeStacks, tidyCooldown])

  const buyTheme = useCallback(
    (id) => {
      const theme = { arcade: 0 }[id]
      setOwnedThemes((prevOwned) => {
        if (prevOwned.includes(id)) return prevOwned
        return prevOwned // guarded properly below via component-level price check
      })
    },
    [],
  )

  // Real buy logic needs current coins + theme price, handled with functional updates together
  const buyThemeReal = useCallback((themeId, price) => {
    setCoins((prevCoins) => {
      if (prevCoins < price) return prevCoins
      setOwnedThemes((prevOwned) => (prevOwned.includes(themeId) ? prevOwned : [...prevOwned, themeId]))
      return prevCoins - price
    })
  }, [])

  const equipTheme = useCallback((themeId) => {
    setSelectedTheme(themeId)
  }, [])

  const reset = useCallback(() => {
    setDims(DEFAULT_DIMS)
    setTiles(createInitialTiles(DEFAULT_DIMS))
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
    setAcquireBanner(null)
    setUndoCooldown(0)
    setTidyCooldown(0)
    historyRef.current = []
    coinsAwardedRef.current = false
  }, [])

  return {
    dims,
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
    acquireBanner,
    undoCooldown,
    tidyCooldown,
    coins,
    ownedThemes,
    selectedTheme,
    move,
    reset,
    undo,
    tidyUp,
    confirmGameOver,
    chooseUpgrade,
    buyTheme: buyThemeReal,
    equipTheme,
  }
}