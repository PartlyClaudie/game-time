const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export function getRankValue(rank) {
  return RANK_ORDER.indexOf(rank) + 2
}

function checkStraight(cards) {
  const values = cards.map((c) => getRankValue(c.rank)).sort((a, b) => a - b)
  const unique = [...new Set(values)]
  if (unique.length !== 5) return false
  if (JSON.stringify(unique) === JSON.stringify([2, 3, 4, 5, 14])) return true // ace-low
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] !== unique[i - 1] + 1) return false
  }
  return true
}

export function evaluateHand(cards) {
  const n = cards.length
  if (n === 0) return null

  const rankCounts = {}
  cards.forEach((c) => {
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1
  })
  const counts = Object.values(rankCounts).sort((a, b) => b - a)

  const isFlush = n === 5 && cards.every((c) => c.suit === cards[0].suit)
  const isStraight = n === 5 && checkStraight(cards)

  if (isStraight && isFlush) return { name: 'Straight Flush', rank: 8 }
  if (counts[0] === 4) return { name: 'Four of a Kind', rank: 7 }
  if (counts[0] === 3 && counts[1] === 2) return { name: 'Full House', rank: 6 }
  if (isFlush) return { name: 'Flush', rank: 5 }
  if (isStraight) return { name: 'Straight', rank: 4 }
  if (counts[0] === 3) return { name: 'Three of a Kind', rank: 3 }
  if (counts[0] === 2 && counts[1] === 2) return { name: 'Two Pair', rank: 2 }
  if (counts[0] === 2) return { name: 'Pair', rank: 1 }
  return { name: 'High Card', rank: 0 }
}