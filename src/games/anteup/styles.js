export const CARD_STYLES = [
  {
    id: 'classic',
    name: 'Classic Ivory',
    price: 0,
    bgFrom: '#f7f2e7',
    bgTo: '#ede4cf',
    border: 'rgba(212, 175, 55, 0.5)',
    blackText: '#1b1f2a',
    redText: '#ff6b5b',
  },
  {
    id: 'noir',
    name: 'Midnight Noir',
    price: 200,
    bgFrom: '#2e3444',
    bgTo: '#1b1f2a',
    border: 'rgba(212, 175, 55, 0.6)',
    blackText: '#ede7dc',
    redText: '#ff8a7a',
  },
  {
    id: 'emerald',
    name: 'Emerald Table',
    price: 350,
    bgFrom: '#eef6ec',
    bgTo: '#d2e8c9',
    border: 'rgba(46, 140, 86, 0.6)',
    blackText: '#1b1f2a',
    redText: '#d1453a',
  },
  {
    id: 'royal',
    name: 'Royal Velvet',
    price: 500,
    bgFrom: '#f2e6f7',
    bgTo: '#ddc7ea',
    border: 'rgba(150, 90, 190, 0.6)',
    blackText: '#2a1b3d',
    redText: '#c23b6b',
  },
]

export function getCardStyle(id) {
  return CARD_STYLES.find((s) => s.id === id) || CARD_STYLES[0]
}