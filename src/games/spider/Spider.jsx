import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SpiderCard from './SpiderCard.jsx'
import { useSpider } from './useSpider.js'
import './Spider.css'

const DIFFICULTY_LABELS = { 1: '1 Suit', 2: '2 Suits', 4: '4 Suits' }

const GAP = 8
const MIN_CELL = 44
const MAX_CELL = 140
const BOTTOM_MARGIN = 24

const BASE_FACEUP_RATIO = 0.3
const BASE_FACEDOWN_RATIO = 0.13
const MIN_FACEUP_RATIO = 0.16
const MIN_FACEDOWN_RATIO = 0.06

function computeColumnLayout(column, cardHeight, compression) {
  const faceUpOffset = Math.max(cardHeight * MIN_FACEUP_RATIO, cardHeight * BASE_FACEUP_RATIO * compression)
  const faceDownOffset = Math.max(cardHeight * MIN_FACEDOWN_RATIO, cardHeight * BASE_FACEDOWN_RATIO * compression)

  const tops = []
  let cumulative = 0
  column.forEach((card, i) => {
    tops.push(cumulative)
    if (i < column.length - 1) {
      cumulative += card.faceUp ? faceUpOffset : faceDownOffset
    }
  })
  const totalHeight = column.length === 0 ? cardHeight : cumulative + cardHeight
  return { tops, totalHeight }
}

function naturalColumnHeight(column, cardHeight) {
  return computeColumnLayout(column, cardHeight, 1).totalHeight
}

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
  const [availableHeight, setAvailableHeight] = useState(600)

  useEffect(() => {
    const el = tableRef.current
    if (!el) return

    function recomputeWidth() {
      const available = el.clientWidth
      const raw = (available - GAP * 9) / 10
      setCellWidth(Math.max(MIN_CELL, Math.min(MAX_CELL, raw)))
    }

    recomputeWidth()
    const observer = new ResizeObserver(recomputeWidth)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function recomputeHeight() {
      const el = tableRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const documentTopOffset = rect.top + window.scrollY
      const height = window.innerHeight - documentTopOffset - BOTTOM_MARGIN
      setAvailableHeight(Math.max(200, height))
    }

    recomputeHeight()
    window.addEventListener('resize', recomputeHeight)
    return () => window.removeEventListener('resize', recomputeHeight)
  }, [])

  const cardHeight = cellWidth * 1.4

  const columnLayouts = useMemo(() => {
    const maxNatural = Math.max(...columns.map((col) => naturalColumnHeight(col, cardHeight)), cardHeight)
    const compression = maxNatural > availableHeight ? availableHeight / maxNatural : 1
    return columns.map((col) => computeColumnLayout(col, cardHeight, compression))
  }, [columns, cardHeight, availableHeight])

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
        {columns.map((column, colIndex) => {
          const layout = columnLayouts[colIndex]
          return (
            <div
              key={colIndex}
              className="spider-column"
              style={{ height: `${layout.totalHeight}px` }}
            >
              {column.map((card, cardIndex) => (
                <SpiderCard
                  key={card.id}
                  card={card}
                  shaking={shakingCardId === card.id}
                  clearing={clearingIds.includes(card.id)}
                  onClick={() => handleCardClick(colIndex, cardIndex)}
                  style={{ top: `${layout.tops[cardIndex]}px`, height: `${cardHeight}px` }}
                />
              ))}
            </div>
          )
        })}
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