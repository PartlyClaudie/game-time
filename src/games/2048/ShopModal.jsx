import { THEMES } from './themes.js'

export default function ShopModal({ coins, ownedThemes, selectedTheme, onBuy, onEquip, onClose }) {
  return (
    <div className="g2048-shop-overlay" onClick={onClose}>
      <div className="g2048-shop-inner" onClick={(e) => e.stopPropagation()}>
        <div className="g2048-shop-header">
          <h2>Tile Shop</h2>
          <span className="g2048-shop-coins">🪙 {coins}</span>
          <button className="g2048-shop-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="g2048-shop-hint">Earn coins from your score at the end of each run. Score Surge means more coins.</p>

        <div className="g2048-shop-grid">
          {THEMES.map((theme) => {
            const owned = ownedThemes.includes(theme.id)
            const equipped = selectedTheme === theme.id
            const swatchValues = [2, 64, 256, 2048]
            return (
              <div key={theme.id} className="g2048-shop-card">
                <div className="g2048-shop-swatches">
                  {swatchValues.map((v) => (
                    <span key={v} className="g2048-shop-swatch" style={{ background: theme.colors[v] }} />
                  ))}
                </div>
                <p className="g2048-shop-name">{theme.name}</p>
                {owned ? (
                  <button
                    className={`g2048-shop-btn ${equipped ? 'is-equipped' : ''}`}
                    onClick={() => onEquip(theme.id)}
                    disabled={equipped}
                  >
                    {equipped ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button className="g2048-shop-btn" onClick={() => onBuy(theme.id, theme.price)} disabled={coins < theme.price}>
                    Buy — 🪙 {theme.price}
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