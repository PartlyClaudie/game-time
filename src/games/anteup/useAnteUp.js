import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDeck, shuffleDeck } from './deck.js'
import { scoreHand } from './scoring.js'
import { getRankValue } from './handEvaluator.js'
import { getBlindTarget, pickRandomChallenge, ROUND_NAMES } from './blinds.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'

const HAND_SIZE = 8
const DEFAULT_MAX_SELECTED = 5
const STARTING_HANDS = 4
const STARTING_DISCARDS = 3
const LEAVE_DURATION = 260
const SAVE_DEBOUNCE_MS = 400

const BEST_KEY = 'game-hub:anteup:best'
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
  const [roundIndex, setRoundIndex] = useState(0) // 0 = Small, 1 = Big, 2 = Boss
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

  const playIdRef = useRef(0)
  const lastPlayTimerRef = useRef(null)
  const syncedUserIdRef = useRef(null)

  const beginRound = useCallback((nextAnte, nextRoundIndex) => {
    const freshDeck = shuffleDeck(createDeck())
    const roundChallenge = nextRoundIndex === 2 ? pickRandomChallenge() : null
    const effectiveHands = roundChallenge?.type === 'handsOverride' ? roundChallenge.value : STARTING_HANDS
    const effectiveMaxSelected = roundChallenge?.type === 'maxSelected' ? roundChallenge.value : null

    setAnte(nextAnte)
    setRoundIndex(nextRoundIndex)
    setChallenge(roundChallenge)
    setMaxSelectedOverride(effectiveMaxSelected)
    setHand(freshDeck.slice(0, HAND_SIZE))
    setDeck(freshDeck.slice(HAND_SIZE))
    setSelectedIds([])
    setHandsRemaining(effectiveHands)
    setDiscardsRemaining(STARTING_DISCARDS)
    setRoundScore(0)
    setRoundStatus('playing')
    setLastPlay(null)
    setLeavingIds([])
    setLeavingMode(null)
    setIsResolving(false)
  }, [])

  useEffect(() => {
    beginRound(1, 0)
  }, [beginRound])

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

  // Track best score live, identity-agnostic
  useEffect(() => {
    if (roundScore > best) setBest(roundScore)
  }, [roundScore, best])

  useEffect(() => {
    syncedUserIdRef.current = null
  }, [user?.id])

  useEffect(() => {
    if (user && profile && profile.id === user.id) {
      setBest(profile.anteup_best_score ?? 0)
      syncedUserIdRef.current = user.id
    } else if (!user) {
      const localBest = Number(readJSON(BEST_KEY, 0))
      setBest(Number.isFinite(localBest) ? localBest : 0)
      syncedUserIdRef.current = 'guest'
    }
  }, [user, profile])

  useEffect(() => {
    if (user) return
    localStorage.setItem(BEST_KEY, JSON.stringify(best))
  }, [best, user])

  useEffect(() => {
    if (!user || syncedUserIdRef.current !== user.id) return
    const timer = setTimeout(() => {
      supabase
        .from('profiles')
        .update({ anteup_best_score: best })
        .eq('id', user.id)
        .then(({ error }) => error && console.error('Failed to save Ante Up best score', error))
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [best, user])

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
    const result = scoreHand(playedCards)
    const remainingHandCards = hand.filter((c) => !selectedIds.includes(c.id))
    const needed = playedCards.length
    const drawn = deck.slice(0, needed)
    const target = getBlindTarget(ante, roundIndex)

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
        setRoundStatus('won')
      } else if (newHandsRemaining <= 0) {
        setRoundStatus('lost')
      }
    }, LEAVE_DURATION)
  }, [roundStatus, selectedIds, handsRemaining, hand, deck, roundScore, isResolving, ante, roundIndex])

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

  const displayedHand = useMemo(() => sortHand(hand, sortMode), [hand, sortMode])
  const selectedCards = hand.filter((c) => selectedIds.includes(c.id))
  const preview = selectedCards.length > 0 ? scoreHand(selectedCards) : null
  const availableIds = useMemo(() => new Set([...hand.map((c) => c.id), ...deck.map((c) => c.id)]), [hand, deck])
  const blindTarget = useMemo(() => getBlindTarget(ante, roundIndex), [ante, roundIndex])
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
    deckCount: deck.length,
    availableIds,
    toggleCard,
    playHand,
    discardCards,
    advanceRound,
    restartRun,
    maxSelected,
  }
}