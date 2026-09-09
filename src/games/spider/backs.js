export const CARD_BACKS = [
  { id: 'classic', name: 'Classic Web', unlockLevel: 1, price: 0, bg1: 'var(--ink)', bg2: 'var(--ink-deep)', border: 'var(--brass)', angle: 45 },
  { id: 'violet-lattice', name: 'Violet Lattice', unlockLevel: 3, price: 150, bg1: '#2a1f42', bg2: '#1b1330', border: '#b09bef', angle: 45 },
  { id: 'emerald-weave', name: 'Emerald Weave', unlockLevel: 6, price: 300, bg1: '#123324', bg2: '#0b1f17', border: '#3ecb7a', angle: 135 },
  { id: 'royal-silk', name: 'Royal Silk', unlockLevel: 10, price: 500, bg1: '#3a1f42', bg2: '#241130', border: '#e8c15a', angle: 45 },
]

export function getCardBack(id) {
  return CARD_BACKS.find((b) => b.id === id) || CARD_BACKS[0]
}