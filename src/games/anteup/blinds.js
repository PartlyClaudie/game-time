export const ROUND_NAMES = ['Small Blind', 'Big Blind', 'Boss Blind']

export const BOSS_CHALLENGES = [
  { id: 'no-hearts', name: 'The Heartless', description: 'Hearts cannot be played this round.', type: 'lockSuit', suit: '♥' },
  { id: 'no-diamonds', name: 'The Dull Diamond', description: 'Diamonds cannot be played this round.', type: 'lockSuit', suit: '♦' },
  { id: 'no-spades', name: 'The Buried Spade', description: 'Spades cannot be played this round.', type: 'lockSuit', suit: '♠' },
  { id: 'no-clubs', name: 'The Broken Club', description: 'Clubs cannot be played this round.', type: 'lockSuit', suit: '♣' },
  { id: 'tight-squeeze', name: 'Tight Squeeze', description: 'You can only select up to 3 cards at a time.', type: 'maxSelected', value: 3 },
  { id: 'short-fuse', name: 'Short Fuse', description: 'You only get 2 hands this round.', type: 'handsOverride', value: 2 },
]

export function pickRandomChallenge() {
  return BOSS_CHALLENGES[Math.floor(Math.random() * BOSS_CHALLENGES.length)]
}

export function getSmallBlindTarget(ante) {
  return Math.round(250 * (1 + (ante - 1) * 0.5))
}

export function getBlindTarget(ante, roundIndex) {
  const small = getSmallBlindTarget(ante)
  if (roundIndex === 0) return small
  if (roundIndex === 1) return Math.round(small * 1.5)
  return Math.round(small * 2)
}