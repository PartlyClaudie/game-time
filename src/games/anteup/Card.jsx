import { CARD_STYLES } from './styles.js'

export default function Card({ card, selected, onClick, disabled, chipValue, isScoring, isKicker, leaving, locked, style, cardStyle }) {
  const isRed = card.suit === '♥' || card.suit === '♦'
  const isFace = ['J', 'Q', 'K'].includes(card.rank)
  const isAce = card.rank === 'A'
  const activeStyle = cardStyle || CARD_STYLES[0]

  let stateClass = ''
  if (leaving) {
    stateClass = leaving === 'play' ? 'is-leaving-play' : 'is-leaving-discard'
  } else if (locked && selected) {
    stateClass = 'is-locked-selected'
  } else if (locked) {
    stateClass = 'is-locked'
  } else if (selected) {
    stateClass = isScoring ? 'is-scoring' : isKicker ? 'is-kicker' : 'is-selected'
  }

  const inlineStyle = {
    ...style,
    background: `linear-gradient(160deg, ${activeStyle.bgFrom} 0%, ${activeStyle.bgTo} 100%)`,
    borderColor: activeStyle.border,
    color: isRed ? activeStyle.redText : activeStyle.blackText,
  }

  return (
    <button
      type="button"
      className={`playing-card is-dealt ${stateClass}`}
      onClick={onClick}
      disabled={disabled}
      style={inlineStyle}
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

      {locked && (
        <span className="pc-locked-overlay" aria-hidden="true">
          🚫
        </span>
      )}
    </button>
  )
}