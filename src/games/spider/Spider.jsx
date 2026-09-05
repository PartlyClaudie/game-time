import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SpiderCard from './SpiderCard.jsx'
import { useSpider } from './useSpider.js'
import './Spider.css'

const DIFFICULTY_LABELS = { 1: '1 Suit', 2: '2 Suits', 4: '4 Suits' }
const GAP = 8
const MIN_CELL = 48
const MAX_CELL = 190

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
    clearingIds,
    canDeal,
    startNewGame,
    handleCardClick,
    dealFromStock,
  } = useSpider()

  const tableRef = useRef(null)
  const [cellWidth, setCellWidth] = useState(70)

  useEffect(() => {
    const el = tableRef.current
    if (!el) return

    function recompute() {
      const available = el.clientWidth
      const raw = (available - GAP * 9) / 10
      setCellWidth(Math.max(MIN_CELL, Math.min(MAX_CELL, raw)))
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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

      <div ref={tableRef} className="spider-table" style={{ '--cell-w': `${cellWidth}px` }}>
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="spider-column" style={{ '--stack-count': Math.max(column.length, 1) }}>
            {column.map((card, cardIndex) => (
              <SpiderCard
                key={card.id}
                card={card}
                shaking={shakingCardId === card.id}
                clearing={clearingIds.includes(card.id)}
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