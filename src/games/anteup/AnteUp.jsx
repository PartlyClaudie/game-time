import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from './Card.jsx'
import DeckViewer from './DeckViewer.jsx'
import { useAnteUp } from './useAnteUp.js'
import { getCardChipValue } from './scoring.js'
import './AnteUp.css'

export default function AnteUp() {
  const {
    hand,
    selectedIds,
    handsRemaining,
    discardsRemaining,
    roundScore,
    roundStatus,
    lastPlay,
    preview,
    blindTarget,
    sortMode,
    setSortMode,
    leavingIds,
    leavingMode,
    isResolving,
    best,
    deckCount,
    availableIds,
    toggleCard,
    playHand,
    discardCards,
    startNewRound,
    maxSelected,
  } = useAnteUp()

  const [isDeckOpen, setIsDeckOpen] = useState(false)
  const progressPct = Math.min(100, Math.round((roundScore / blindTarget) * 100))
  const scoringIds = useMemo(() => new Set((preview?.scoringCards ?? []).map((c) => c.id)), [preview])

  return (
    <main className="anteup-wrap">
      <div className="anteup-top-row">
        <Link to="/" className="anteup-back">
          ‹ Hub
        </Link>
        <button className="anteup-deck-open" onClick={() => setIsDeckOpen(true)} type="button">
          🃏 View Deck
        </button>
      </div>

      <header className="anteup-header">
        <h1 className="anteup-title">Ante Up</h1>
        <p className="anteup-subtitle">Beat the blind before you run out of hands.</p>
      </header>

      <div className="anteup-blind-panel">
        <div className="anteup-blind-row">
          <span>Blind Target</span>
          <strong>{blindTarget}</strong>
        </div>
        <div className="anteup-progress-track">
          <div className="anteup-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="anteup-blind-row anteup-blind-score">
          <span>Score</span>
          <strong>{roundScore}</strong>
        </div>
      </div>

      <div className="anteup-stats-row">
        <div className="anteup-stat">
          <span>Hands</span>
          <strong>{handsRemaining}</strong>
        </div>
        <div className="anteup-stat">
          <span>Discards</span>
          <strong>{discardsRemaining}</strong>
        </div>
        <div className="anteup-stat">
          <span>Deck</span>
          <strong>{deckCount}</strong>
        </div>
        <div className="anteup-stat">
          <span>Best</span>
          <strong>{best}</strong>
        </div>
      </div>

      <div className="anteup-hand-info">
        <span className="anteup-hand-name">{preview ? preview.name : 'Select cards…'}</span>
        {preview && (
          <span className="anteup-preview-math">
            {preview.chips} chips × {preview.mult} mult = <strong>{preview.total}</strong>
          </span>
        )}
      </div>

      <div className="anteup-sort-row">
        <span className="anteup-sort-label">Sort:</span>
        <button
          className={`anteup-sort-btn ${sortMode === 'rank' ? 'is-active' : ''}`}
          onClick={() => setSortMode('rank')}
        >
          Rank
        </button>
        <button
          className={`anteup-sort-btn ${sortMode === 'suit' ? 'is-active' : ''}`}
          onClick={() => setSortMode('suit')}
        >
          Suit
        </button>
        <span className="anteup-hint-legend">
          <span className="anteup-legend-dot is-scoring" /> scoring
          <span className="anteup-legend-dot is-kicker" /> not counted
        </span>
      </div>

      <div className="anteup-table">
        <div className="anteup-hand" style={{ '--count': hand.length }}>
          {hand.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              chipValue={getCardChipValue(card.rank)}
              selected={selectedIds.includes(card.id)}
              isScoring={scoringIds.has(card.id)}
              isKicker={selectedIds.includes(card.id) && !scoringIds.has(card.id)}
              leaving={leavingIds.includes(card.id) ? leavingMode : null}
              onClick={() => toggleCard(card.id)}
              disabled={
                roundStatus !== 'playing' ||
                isResolving ||
                (!selectedIds.includes(card.id) && selectedIds.length >= maxSelected)
              }
              style={{ '--index': index }}
            />
          ))}
        </div>

        {lastPlay && roundStatus === 'playing' && (
          <div key={lastPlay.playId} className="anteup-last-play">
            {lastPlay.name}! +{lastPlay.total}
          </div>
        )}

        {roundStatus !== 'playing' && (
          <div className="anteup-overlay">
            <p>{roundStatus === 'won' ? 'Blind Beaten!' : 'Blind Failed'}</p>
            <span className="anteup-overlay-score">Final score: {roundScore}</span>
            <button onClick={startNewRound}>{roundStatus === 'won' ? 'Next Round' : 'Try Again'}</button>
          </div>
        )}
      </div>

      <div className="anteup-actions">
        <button
          className="anteup-btn anteup-btn-secondary"
          onClick={discardCards}
          disabled={roundStatus !== 'playing' || isResolving || selectedIds.length === 0 || discardsRemaining <= 0}
        >
          Discard {discardsRemaining > 0 ? `(${discardsRemaining})` : ''}
        </button>
        <button
          className="anteup-btn anteup-btn-primary"
          onClick={playHand}
          disabled={roundStatus !== 'playing' || isResolving || selectedIds.length === 0 || handsRemaining <= 0}
        >
          Play Hand {handsRemaining > 0 ? `(${handsRemaining})` : ''}
        </button>
      </div>

      {isDeckOpen && (
        <DeckViewer availableIds={availableIds} deckCount={deckCount} onClose={() => setIsDeckOpen(false)} />
      )}
    </main>
  )
}