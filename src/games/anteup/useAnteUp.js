import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDeck, shuffleDeck } from './deck.js'
import { scoreHand } from './scoring.js'
import { getRankValue } from './handEvaluator.js'
import { getBlindTarget, pickRandomChallenge, ROUND_NAMES } from './blinds.js'
import { applyPowerupBonuses, computeEffects, getChipsEarned } from './powerups.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'

const HAND_SIZE = 8
const DEFAULT_MAX_SELECTED = 5
const STARTING_HANDS = 4
const STARTING_DISCARDS = 3
const LEAVE_DURATION = 260
const SAVE_DEBOUNCE_MS = 400

const BEST_KEY = 'game-hub:anteup:best'
const CHIPS_KEY = 'game-hub:anteup:chips'
const STYLES_KEY = 'game-hub:anteup:styles'
const SELECTED_STYLE_KEY = 'game-hub:anteup:selectedStyle'
const POWERUPS_KEY = 'game-hub:anteup:powerups'

const SUIT_ORDER = ['♠', '♥', '♦', '♣']

function readJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function sortHand(cards, mode) {
  const copy = [...cards]
  if (mode === 'rank') {
    copy.sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank) || SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit))
  } else if (mode === 'suit') {
    copy.sort((a, b) => SUIT_ORDER.indexOf(a.suit) - SUIT_ORDER.indexOf(b.suit) || getRankValue(a.rank) - getRankValue(b.rank))
  }
  return copy
}

export function useAnteUp() {
  const { user, profile } = useAuth()

  const [ante, setAnte] = useState(1)
  const [roundIndex, setRoundIndex] = useState(0)
  const [challenge, setChallenge] = useState(null)
  const [maxSelectedOverride, setMaxSelectedOverride] = useState(null)

  const [deck, setDeck] = useState([])
  const [hand, setHand] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [handsRemaining, setHandsRemaining] = useState(STARTING_HANDS)
  const [discardsRemaining, setDiscardsRemaining] = useState(STARTING_DISCARDS)
  const [roundScore, setRoundScore] = useState(0)
  const [roundStatus, setRoundStatus] = useState('playing')
  const [lastPlay, setLastPlay] = useState(null)
  const [sortMode, setSortMode] = useState('rank')
  const [leavingIds, setLeavingIds] = useState([])
  const [leavingMode, setLeavingMode] = useState(null)
  const [isResolving, setIsResolving] = useState(false)

  const [best, setBest] = useState(() => {
    const value = Number(readJSON(BEST_KEY, 0))
    return Number.isFinite(value) ? value : 0
  })
  const [chips, setChips] = useState(() => {
    const value = Number(readJSON(CHIPS_KEY, 0))
    return Number.isFinite(value) ? value : 0
  })
  const [ownedStyles, setOwnedStyles] = useState(() => readJSON(STYLES_KEY, ['classic']))
  const [selectedStyle, setSelectedStyle] = useState(() => readJSON(SELECTED_STYLE_KEY, 'classic'))
  const [ownedPowerups, setOwnedPowerups] = useState(() => readJSON(POWERUPS_KEY, []))

  const playIdRef = useRef(0)
  const lastPlayTimerRef = useRef(null)
  const syncedUserIdRef = useRef(null)

  const effects = useMemo(() => computeEffects(ownedPowerups), [ownedPowerups])

  const beginRound = useCallback(
    (nextAnte, nextRoundIndex) => {
      const freshDeck = shuffleDeck(createDeck())
      const roundChallenge = nextRoundIndex === 2 ? pickRandomChallenge() : null
      const baseHands = roundChallenge?.type === 'handsOverride' ? roundChallenge.value : STARTING_HANDS
      const effectiveHands = baseHands + effects.extraHands
      const effectiveDiscards = STARTING_DISCARDS + effects.extraDiscards
      const effectiveMaxSelected = roundChallenge?.type === 'maxSelected' ? roundChallenge.value : null

      setAnte(nextAnte)
      setRoundIndex(nextRoundIndex)
      setChallenge(roundChallenge)
      setMaxSelectedOverride(effectiveMaxSelected)
      setHand(freshDeck.slice(0, HAND_SIZE))
      setDeck(freshDeck.slice(HAND_SIZE))
      setSelectedIds([])
      setHandsRemaining(effectiveHands)
      setDiscardsRemaining(effectiveDiscards)
      setRoundScore(0)
      setRoundStatus('playing')
      setLastPlay(null)
      setLeavingIds([])
      setLeavingMode(null)
      setIsResolving(false)
    },
    [effects],
  )

  useEffect(() => {
    beginRound(1, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const advanceRound = useCallback(() => {
    if (roundIndex < 2) {
      beginRound(ante, roundIndex + 1)
    } else {
      beginRound(ante + 1, 0)
    }
  }, [ante, roundIndex, beginRound])

  const restartRun = useCallback(() => {
    beginRound(1, 0)
  }, [beginRound])

  // Best score, identity-agnostic
  useEffect(() => {
    if (roundScore > best) setBest(roundScore)
  }, [roundScore, best])

  useEffect(() => {
    syncedUserIdRef.current = null
  }, [user?.id])

  useEffect(() => {
    if (user && profile && profile.id === user.id) {
      setBest(profile.anteup_best_score ?? 0)
      setChips(profile.anteup_chips ?? 0)
      setOwnedStyles(profile.anteup_owned_styles ?? ['classic'])
      setSelectedStyle(profile.anteup_selected_style ?? 'classic')
      setOwnedPowerups(profile.anteup_owned_powerups ?? [])
      syncedUserIdRef.current = user.id
    } else if (!user) {
      setBest(Number(readJSON(BEST_KEY, 0)) || 0)
      setChips(Number(readJSON(CHIPS_KEY, 0)) || 0)
      setOwnedStyles(readJSON(STYLES_KEY, ['classic']))
      setSelectedStyle(readJSON(SELECTED_STYLE_KEY, 'classic'))
      setOwnedPowerups(readJSON(POWERUPS_KEY, []))
      syncedUserIdRef.current = 'guest'
    }
  }, [user, profile])

  // Guest persistence
  useEffect(() => {
    if (user) return
    localStorage.setItem(BEST_KEY, JSON.stringify(best))
  }, [best, user])
  useEffect(() => {
    if (user) return
    localStorage.setItem(CHIPS_KEY, JSON.stringify(chips))
  }, [chips, user])
  useEffect(() => {
    if (user) return
    localStorage.setItem(STYLES_KEY, JSON.stringify(ownedStyles))
  }, [ownedStyles, user])
  useEffect(() => {
    if (user) return
    localStorage.setItem(SELECTED_STYLE_KEY, JSON.stringify(selectedStyle))
  }, [selectedStyle, user])
  useEffect(() => {
    if (user) return
    localStorage.setItem(POWERUPS_KEY, JSON.stringify(ownedPowerups))
  }, [ownedPowerups, user])

  // Account persistence — one combined debounced write
  useEffect(() => {
    if (!user || syncedUserIdRef.current !== user.id) return
    const timer = setTimeout(() => {
      supabase
        .from('profiles')
        .update({
          anteup_best_score: best,
          anteup_chips: chips,
          anteup_owned_styles: ownedStyles,
          anteup_selected_style: selectedStyle,
          anteup_owned_powerups: ownedPowerups,
        })
        .eq('id', user.id)
        .then(({ error }) => error && console.error('Failed to save Ante Up profile', error))
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [best, chips, ownedStyles, selectedStyle, ownedPowerups, user])

  const maxSelected = maxSelectedOverride ?? DEFAULT_MAX_SELECTED

  const toggleCard = useCallback(
    (id) => {
      if (isResolving) return
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id)
        if (prev.length >= maxSelected) return prev
        return [...prev, id]
      })
    },
    [isResolving, maxSelected],
  )

  const playHand = useCallback(() => {
    if (roundStatus !== 'playing' || selectedIds.length === 0 || handsRemaining <= 0 || isResolving) return

    const playedCards = hand.filter((c) => selectedIds.includes(c.id))
    const rawResult = scoreHand(playedCards)
    const result = applyPowerupBonuses(rawResult, effects)
    const remainingHandCards = hand.filter((c) => !selectedIds.includes(c.id))
    const needed = playedCards.length
    const drawn = deck.slice(0, needed)

    let target = getBlindTarget(ante, roundIndex)
    if (roundIndex === 2) target = Math.round(target * (1 - effects.bossTargetReduction))

    setIsResolving(true)
    setLeavingMode('play')
    setLeavingIds(selectedIds)

    setTimeout(() => {
      const newRoundScore = roundScore + result.total
      const newHandsRemaining = handsRemaining - 1

      setHand([...remainingHandCards, ...drawn])
      setDeck((prev) => prev.slice(needed))
      setSelectedIds([])
      setRoundScore(newRoundScore)
      setHandsRemaining(newHandsRemaining)
      setLeavingIds([])
      setLeavingMode(null)
      setIsResolving(false)

      const playId = ++playIdRef.current
      setLastPlay({ ...result, playId })
      if (lastPlayTimerRef.current) clearTimeout(lastPlayTimerRef.current)
      lastPlayTimerRef.current = setTimeout(() => {
        setLastPlay((prev) => (prev && prev.playId === playId ? null : prev))
      }, 1200)

      if (newRoundScore >= target) {
        const earned = getChipsEarned(newRoundScore, roundIndex)
        setChips((c) => c + earned)
        setRoundStatus('won')
      } else if (newHandsRemaining <= 0) {
        setRoundStatus('lost')
      }
    }, LEAVE_DURATION)
  }, [roundStatus, selectedIds, handsRemaining, hand, deck, roundScore, isResolving, ante, roundIndex, effects])

  const discardCards = useCallback(() => {
    if (roundStatus !== 'playing' || selectedIds.length === 0 || discardsRemaining <= 0 || isResolving) return

    const remainingHandCards = hand.filter((c) => !selectedIds.includes(c.id))
    const needed = selectedIds.length
    const drawn = deck.slice(0, needed)

    setIsResolving(true)
    setLeavingMode('discard')
    setLeavingIds(selectedIds)

    setTimeout(() => {
      setHand([...remainingHandCards, ...drawn])
      setDeck((prev) => prev.slice(needed))
      setSelectedIds([])
      setDiscardsRemaining((d) => d - 1)
      setLeavingIds([])
      setLeavingMode(null)
      setIsResolving(false)
    }, LEAVE_DURATION)
  }, [roundStatus, selectedIds, discardsRemaining, hand, deck, isResolving])

  const buyPowerup = useCallback((id, price) => {
    setChips((prevChips) => {
      if (prevChips < price) return prevChips
      setOwnedPowerups((prevOwned) => (prevOwned.includes(id) ? prevOwned : [...prevOwned, id]))
      return prevChips - price
    })
  }, [])

  const buyStyle = useCallback((id, price) => {
    setChips((prevChips) => {
      if (prevChips < price) return prevChips
      setOwnedStyles((prevOwned) => (prevOwned.includes(id) ? prevOwned : [...prevOwned, id]))
      return prevChips - price
    })
  }, [])

  const equipStyle = useCallback((id) => {
    setSelectedStyle(id)
  }, [])

  const displayedHand = useMemo(() => sortHand(hand, sortMode), [hand, sortMode])
  const selectedCards = hand.filter((c) => selectedIds.includes(c.id))
  const rawPreview = selectedCards.length > 0 ? scoreHand(selectedCards) : null
  const preview = useMemo(() => applyPowerupBonuses(rawPreview, effects), [rawPreview, effects])
  const availableIds = useMemo(() => new Set([...hand.map((c) => c.id), ...deck.map((c) => c.id)]), [hand, deck])
  const blindTarget = useMemo(() => {
    const base = getBlindTarget(ante, roundIndex)
    return roundIndex === 2 ? Math.round(base * (1 - effects.bossTargetReduction)) : base
  }, [ante, roundIndex, effects])
  const roundName = ROUND_NAMES[roundIndex]

  return {
    hand: displayedHand,
    selectedIds,
    handsRemaining,
    discardsRemaining,
    roundScore,
    roundStatus,
    lastPlay,
    preview,
    blindTarget,
    ante,
    roundIndex,
    roundName,
    challenge,
    sortMode,
    setSortMode,
    leavingIds,
    leavingMode,
    isResolving,
    best,
    chips,
    ownedStyles,
    selectedStyle,
    ownedPowerups,
    deckCount: deck.length,
    availableIds,
    toggleCard,
    playHand,
    discardCards,
    advanceRound,
    restartRun,
    buyPowerup,
    buyStyle,
    equipStyle,
    maxSelected,
  }
}