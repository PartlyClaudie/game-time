import { Link } from 'react-router-dom'
import SpiderCard from './SpiderCard.jsx'
import { useSpider } from './useSpider.js'
import './Spider.css'

const DIFFICULTY_LABELS = { 1: '1 Suit', 2: '2 Suits', 4: '4 Suits' }

export default function Spider() {
  const {
    difficulty,
    columns,
    stock,
    foundations,
    moveCount,
    status,
    toast,
    shakingCardId,
    canDeal,
    startNewGame,
    handleCardClick,
    dealFromStock,
  } = useSpider()

  return (
    <main className="spider-wrap">
      <Link to="/" className="spider-back">
        ‹ Hub
      </Link>

      <header className="spider-header">
        <h1 className="spider-title">Spider Solitaire</h1>
        <p className="spider-subtitle">Click a card to send it to a valid spot automatically.</p>
      </header>

      <div className="spider-controls">
        <div className="spider-difficulty">
          {[1, 2, 4].map((n) => (
            <button key={n} className={difficulty === n ? 'is-active' : ''} onClick={() => startNewGame(n)}>
              {DIFFICULTY_LABELS[n]}
            </button>
          ))}
        </div>
        <button className="spider-newgame" onClick={() => startNewGame(difficulty)}>
          New Game
        </button>
      </div>

      <div className="spider-stats-row">
        <div className="spider-stat">
          <span>Sequences</span>
          <strong>{foundations.length} / 8</strong>
        </div>
        <div className="spider-stat">
          <span>Moves</span>
          <strong>{moveCount}</strong>
        </div>
        <div className="spider-stat spider-stat-stock">
          <span>Stock</span>
          <div
            className={`spider-stockpile ${canDeal ? 'is-ready' : 'is-disabled'}`}
            onClick={dealFromStock}
            title={canDeal ? 'Deal a new row' : 'Clear all empty columns before dealing'}
          >
            <div className="spider-stockpile-layer back2" />
            <div className="spider-stockpile-layer back1" />
            <div className="spider-stockpile-layer front">
              <span className="spider-stockpile-count">{stock.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="spider-table">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="spider-column" style={{ '--stack-count': Math.max(column.length, 1) }}>
            {column.map((card, cardIndex) => (
              <SpiderCard
                key={card.id}
                card={card}
                shaking={shakingCardId === card.id}
                onClick={() => handleCardClick(colIndex, cardIndex)}
                style={{ '--index': cardIndex }}
              />
            ))}
          </div>
        ))}
      </div>

      {toast && <div className="spider-toast">{toast}</div>}

      {status === 'won' && (
        <div className="spider-overlay">
          <p>You cleared the board!</p>
          <span className="spider-overlay-stat">{moveCount} moves</span>
          <button onClick={() => startNewGame(difficulty)}>Play Again</button>
        </div>
      )}
    </main>
  )
}