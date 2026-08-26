import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGame2048 } from './useGame2048.js'
import { useAnimatedNumber } from './useAnimatedNumber.js'
import { UPGRADE_DEFS } from './upgrades.js'
import './Game2048.css'

const KEY_TO_DIRECTION = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export default function Game2048() {
  const {
    tiles,
    score,
    best,
    status,
    upgradeStacks,
    pendingChoice,
    toast,
    popups,
    combo,
    shakeClass,
    undoCharges,
    tidyCharges,
    move,
    reset,
    undo,
    tidyUp,
    chooseUpgrade,
  } = useGame2048()

  const displayedScore = useAnimatedNumber(score)

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

  const activeUpgrades = UPGRADE_DEFS.filter((u) => (upgradeStacks[u.id] || 0) > 0)

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
            <strong>{displayedScore}</strong>
          </div>
          <div className="g2048-score-box">
            <span>Best</span>
            <strong>{best}</strong>
          </div>
        </div>
      </header>

      {activeUpgrades.length > 0 && (
        <div className="g2048-upgrade-bar">
          {activeUpgrades.map((u) => (
            <div key={u.id} className="g2048-badge" title={u.description}>
              <span>{u.icon}</span>
              <span>{u.name}</span>
              <span className="g2048-badge-stack">×{upgradeStacks[u.id]}</span>
            </div>
          ))}
        </div>
      )}

      <p className="g2048-hint">Arrow keys to play. Hit 32, 64, 128… for upgrade choices.</p>

      <div className={`g2048-board ${shakeClass}`}>
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

        <div className="g2048-popups">
          {popups.map((p) => (
            <div key={p.id} className="g2048-popup" style={{ '--row': p.row, '--col': p.col }}>
              +{p.amount}
            </div>
          ))}
        </div>

        {combo && (
          <div key={combo.count + Date.now()} className="g2048-combo">
            {combo.count}x COMBO!
          </div>
        )}

        {status !== 'playing' && !pendingChoice && (
          <div className="g2048-overlay">
            <p>{status === 'won' ? 'You hit 2048!' : 'No more moves'}</p>
            {status === 'lost' && undoCharges > 0 && (
              <button onClick={undo} className="g2048-overlay-undo">
                ↺ Undo instead ({undoCharges} left)
              </button>
            )}
            <button onClick={reset}>New Game</button>
          </div>
        )}

        {toast && <div className="g2048-toast">{toast}</div>}
      </div>
      {/* ^ this is the closing div of .g2048-board — the block below goes right after it */}

      {pendingChoice && (
        <div className="g2048-choice-overlay">
          <div className="g2048-choice-inner">
            <p className="g2048-choice-title">Milestone {pendingChoice.milestone} — pick an upgrade</p>
            <div className="g2048-choice-cards">
              {pendingChoice.options.map((opt) => (
                <button key={opt.id} className="g2048-choice-card" onClick={() => chooseUpgrade(opt.id)}>
                  <span className="g2048-choice-icon">{opt.icon}</span>
                  <span className="g2048-choice-name">{opt.name}</span>
                  <span className="g2048-choice-desc">{opt.description}</span>
                  <span className="g2048-choice-tier">
                    Tier {(upgradeStacks[opt.id] || 0) + 1} / {opt.maxStacks}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="g2048-actions">
        <button className="g2048-action" onClick={undo} disabled={undoCharges <= 0}>
          ↺ Undo {undoCharges > 0 ? `(${undoCharges})` : ''}
        </button>
        <button className="g2048-action" onClick={tidyUp} disabled={tidyCharges <= 0}>
          ✦ Tidy Up {tidyCharges > 0 ? `(${tidyCharges})` : ''}
        </button>
        <button className="g2048-reset" onClick={reset}>
          New Game
        </button>
      </div>
    </main>
  )
}