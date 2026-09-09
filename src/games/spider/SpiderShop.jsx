import { CARD_BACKS } from './backs.js'

export default function SpiderShop({ level, silk, ownedBacks, selectedBack, onBuy, onEquip, onClose }) {
  return (
    <div className="spider-shop-overlay" onClick={onClose}>
      <div className="spider-shop-inner" onClick={(e) => e.stopPropagation()}>
        <div className="spider-shop-header">
          <h2>Web Shop</h2>
          <span className="spider-shop-silk">🕸 {silk}</span>
          <button className="spider-shop-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <p className="spider-shop-hint">Clear sequences and win games to earn Silk and level up.</p>

        <div className="spider-shop-list">
          {CARD_BACKS.map((back) => {
            const owned = ownedBacks.includes(back.id)
            const equipped = selectedBack === back.id
            const unlocked = level >= back.unlockLevel

            return (
              <div key={back.id} className={`spider-shop-item ${owned ? 'is-owned' : ''}`}>
                <span
                  className="spider-shop-swatch"
                  style={{
                    backgroundImage: `repeating-linear-gradient(${back.angle}deg, ${back.bg1} 0px, ${back.bg1} 4px, ${back.bg2} 4px, ${back.bg2} 8px)`,
                    borderColor: back.border,
                  }}
                />
                <div className="spider-shop-item-info">
                  <p className="spider-shop-item-name">{back.name}</p>
                  {!unlocked && <p className="spider-shop-item-desc">Unlocks at Level {back.unlockLevel}</p>}
                </div>
                {!unlocked ? (
                  <span className="spider-shop-locked-tag">🔒 Lvl {back.unlockLevel}</span>
                ) : owned ? (
                  <button
                    className={`spider-shop-buy ${equipped ? 'is-equipped' : ''}`}
                    onClick={() => onEquip(back.id)}
                    disabled={equipped}
                  >
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button className="spider-shop-buy" onClick={() => onBuy(back.id, back.price)} disabled={silk < back.price}>
                    🕸 {back.price}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}