import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGame2048 } from './useGame2048.js'
import { useAnimatedNumber } from './useAnimatedNumber.js'
import { UPGRADE_DEFS } from './upgrades.js'
import { getTheme } from './themes.js'
import ShopModal from './ShopModal.jsx'
import './Game2048.css'

const KEY_TO_DIRECTION = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
}

export default function Game2048() {
  const {
    dims,
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
    acquireBanner,
    undoCooldown,
    tidyCooldown,
    coins,
    ownedThemes,
    selectedTheme,
    move,
    reset,
    undo,
    tidyUp,
    confirmGameOver,
    chooseUpgrade,
    buyTheme,
    equipTheme,
  } = useGame2048()

  const [isShopOpen, setIsShopOpen] = useState(false)
  const displayedScore = useAnimatedNumber(score)
  const theme = getTheme(selectedTheme)

  useEffect(() => {
    function handleKeyDown(e) {
      if (isShopOpen) return
      const direction = KEY_TO_DIRECTION[e.key]
      if (!direction) return
      e.preventDefault()
      move(direction)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move, isShopOpen])

  const activeUpgrades = UPGRADE_DEFS.filter((u) => (upgradeStacks[u.id] || 0) > 0)
  const hasUndo = (upgradeStacks.undo || 0) > 0
  const hasTidy = (upgradeStacks.tidy || 0) > 0

  return (
    <main className="g2048-wrap">
      <div className="g2048-top-row">
        <Link to="/" className="g2048-back">
          ‹ Hub
        </Link>
        <button className="g2048-shop-open" onClick={() => setIsShopOpen(true)}>
          🛍 Shop
        </button>
      </div>

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
          <div className="g2048-score-box">
            <span>Coins</span>
            <strong>🪙 {coins}</strong>
          </div>
        </div>
      </header>

      {activeUpgrades.length > 0 && (
        <div className="g2048-upgrade-bar">
          {activeUpgrades.map((u) => (
            <button key={u.id} type="button" className="g2048-badge">
              <span>{u.icon}</span>
              <span>{u.name}</span>
              <span className="g2048-badge-stack">×{upgradeStacks[u.id]}</span>
              <span className="g2048-badge-tooltip">{u.describe(upgradeStacks[u.id])}</span>
            </button>
          ))}
        </div>
      )}

      <p className="g2048-hint">Arrow keys to play. Hit 32, 64, 128… for upgrade choices.</p>

      <div
        className={`g2048-board ${shakeClass}`}
        style={{ '--cols': dims.cols, '--rows': dims.rows }}
      >
        <div className="g2048-bg-grid">
          {Array.from({ length: dims.rows * dims.cols }).map((_, i) => (
            <div key={i} className="g2048-bg-cell" />
          ))}
        </div>

        <div className="g2048-tiles">
          {tiles.map((tile) => {
            const bg = theme.colors[tile.value] || theme.colors[2048]
            const isLight = theme.lightBg.includes(tile.value)
            return (
              <div
                key={tile.id}
                className="g2048-tile is-new"
                data-value={tile.value}
                style={{
                  '--row': tile.row,
                  '--col': tile.col,
                  background: bg,
                  color: isLight ? 'var(--ink-deep)' : 'var(--paper)',
                }}
              >
                {tile.value}
              </div>
            )
          })}
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

        {status === 'confirmingLoss' && (
          <div className="g2048-overlay">
            <p>No more moves — game over?</p>
            <div className="g2048-overlay-actions">
              <button onClick={undo} className="g2048-overlay-undo">
                ↺ Use Second Wind
              </button>
              <button onClick={confirmGameOver}>End Run</button>
            </div>
          </div>
        )}

        {(status === 'won' || status === 'lost') && !pendingChoice && (
          <div className="g2048-overlay">
            <p>{status === 'won' ? 'You hit 2048!' : 'No more moves'}</p>
            <button onClick={reset}>New Game</button>
          </div>
        )}

        {toast && <div className="g2048-toast">{toast}</div>}
      </div>

      {pendingChoice && (
        <div className="g2048-choice-overlay">
          <div className="g2048-choice-inner">
            <p className="g2048-choice-title">Milestone {pendingChoice.milestone} — pick an upgrade</p>
            <div className="g2048-choice-cards">
              {pendingChoice.options.map((opt) => {
                const tier = (upgradeStacks[opt.id] || 0) + 1
                return (
                  <button key={opt.id} className="g2048-choice-card" onClick={() => chooseUpgrade(opt.id)}>
                    <span className="g2048-choice-icon">{opt.icon}</span>
                    <span className="g2048-choice-name">{opt.name}</span>
                    <span className="g2048-choice-desc">{opt.describe(tier)}</span>
                    <span className="g2048-choice-tier">
                      Tier {tier} / {opt.maxStacks}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {acquireBanner && (
        <div className="g2048-acquire-banner">
          <span className="g2048-acquire-icon">{acquireBanner.icon}</span>
          <span className="g2048-acquire-name">
            {acquireBanner.name} — Tier {acquireBanner.tier}
          </span>
          <span className="g2048-acquire-desc">{acquireBanner.description}</span>
        </div>
      )}

      {isShopOpen && (
        <ShopModal
          coins={coins}
          ownedThemes={ownedThemes}
          selectedTheme={selectedTheme}
          onBuy={buyTheme}
          onEquip={equipTheme}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      <div className="g2048-actions">
        {hasUndo && (
          <button className="g2048-action" onClick={undo} disabled={undoCooldown > 0}>
            ↺ Undo {undoCooldown > 0 ? `(${undoCooldown})` : '(ready)'}
          </button>
        )}
        {hasTidy && (
          <button className="g2048-action" onClick={tidyUp} disabled={tidyCooldown > 0}>
            ✦ Tidy Up {tidyCooldown > 0 ? `(${tidyCooldown})` : '(ready)'}
          </button>
        )}
        <button className="g2048-reset" onClick={reset}>
          New Game
        </button>
      </div>
    </main>
  )
}