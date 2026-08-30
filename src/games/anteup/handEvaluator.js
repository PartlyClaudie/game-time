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

function groupByRank(cards) {
  const groups = {}
  cards.forEach((c) => {
    ;(groups[c.rank] ||= []).push(c)
  })
  return Object.values(groups).sort((a, b) => b.length - a.length || getRankValue(b[0].rank) - getRankValue(a[0].rank))
}

// Returns { name, rank, scoringCards } — scoringCards is the subset of the
// selection that actually contributes chip value (kickers are excluded).
export function evaluateHand(cards) {
  if (cards.length === 0) return null
  const n = cards.length
  const groupList = groupByRank(cards)
  const counts = groupList.map((g) => g.length)

  const isFlush = n === 5 && cards.every((c) => c.suit === cards[0].suit)
  const isStraight = n === 5 && checkStraight(cards)

  if (isStraight && isFlush) return { name: 'Straight Flush', rank: 8, scoringCards: cards }
  if (counts[0] === 4) return { name: 'Four of a Kind', rank: 7, scoringCards: groupList[0] }
  if (counts[0] === 3 && counts[1] === 2) return { name: 'Full House', rank: 6, scoringCards: cards }
  if (isFlush) return { name: 'Flush', rank: 5, scoringCards: cards }
  if (isStraight) return { name: 'Straight', rank: 4, scoringCards: cards }
  if (counts[0] === 3) return { name: 'Three of a Kind', rank: 3, scoringCards: groupList[0] }
  if (counts[0] === 2 && counts[1] === 2) return { name: 'Two Pair', rank: 2, scoringCards: [...groupList[0], ...groupList[1]] }
  if (counts[0] === 2) return { name: 'Pair', rank: 1, scoringCards: groupList[0] }

  const highest = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank))[0]
  return { name: 'High Card', rank: 0, scoringCards: [highest] }
}