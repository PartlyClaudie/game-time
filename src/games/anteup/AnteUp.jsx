import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createDeck, shuffleDeck } from './deck.js'
import { evaluateHand } from './handEvaluator.js'
import Card from './Card.jsx'
import './AnteUp.css'

const HAND_SIZE = 8
const MAX_SELECTED = 5

export default function AnteUp() {
  const [hand, setHand] = useState([])
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    dealNewHand()
  }, [])

  function dealNewHand() {
    const freshDeck = shuffleDeck(createDeck())
    setHand(freshDeck.slice(0, HAND_SIZE))
    setSelectedIds([])
  }

  function toggleCard(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECTED) return prev
      return [...prev, id]
    })
  }

  const selectedCards = hand.filter((c) => selectedIds.includes(c.id))
  const evaluation = useMemo(() => evaluateHand(selectedCards), [selectedCards])

  return (
    <main className="anteup-wrap">
      <Link to="/" className="anteup-back">
        ‹ Hub
      </Link>

      <header className="anteup-header">
        <h1 className="anteup-title">Ante Up</h1>
        <p className="anteup-subtitle">Select up to 5 cards to see what hand they make.</p>
      </header>

      <div className="anteup-hand-info">
        <span className="anteup-hand-name">{evaluation ? evaluation.name : 'Select cards…'}</span>
        <span className="anteup-hand-count">{selectedIds.length} / {MAX_SELECTED} selected</span>
      </div>

      <div className="anteup-hand">
        {hand.map((card) => (
          <Card
            key={card.id}
            card={card}
            selected={selectedIds.includes(card.id)}
            onClick={() => toggleCard(card.id)}
            disabled={!selectedIds.includes(card.id) && selectedIds.length >= MAX_SELECTED}
          />
        ))}
      </div>

      <button className="anteup-redeal" onClick={dealNewHand}>
        New Hand
      </button>
    </main>
  )
}