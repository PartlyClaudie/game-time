import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SpiderCard from './SpiderCard.jsx'
import SpiderShop from './SpiderShop.jsx'
import { useSpider } from './useSpider.js'
import { getCardBack } from './backs.js'
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
    shakingCols,
    clearingIds,
    pendingTargets,
    hintCardId,
    hintTargetCol,
    hintStock,
    canDeal,
    canUndo,
    undoCount,
    xp,
    silk,
    ownedBacks,
    selectedBack,
    levelInfo,
    startNewGame,
    handleCardClick,
    handleColumnAreaClick,
    dealFromStock,
    undo,
    requestHint,
    giveUpPrompt,
    requestGiveUp,
    confirmGiveUp,
    cancelGiveUp,
    buyBack,
    equipBack,
  } = useSpider()

  const [isShopOpen, setIsShopOpen] = useState(false)
  const tableRef = useRef(null)
  const [cellWidth, setCellWidth] = useState(70)
  const [availableHeight, setAvailableHeight] = useState(600)
  const cardBack = getCardBack(selectedBack)

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
      const documentTopOffset = el.getBoundingClientRect().top
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

  const xpPct = Math.round((levelInfo.currentLevelXP / levelInfo.xpForNextLevel) * 100)

  return (
    <main className="spider-wrap">
      <div className="spider-top-row">
        <Link to="/" className="spider-back">
          ‹ Hub
        </Link>
        <button className="spider-shop-open" onClick={() => setIsShopOpen(true)} type="button">
          🕸 Shop
        </button>
      </div>

      <header className="spider-header">
        <h1 className="spider-title">Spider Solitaire</h1>
        <p className="spider-subtitle">Click a card to move it — if more than one spot works, pick one.</p>
      </header>

      <div className="spider-level-panel">
        <div className="spider-level-row">
          <span>Level {levelInfo.level}</span>
          <span className="spider-silk-display">🕸 {silk} Silk</span>
        </div>
        <div className="spider-xp-track">
          <div className="spider-xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <div className="spider-level-row spider-xp-label">
          <span>
            {levelInfo.currentLevelXP} / {levelInfo.xpForNextLevel} XP
          </span>
        </div>
      </div>

      <div className="spider-controls">
        <div className="spider-difficulty">
          {[1, 2, 4].map((n) => (
            <button key={n} className={difficulty === n ? 'is-active' : ''} onClick={() => startNewGame(n)}>
              {DIFFICULTY_LABELS[n]}
            </button>
          ))}
        </div>
        <div className="spider-action-btns">
          <button className="spider-hint-btn" onClick={requestHint} disabled={status !== 'playing'}>
            💡 Hint
          </button>
          <button className="spider-undo-btn" onClick={undo} disabled={!canUndo || status !== 'playing'}>
            ↺ Undo {undoCount > 0 ? `(${undoCount})` : ''}
          </button>
          <button className="spider-giveup-btn" onClick={requestGiveUp} disabled={status !== 'playing'}>
            🏳 Give Up
          </button>
          <button className="spider-newgame" onClick={() => startNewGame(difficulty)}>
            New Game
          </button>
        </div>
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
            className={`spider-stockpile ${canDeal ? 'is-ready' : 'is-disabled'} ${hintStock ? 'is-hinted' : ''}`}
            onClick={dealFromStock}
            title={canDeal ? 'Deal a new row' : 'Clear all empty columns before dealing'}
          >
            <div
              className="spider-stockpile-layer back2"
              style={{
                backgroundImage: `repeating-linear-gradient(${cardBack.angle}deg, ${cardBack.bg1} 0px, ${cardBack.bg1} 4px, ${cardBack.bg2} 4px, ${cardBack.bg2} 8px)`,
                borderColor: cardBack.border,
              }}
            />
            <div
              className="spider-stockpile-layer back1"
              style={{
                backgroundImage: `repeating-linear-gradient(${cardBack.angle}deg, ${cardBack.bg1} 0px, ${cardBack.bg1} 4px, ${cardBack.bg2} 4px, ${cardBack.bg2} 8px)`,
                borderColor: cardBack.border,
              }}
            />
            <div
              className="spider-stockpile-layer front"
              style={{
                backgroundImage: `repeating-linear-gradient(${cardBack.angle}deg, ${cardBack.bg1} 0px, ${cardBack.bg1} 4px, ${cardBack.bg2} 4px, ${cardBack.bg2} 8px)`,
                borderColor: cardBack.border,
              }}
            >
              <span className="spider-stockpile-count">{stock.length}</span>
            </div>
            {hintStock && <div className="spider-hint-label spider-hint-label-stock">⬇ Deal here</div>}
          </div>
        </div>
      </div>

      <div ref={tableRef} className="spider-table" style={{ '--cell-w': `${cellWidth}px` }}>
        {columns.map((column, colIndex) => {
          const layout = columnLayouts[colIndex]
          const isPendingTarget = pendingTargets.includes(colIndex)
          const isHintTarget = hintTargetCol === colIndex
          const isShaking = shakingCols.includes(colIndex)
          return (
            <div
              key={colIndex}
              className={`spider-column ${isPendingTarget ? 'is-pending-target' : ''} ${isHintTarget ? 'is-hint-target' : ''} ${isShaking ? 'is-shaking' : ''}`}
              style={{ height: `${layout.totalHeight}px` }}
              onClick={() => handleColumnAreaClick(colIndex)}
            >
              {isHintTarget && <div className="spider-hint-label">⬇ Place here</div>}
              {column.map((card, cardIndex) => (
                <SpiderCard
                  key={card.id}
                  card={card}
                  cardBack={cardBack}
                  clearing={clearingIds.includes(card.id)}
                  hinted={hintCardId === card.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick(colIndex, cardIndex)
                  }}
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

      {status === 'lost' && (
        <div className="spider-overlay spider-overlay-lost">
          <p>No Moves Left</p>
          <span className="spider-overlay-stat">
            {foundations.length} / 8 sequences · {moveCount} moves
          </span>
          <div className="spider-overlay-actions">
            <button onClick={undo} disabled={!canUndo}>
              ↺ Undo
            </button>
            <button onClick={() => startNewGame(difficulty)}>New Game</button>
          </div>
        </div>
      )}

      {isShopOpen && (
        <SpiderShop
          level={levelInfo.level}
          silk={silk}
          ownedBacks={ownedBacks}
          selectedBack={selectedBack}
          onBuy={buyBack}
          onEquip={equipBack}
          onClose={() => setIsShopOpen(false)}
        />
      )}
      {giveUpPrompt && (
        <div className="spider-confirm-overlay" onClick={cancelGiveUp}>
          <div className="spider-confirm-inner" onClick={(e) => e.stopPropagation()}>
            <p className="spider-confirm-title">Are you sure?</p>
            <p className="spider-confirm-body">
              There's still a path forward from here — giving up now means walking away from a winnable position.
            </p>
            <div className="spider-confirm-actions">
              <button className="spider-confirm-cancel" onClick={cancelGiveUp}>
                Keep Playing
              </button>
              <button className="spider-confirm-confirm" onClick={confirmGiveUp}>
                Give Up Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}