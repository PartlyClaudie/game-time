import { canPlaceOn, checkCompletedSequence, isValidRun } from './solitaireLogic.js'

export function isProductiveMove(columns, fromCol, cardIndex, toCol) {
  const source = columns[fromCol]
  const dest = columns[toCol]
  const flipsCard = cardIndex > 0 && !source[cardIndex - 1].faceUp
  const emptiesSource = cardIndex === 0
  const destTop = dest.length > 0 ? dest[dest.length - 1] : null
  const matchesSuit = destTop !== null && destTop.suit === source[cardIndex].suit
  const destIsEmpty = dest.length === 0
  return flipsCard || emptiesSource || matchesSuit || destIsEmpty
}

export function findProductiveMoves(columns) {
  const moves = []
  columns.forEach((source, fromCol) => {
    for (let cardIndex = 0; cardIndex < source.length; cardIndex++) {
      const card = source[cardIndex]
      if (!card.faceUp || !isValidRun(source, cardIndex)) continue
      columns.forEach((dest, toCol) => {
        if (toCol === fromCol || !canPlaceOn(dest, card)) return
        if (isProductiveMove(columns, fromCol, cardIndex, toCol)) {
          moves.push({ fromCol, cardIndex, toCol })
        }
      })
    }
  })
  return moves
}

function rankMove(columns, move) {
  const { fromCol, cardIndex, toCol } = move
  const source = columns[fromCol]
  const dest = columns[toCol]
  const run = source.slice(cardIndex)
  const destAfter = [...dest, ...run]
  if (checkCompletedSequence(destAfter)) return 0
  if (cardIndex > 0 && !source[cardIndex - 1].faceUp) return 1
  if (cardIndex === 0) return 2
  const destTop = dest.length > 0 ? dest[dest.length - 1] : null
  if (destTop && destTop.suit === run[0].suit) return 3
  return 4
}

export function findBestHint(columns) {
  const moves = findProductiveMoves(columns)
  if (moves.length === 0) return null
  return moves.reduce((best, m) => (rankMove(columns, m) < rankMove(columns, best) ? m : best), moves[0])
}