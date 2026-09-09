export default function SpiderCard({ card, onClick, clearing, hinted, style }) {
  if (!card.faceUp) {
    return <div className="spider-card spider-card-back is-dealt" style={style} />
  }

  const isRed = card.suit === '♥' || card.suit === '♦'
  const isFace = ['J', 'Q', 'K'].includes(card.rank)
  const isAce = card.rank === 'A'

  const stateClass = clearing ? 'is-clearing' : hinted ? 'is-hinted' : ''

  return (
    <button
      type="button"
      className={`spider-card spider-card-face is-dealt ${stateClass}`}
      data-color={isRed ? 'red' : 'black'}
      onClick={onClick}
      style={style}
    >
      <span className="sc-corner">
        <span className="sc-rank">{card.rank}</span>
        <span className="sc-suit">{card.suit}</span>
      </span>
      <span className="sc-center">
        {(isFace || isAce) && <span className="sc-ornament" aria-hidden="true" />}
        <span className="sc-center-suit">{card.suit}</span>
        {(isFace || isAce) && <span className="sc-center-letter">{card.rank}</span>}
      </span>
    </button>
  )
}