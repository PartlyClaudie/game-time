const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

let idCounter = 1
function nextId() {
  idCounter += 1
  return `spider-${idCounter}`
}

export function createSpiderDeck(suitCount) {
  const suitSets = { 1: ['♠'], 2: ['♠', '♥'], 4: ['♠', '♥', '♦', '♣'] }
  const suits = suitSets[suitCount]
  const copiesPerSuit = 8 / suits.length // always yields 104 cards total

  const deck = []
  for (let copy = 0; copy < copiesPerSuit; copy++) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        deck.push({ id: nextId(), rank, suit, faceUp: false })
      }
    }
  }
  return deck
}

export function shuffleDeck(deck) {
  const next = [...deck]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}