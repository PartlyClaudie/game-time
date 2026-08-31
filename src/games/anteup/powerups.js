export const POWERUPS = [
  {
    id: 'deep-breath',
    name: 'Deep Breath',
    price: 150,
    icon: '🫁',
    description: '+1 starting Hand every round (stacks with Boss Blind penalties too).',
    effect: { extraHands: 1 },
  },
  {
    id: 'quick-fingers',
    name: 'Quick Fingers',
    price: 250,
    icon: '🤞',
    description: '+1 starting Discard every round.',
    effect: { extraDiscards: 1 },
  },
  {
    id: 'high-roller',
    name: 'High Roller',
    price: 450,
    icon: '💰',
    description: '+10% to the final score of every hand you play.',
    effect: { percentBonus: 0.1 },
  },
  {
    id: 'lucky-charm',
    name: 'Lucky Charm',
    price: 700,
    icon: '🍀',
    description: '+1 flat Mult on every hand you play, regardless of type.',
    effect: { multBonus: 1 },
  },
  {
    id: 'silver-tongue',
    name: 'Silver Tongue',
    price: 1000,
    icon: '🗣',
    description: 'Boss Blind score targets are 10% lower.',
    effect: { bossTargetReduction: 0.1 },
  },
]

export function getPowerup(id) {
  return POWERUPS.find((p) => p.id === id)
}

export function computeEffects(ownedIds) {
  const owned = POWERUPS.filter((p) => ownedIds.includes(p.id))
  return owned.reduce(
    (acc, p) => ({
      extraHands: acc.extraHands + (p.effect.extraHands || 0),
      extraDiscards: acc.extraDiscards + (p.effect.extraDiscards || 0),
      percentBonus: acc.percentBonus + (p.effect.percentBonus || 0),
      multBonus: acc.multBonus + (p.effect.multBonus || 0),
      bossTargetReduction: acc.bossTargetReduction + (p.effect.bossTargetReduction || 0),
    }),
    { extraHands: 0, extraDiscards: 0, percentBonus: 0, multBonus: 0, bossTargetReduction: 0 },
  )
}

export function applyPowerupBonuses(result, effects) {
  if (!result) return result
  const mult = result.mult + effects.multBonus
  const total = Math.round(result.chips * mult * (1 + effects.percentBonus))
  return { ...result, mult, total }
}

export function getChipsEarned(roundScore, roundIndex) {
  const ROUND_TYPE_CHIP_MULT = [1, 1.2, 1.5]
  return Math.floor((roundScore / 50) * ROUND_TYPE_CHIP_MULT[roundIndex])
}