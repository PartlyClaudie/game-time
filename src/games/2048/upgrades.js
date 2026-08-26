export const MILESTONES = [32, 64, 128, 256, 512, 1024]
export const COOLDOWN_BY_TIER = [20, 14, 8] // moves needed to recharge, indexed by tier-1

export const UPGRADE_DEFS = [
  {
    id: 'multiplier',
    name: 'Score Surge',
    maxStacks: 3,
    icon: '⚡',
    describe: (tier) => `+${tier * 15}% score from every merge`,
  },
  {
    id: 'luck',
    name: 'Lucky Draw',
    maxStacks: 3,
    icon: '🍀',
    describe: (tier) => `~${Math.round((1 - Math.pow(0.8, tier)) * 100)}% fewer 4-tiles spawning`,
  },
  {
    id: 'undo',
    name: 'Second Wind',
    maxStacks: 3,
    icon: '↺',
    describe: (tier) => `Free rewind, ready every ${COOLDOWN_BY_TIER[tier - 1]} moves`,
  },
  {
    id: 'shield',
    name: 'Steady Hands',
    maxStacks: 3,
    icon: '🛡',
    describe: (tier) => `${tier} auto-save${tier > 1 ? 's' : ''} from game over (clears your weakest tiles)`,
  },
  {
    id: 'tidy',
    name: 'Tidy Up',
    maxStacks: 3,
    icon: '✦',
    describe: (tier) => `Clear your smallest tile on demand, every ${COOLDOWN_BY_TIER[tier - 1]} moves`,
  },
  {
    id: 'boardGrow',
    name: 'Wider Horizons',
    maxStacks: 2,
    icon: '⛶',
    minMilestone: (currentStack) => (currentStack === 0 ? 256 : 1024),
    describe: (tier) => (tier === 1 ? 'Board grows to 5 columns wide' : 'Board grows to a full 5×5'),
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

export function pickUpgradeOptions(stacks, currentMilestone, count = 3) {
  const available = UPGRADE_DEFS.filter((u) => {
    const current = stacks[u.id] || 0
    if (current >= u.maxStacks) return false
    if (u.minMilestone && currentMilestone < u.minMilestone(current)) return false
    return true
  })
  const pool = available.length > 0 ? available : UPGRADE_DEFS.filter((u) => (stacks[u.id] || 0) < u.maxStacks)
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