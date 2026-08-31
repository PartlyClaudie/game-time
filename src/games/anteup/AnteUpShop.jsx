import { useState } from 'react'
import { POWERUPS } from './powerups.js'
import { CARD_STYLES } from './styles.js'

export default function AnteUpShop({
  chips,
  ownedPowerups,
  ownedStyles,
  selectedStyle,
  onBuyPowerup,
  onBuyStyle,
  onEquipStyle,
  onClose,
  canAdvance,
  onAdvance,
  advanceLabel,
}) {
  const [tab, setTab] = useState('powerups')

  return (
    <div className="anteup-shop-overlay" onClick={onClose}>
      <div className="anteup-shop-inner" onClick={(e) => e.stopPropagation()}>
        <div className="anteup-shop-header">
          <h2>Shop</h2>
          <span className="anteup-shop-chips">🪙 {chips}</span>
          <button className="anteup-shop-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="anteup-shop-tabs">
          <button className={tab === 'powerups' ? 'is-active' : ''} onClick={() => setTab('powerups')}>
            Power-Ups
          </button>
          <button className={tab === 'styles' ? 'is-active' : ''} onClick={() => setTab('styles')}>
            Card Styles
          </button>
        </div>

        {tab === 'powerups' && (
          <div className="anteup-shop-list">
            {POWERUPS.map((p) => {
              const owned = ownedPowerups.includes(p.id)
              return (
                <div key={p.id} className={`anteup-shop-item ${owned ? 'is-owned' : ''}`}>
                  <span className="anteup-shop-icon">{p.icon}</span>
                  <div className="anteup-shop-item-info">
                    <p className="anteup-shop-item-name">{p.name}</p>
                    <p className="anteup-shop-item-desc">{p.description}</p>
                  </div>
                  {owned ? (
                    <span className="anteup-shop-owned-tag">Owned</span>
                  ) : (
                    <button className="anteup-shop-buy" onClick={() => onBuyPowerup(p.id, p.price)} disabled={chips < p.price}>
                      🪙 {p.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'styles' && (
          <div className="anteup-shop-list">
            {CARD_STYLES.map((s) => {
              const owned = ownedStyles.includes(s.id)
              const equipped = selectedStyle === s.id
              return (
                <div key={s.id} className={`anteup-shop-item ${owned ? 'is-owned' : ''}`}>
                  <span
                    className="anteup-shop-swatch"
                    style={{ background: `linear-gradient(160deg, ${s.bgFrom}, ${s.bgTo})`, borderColor: s.border }}
                  />
                  <div className="anteup-shop-item-info">
                    <p className="anteup-shop-item-name">{s.name}</p>
                  </div>
                  {owned ? (
                    <button
                      className={`anteup-shop-buy ${equipped ? 'is-equipped' : ''}`}
                      onClick={() => onEquipStyle(s.id)}
                      disabled={equipped}
                    >
                      {equipped ? 'Equipped' : 'Equip'}
                    </button>
                  ) : (
                    <button className="anteup-shop-buy" onClick={() => onBuyStyle(s.id, s.price)} disabled={chips < s.price}>
                      🪙 {s.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="anteup-shop-footer">
          {canAdvance ? (
            <button className="anteup-shop-advance" onClick={onAdvance}>
              {advanceLabel} →
            </button>
          ) : (
            <button className="anteup-shop-advance" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}