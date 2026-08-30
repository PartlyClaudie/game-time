export default function Card({ card, selected, onClick, disabled, chipValue, isScoring, isKicker, leaving, style }) {
  const isRed = card.suit === '♥' || card.suit === '♦'
  const isFace = ['J', 'Q', 'K'].includes(card.rank)
  const isAce = card.rank === 'A'

  let stateClass = ''
  if (leaving) {
    stateClass = leaving === 'play' ? 'is-leaving-play' : 'is-leaving-discard'
  } else if (selected) {
    stateClass = isScoring ? 'is-scoring' : isKicker ? 'is-kicker' : 'is-selected'
  }

  return (
    <button
      type="button"
      className={`playing-card is-dealt ${stateClass}`}
      data-color={isRed ? 'red' : 'black'}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      <span className="pc-corner pc-corner-top">
        <span className="pc-rank">{card.rank}</span>
        <span className="pc-suit">{card.suit}</span>
      </span>

      <span className="pc-center">
        {(isFace || isAce) && <span className="pc-ornament" aria-hidden="true" />}
        <span className="pc-center-suit">{card.suit}</span>
        {(isFace || isAce) && <span className="pc-center-letter">{card.rank}</span>}
      </span>

      <span className="pc-corner pc-corner-bottom">
        <span className="pc-rank">{card.rank}</span>
        <span className="pc-suit">{card.suit}</span>
      </span>

      <span className="pc-chip-badge" title={`Worth ${chipValue} chips`}>
        {chipValue}
      </span>
    </button>
  )
}