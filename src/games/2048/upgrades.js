export const MILESTONES = [32, 64, 128, 256, 512, 1024]

export const UPGRADE_DEFS = [
  {
    id: 'multiplier',
    name: 'Score Surge',
    maxStacks: 3,
    icon: '⚡',
    description: '+15% score from every merge',
  },
  {
    id: 'luck',
    name: 'Lucky Draw',
    maxStacks: 3,
    icon: '🍀',
    description: 'Fewer 4-tiles spawn — more clean 2s',
  },
  {
    id: 'undo',
    name: 'Second Wind',
    maxStacks: 3,
    icon: '↺',
    description: '+1 charge to undo your last move',
  },
  {
    id: 'shield',
    name: 'Steady Hands',
    maxStacks: 3,
    icon: '🛡',
    description: 'Auto-saves you from one game over by clearing your 4 weakest tiles',
  },
  {
    id: 'tidy',
    name: 'Tidy Up',
    maxStacks: 3,
    icon: '✦',
    description: '+1 charge to instantly clear your smallest tile, on demand',
  },
]

export function getUpgrade(id) {
  return UPGRADE_DEFS.find((u) => u.id === id)
}

export function getMultiplier(stacks) {
  return 1 + 0.15 * (stacks.multiplier || 0)
}

export function getFourChance(stacks) {
  const n = stacks.luck || 0
  return 0.1 * Math.pow(0.8, n)
}

export function detectNewMilestone(tiles, reachedSet) {
  const maxValue = tiles.reduce((m, t) => Math.max(m, t.value), 0)
  return MILESTONES.find((m) => maxValue >= m && !reachedSet.has(m)) || null
}

export function pickUpgradeOptions(stacks, count = 3) {
  const available = UPGRADE_DEFS.filter((u) => (stacks[u.id] || 0) < u.maxStacks)
  const pool = available.length > 0 ? available : UPGRADE_DEFS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function applyShieldClear(tiles) {
  const sorted = [...tiles].sort((a, b) => a.value - b.value)
  const toRemove = new Set(sorted.slice(0, Math.min(4, tiles.length)).map((t) => t.id))
  return tiles.filter((t) => !toRemove.has(t.id))
}

export function tidyRemoveSmallest(tiles) {
  if (tiles.length === 0) return tiles
  const min = Math.min(...tiles.map((t) => t.value))
  const idx = tiles.findIndex((t) => t.value === min)
  const next = [...tiles]
  next.splice(idx, 1)
  return next
}