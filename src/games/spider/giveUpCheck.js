import { canPlaceOn, checkCompletedSequence } from './solitaireLogic.js'
import { findProductiveMoves, rankMove } from './hints.js'

function cloneColumns(columns) {
  return columns.map((col) => col.map((c) => ({ ...c })))
}

function applySimulatedMove(columns, fromCol, cardIndex, toCol) {
  const source = columns[fromCol]
  const dest = columns[toCol]
  const run = source.slice(cardIndex)

  let newSource = source.slice(0, cardIndex)
  let flipped = false
  if (newSource.length > 0 && !newSource[newSource.length - 1].faceUp) {
    newSource = [...newSource.slice(0, -1), { ...newSource[newSource.length - 1], faceUp: true }]
    flipped = true
  }

  let newDest = [...dest, ...run]
  let completed = false
  const comp = checkCompletedSequence(newDest)
  if (comp) {
    newDest = newDest.slice(0, newDest.length - 13)
    if (newDest.length > 0 && !newDest[newDest.length - 1].faceUp) {
      newDest = [...newDest.slice(0, -1), { ...newDest[newDest.length - 1], faceUp: true }]
    }
    completed = true
  }

  const nextColumns = [...columns]
  nextColumns[fromCol] = newSource
  nextColumns[toCol] = newDest
  return { columns: nextColumns, flipped, completed }
}

function applySimulatedDeal(columns, stock) {
  const dealt = stock.slice(0, 10)
  const nextColumns = columns.map((col, i) => [...col, { ...dealt[i], faceUp: true }])
  return { columns: nextColumns, stock: stock.slice(10) }
}

function signatureOf(columns) {
  return columns.map((col) => col.map((c) => c.rank + c.suit + (c.faceUp ? 1 : 0)).join(',')).join('|')
}

// Greedy 50-move lookahead: not a proof of impossibility, but a strong practical signal.
// Returns { stuck: boolean, reason: 'dead-end' | 'cycle' | 'exhausted' | 'progress-found' | 'progress-found-deal', movesSimulated: number }
export function simulateNoProgress(initialColumns, initialStock, maxMoves = 50) {
  let columns = cloneColumns(initialColumns)
  let stock = [...initialStock]
  let lastMove = null
  const seen = new Set([signatureOf(columns)])

  for (let i = 0; i < maxMoves; i++) {
    const moves = findProductiveMoves(columns)
    const canDealNow = stock.length > 0 && !columns.some((col) => col.length === 0)

    if (moves.length === 0 && !canDealNow) {
      return { stuck: true, reason: 'dead-end', movesSimulated: i }
    }

    if (moves.length > 0) {
      const sorted = [...moves].sort((a, b) => rankMove(columns, a) - rankMove(columns, b))
      const nonReversing = sorted.find(
        (m) => !(lastMove && m.fromCol === lastMove.toCol && m.toCol === lastMove.fromCol),
      )
      const chosen = nonReversing || sorted[0]

      const result = applySimulatedMove(columns, chosen.fromCol, chosen.cardIndex, chosen.toCol)
      columns = result.columns
      lastMove = { fromCol: chosen.fromCol, toCol: chosen.toCol }

      if (result.flipped || result.completed) {
        return { stuck: false, reason: 'progress-found', movesSimulated: i + 1 }
      }

      const sig = signatureOf(columns)
      if (seen.has(sig)) {
        return { stuck: true, reason: 'cycle', movesSimulated: i + 1 }
      }
      seen.add(sig)
    } else if (canDealNow) {
      const result = applySimulatedDeal(columns, stock)
      columns = result.columns
      stock = result.stock
      return { stuck: false, reason: 'progress-found-deal', movesSimulated: i + 1 }
    }
  }

  return { stuck: true, reason: 'exhausted', movesSimulated: maxMoves }
}