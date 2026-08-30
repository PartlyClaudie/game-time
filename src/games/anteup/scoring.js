import { evaluateHand } from './handEvaluator.js'

export const HAND_BASE_VALUES = {
  'High Card': { chips: 5, mult: 1 },
  Pair: { chips: 10, mult: 2 },
  'Two Pair': { chips: 20, mult: 2 },
  'Three of a Kind': { chips: 30, mult: 3 },
  Straight: { chips: 30, mult: 4 },
  Flush: { chips: 35, mult: 4 },
  'Full House': { chips: 40, mult: 4 },
  'Four of a Kind': { chips: 60, mult: 7 },
  'Straight Flush': { chips: 100, mult: 8 },
}

export function getCardChipValue(rank) {
  if (rank === 'A') return 11
  if (['J', 'Q', 'K'].includes(rank)) return 10
  return Number(rank)
}

export function scoreHand(cards) {
  const evaluation = evaluateHand(cards)
  if (!evaluation) return null
  const base = HAND_BASE_VALUES[evaluation.name]
  const cardChips = evaluation.scoringCards.reduce((sum, c) => sum + getCardChipValue(c.rank), 0)
  const chips = base.chips + cardChips
  const mult = base.mult
  return { ...evaluation, chips, mult, total: chips * mult }
}