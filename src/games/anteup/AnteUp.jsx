import { Link } from 'react-router-dom'
import Card from './Card.jsx'
import { useAnteUp } from './useAnteUp.js'
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
    toggleCard,
    playHand,
    discardCards,
    startNewRound,
    maxSelected,
  } = useAnteUp()

  const progressPct = Math.min(100, Math.round((roundScore / blindTarget) * 100))

  return (
    <main className="anteup-wrap">
      <Link to="/" className="anteup-back">
        ‹ Hub
      </Link>

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
      </div>

      <div className="anteup-hand-info">
        <span className="anteup-hand-name">{preview ? preview.name : 'Select cards…'}</span>
        {preview && (
          <span className="anteup-preview-math">
            {preview.chips} chips × {preview.mult} mult = <strong>{preview.total}</strong>
          </span>
        )}
      </div>

      <div className="anteup-table">
        <div className="anteup-hand">
          {hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              selected={selectedIds.includes(card.id)}
              onClick={() => toggleCard(card.id)}
              disabled={roundStatus !== 'playing' || (!selectedIds.includes(card.id) && selectedIds.length >= maxSelected)}
            />
          ))}
        </div>

        {lastPlay && roundStatus === 'playing' && (
          <div key={Date.now()} className="anteup-last-play">
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
          disabled={roundStatus !== 'playing' || selectedIds.length === 0 || discardsRemaining <= 0}
        >
          Discard {discardsRemaining > 0 ? `(${discardsRemaining})` : ''}
        </button>
        <button
          className="anteup-btn anteup-btn-primary"
          onClick={playHand}
          disabled={roundStatus !== 'playing' || selectedIds.length === 0 || handsRemaining <= 0}
        >
          Play Hand {handsRemaining > 0 ? `(${handsRemaining})` : ''}
        </button>
      </div>
    </main>
  )
}