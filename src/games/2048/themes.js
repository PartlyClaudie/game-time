export const THEMES = [
  {
    id: 'arcade',
    name: 'Arcade Coral',
    price: 0,
    colors: { 2: '#f4ded9', 4: '#f0c5bb', 8: '#f2a390', 16: '#ef8267', 32: '#ff6b5b', 64: '#e64a34', 128: '#c73b23', 256: '#a92e18', 512: '#8c2210', 1024: '#6f180a', 2048: '#d4af37' },
    lightBg: [2, 4],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    price: 80,
    colors: { 2: '#241b3a', 4: '#33245a', 8: '#472f82', 16: '#5c37b0', 32: '#7c3fe0', 64: '#9d4bff', 128: '#3fc9ff', 256: '#00e0ff', 512: '#00ffd0', 1024: '#c8ff5b', 2048: '#ffffff' },
    lightBg: [1024, 2048],
  },
  {
    id: 'forest',
    name: 'Forest Grove',
    price: 150,
    colors: { 2: '#eef1de', 4: '#dde6bd', 8: '#c3d896', 16: '#a6c56d', 32: '#86ab4c', 64: '#688f35', 128: '#4d7226', 256: '#375816', 512: '#7a4a20', 1024: '#563314', 2048: '#e8c15a' },
    lightBg: [2, 4, 8, 2048],
  },
  {
    id: 'royal',
    name: 'Royal Gold',
    price: 250,
    colors: { 2: '#f1e6cf', 4: '#e8d19f', 8: '#dcb96e', 16: '#cf9f45', 32: '#c98a2e', 64: '#a26f24', 128: '#7d4fae', 256: '#5e3a8a', 512: '#432a66', 1024: '#281546', 2048: '#ffe08a' },
    lightBg: [2, 4, 8, 2048],
  },
]

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0]
}

export function coinsForScore(score) {
  return Math.floor(score / 50)
}