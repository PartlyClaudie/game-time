import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGame2048 } from './useGame2048.js'
import './Game2048.css'

const KEY_TO_DIRECTION = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export default function Game2048() {
  const { tiles, score, best, status, move, reset } = useGame2048()

  useEffect(() => {
    function handleKeyDown(e) {
      const direction = KEY_TO_DIRECTION[e.key]
      if (!direction) return
      e.preventDefault()
      move(direction)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move])

  return (
    <main className="g2048-wrap">
      <Link to="/" className="g2048-back">
        ‹ Hub
      </Link>

      <header className="g2048-header">
        <h1 className="g2048-title">2048</h1>
        <div className="g2048-scores">
          <div className="g2048-score-box">
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className="g2048-score-box">
            <span>Best</span>
            <strong>{best}</strong>
          </div>
        </div>
      </header>

      <p className="g2048-hint">Use the arrow keys. Combine tiles to reach 2048.</p>

      <div className="g2048-board">
        <div className="g2048-bg-grid">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="g2048-bg-cell" />
          ))}
        </div>

        <div className="g2048-tiles">
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className="g2048-tile is-new"
              data-value={tile.value}
              style={{ '--row': tile.row, '--col': tile.col }}
            >
              {tile.value}
            </div>
          ))}
        </div>

        {status !== 'playing' && (
          <div className="g2048-overlay">
            <p>{status === 'won' ? 'You hit 2048!' : 'No more moves'}</p>
            <button onClick={reset}>New Game</button>
          </div>
        )}
      </div>

      <button className="g2048-reset" onClick={reset}>
        New Game
      </button>
    </main>
  )
}