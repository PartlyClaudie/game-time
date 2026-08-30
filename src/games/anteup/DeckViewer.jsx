const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const SUITS = ['♠', '♥', '♦', '♣']

export default function DeckViewer({ availableIds, deckCount, onClose }) {
  return (
    <div className="deckview-overlay" onClick={onClose}>
      <div className="deckview-inner" onClick={(e) => e.stopPropagation()}>
        <div className="deckview-header">
          <h2>Deck</h2>
          <span className="deckview-count">{deckCount} left to draw</span>
          <button className="deckview-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="deckview-grid">
          {SUITS.map((suit) => (
            <div key={suit} className="deckview-row">
              {RANKS.map((rank) => {
                const id = `${rank}-${suit}`
                const isAvailable = availableIds.has(id)
                const isRed = suit === '♥' || suit === '♦'
                return (
                  <span
                    key={id}
                    className={`deckview-chip ${isAvailable ? 'is-available' : 'is-used'}`}
                    data-color={isRed ? 'red' : 'black'}
                  >
                    {rank}
                    {suit}
                  </span>
                )
              })}
            </div>
          ))}
        </div>

        <p className="deckview-hint">Dimmed cards have already been played or discarded this round.</p>
      </div>
    </div>
  )
}