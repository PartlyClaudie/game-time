const RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function getRankValue(rank) {
  return RANK_ORDER.indexOf(rank) + 1
}

export function dealInitial(deck) {
  const columns = Array.from({ length: 10 }, () => [])
  let idx = 0
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5
    for (let i = 0; i < count; i++) {
      columns[col].push({ ...deck[idx], faceUp: i === count - 1 })
      idx++
    }
  }
  const stock = deck.slice(idx)
  return { columns, stock }
}

export function isValidRun(column, startIndex) {
  for (let k = startIndex; k < column.length - 1; k++) {
    const a = column[k]
    const b = column[k + 1]
    if (a.suit !== b.suit) return false
    if (getRankValue(a.rank) - getRankValue(b.rank) !== 1) return false
  }
  return true
}

export function canPlaceOn(destColumn, movingFirstCard) {
  if (destColumn.length === 0) return true
  const destTop = destColumn[destColumn.length - 1]
  return getRankValue(destTop.rank) === getRankValue(movingFirstCard.rank) + 1
}

export function checkCompletedSequence(column) {
  if (column.length < 13) return null
  const last13 = column.slice(-13)
  const expected = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A']
  const suit = last13[0].suit
  for (let i = 0; i < 13; i++) {
    if (last13[i].rank !== expected[i]) return null
    if (last13[i].suit !== suit) return null
    if (!last13[i].faceUp) return null
  }
  return { suit, cards: last13 }
}