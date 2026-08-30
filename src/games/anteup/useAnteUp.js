import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createDeck, shuffleDeck } from './deck.js'
import { scoreHand } from './scoring.js'
import { getRankValue } from './handEvaluator.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabaseClient.js'

const HAND_SIZE = 8
const MAX_SELECTED = 5
const STARTING_HANDS = 4
const STARTING_DISCARDS = 3
const LEAVE_DURATION = 260
const SAVE_DEBOUNCE_MS = 400
export const BLIND_TARGET = 250

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

  const startNewRound = useCallback(() => {
    const freshDeck = shuffleDeck(createDeck())
    setHand(freshDeck.slice(0, HAND_SIZE))
    setDeck(freshDeck.slice(HAND_SIZE))
    setSelectedIds([])
    setHandsRemaining(STARTING_HANDS)
    setDiscardsRemaining(STARTING_DISCARDS)
    setRoundScore(0)
    setRoundStatus('playing')
    setLastPlay(null)
    setLeavingIds([])
    setLeavingMode(null)
    setIsResolving(false)
  }, [])

  useEffect(() => {
    startNewRound()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track our best score live, identity-agnostic
  useEffect(() => {
    if (roundScore > best) setBest(roundScore)
  }, [roundScore, best])

  // Identity changed — stop trusting `best` for cloud writes until re-synced below
  useEffect(() => {
    syncedUserIdRef.current = null
  }, [user?.id])

  // Load the correct source: account profile if logged in and matching, else guest localStorage
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

  // Guest persistence — only when actually a guest
  useEffect(() => {
    if (user) return
    localStorage.setItem(BEST_KEY, JSON.stringify(best))
  }, [best, user])

  // Account persistence — debounced, only once confirmed synced to this user
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

  const toggleCard = useCallback(
    (id) => {
      if (isResolving) return
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id)
        if (prev.length >= MAX_SELECTED) return prev
        return [...prev, id]
      })
    },
    [isResolving],
  )

  const playHand = useCallback(() => {
    if (roundStatus !== 'playing' || selectedIds.length === 0 || handsRemaining <= 0 || isResolving) return

    const playedCards = hand.filter((c) => selectedIds.includes(c.id))
    const result = scoreHand(playedCards)
    const remainingHandCards = hand.filter((c) => !selectedIds.includes(c.id))
    const needed = playedCards.length
    const drawn = deck.slice(0, needed)

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

      if (newRoundScore >= BLIND_TARGET) {
        setRoundStatus('won')
      } else if (newHandsRemaining <= 0) {
        setRoundStatus('lost')
      }
    }, LEAVE_DURATION)
  }, [roundStatus, selectedIds, handsRemaining, hand, deck, roundScore, isResolving])

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

  return {
    hand: displayedHand,
    selectedIds,
    handsRemaining,
    discardsRemaining,
    roundScore,
    roundStatus,
    lastPlay,
    preview,
    blindTarget: BLIND_TARGET,
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
    startNewRound,
    maxSelected: MAX_SELECTED,
  }
}