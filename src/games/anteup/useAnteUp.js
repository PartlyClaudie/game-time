import { useCallback, useEffect, useState } from 'react'
import { createDeck, shuffleDeck } from './deck.js'
import { scoreHand } from './scoring.js'

const HAND_SIZE = 8
const MAX_SELECTED = 5
const STARTING_HANDS = 4
const STARTING_DISCARDS = 3
export const BLIND_TARGET = 250

export function useAnteUp() {
  const [deck, setDeck] = useState([])
  const [hand, setHand] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [handsRemaining, setHandsRemaining] = useState(STARTING_HANDS)
  const [discardsRemaining, setDiscardsRemaining] = useState(STARTING_DISCARDS)
  const [roundScore, setRoundScore] = useState(0)
  const [roundStatus, setRoundStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [lastPlay, setLastPlay] = useState(null)

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
  }, [])

  useEffect(() => {
    startNewRound()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleCard = useCallback((id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECTED) return prev
      return [...prev, id]
    })
  }, [])

  const playHand = useCallback(() => {
    if (roundStatus !== 'playing' || selectedIds.length === 0 || handsRemaining <= 0) return

    const playedCards = hand.filter((c) => selectedIds.includes(c.id))
    const result = scoreHand(playedCards)
    const remainingHandCards = hand.filter((c) => !selectedIds.includes(c.id))
    const needed = playedCards.length
    const drawn = deck.slice(0, needed)

    const newRoundScore = roundScore + result.total
    const newHandsRemaining = handsRemaining - 1

    setHand([...remainingHandCards, ...drawn])
    setDeck((prev) => prev.slice(needed))
    setSelectedIds([])
    setRoundScore(newRoundScore)
    setHandsRemaining(newHandsRemaining)
    setLastPlay(result)

    if (newRoundScore >= BLIND_TARGET) {
      setRoundStatus('won')
    } else if (newHandsRemaining <= 0) {
      setRoundStatus('lost')
    }
  }, [roundStatus, selectedIds, handsRemaining, hand, deck, roundScore])

  const discardCards = useCallback(() => {
    if (roundStatus !== 'playing' || selectedIds.length === 0 || discardsRemaining <= 0) return

    const remainingHandCards = hand.filter((c) => !selectedIds.includes(c.id))
    const needed = selectedIds.length
    const drawn = deck.slice(0, needed)

    setHand([...remainingHandCards, ...drawn])
    setDeck((prev) => prev.slice(needed))
    setSelectedIds([])
    setDiscardsRemaining((d) => d - 1)
  }, [roundStatus, selectedIds, discardsRemaining, hand, deck])

  const selectedCards = hand.filter((c) => selectedIds.includes(c.id))
  const preview = selectedCards.length > 0 ? scoreHand(selectedCards) : null

  return {
    hand,
    selectedIds,
    handsRemaining,
    discardsRemaining,
    roundScore,
    roundStatus,
    lastPlay,
    preview,
    blindTarget: BLIND_TARGET,
    toggleCard,
    playHand,
    discardCards,
    startNewRound,
    maxSelected: MAX_SELECTED,
  }
}