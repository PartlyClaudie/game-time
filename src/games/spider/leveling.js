export function getLevelInfo(totalXP) {
  let level = 1
  let xpForNext = 100
  let remaining = totalXP
  while (remaining >= xpForNext) {
    remaining -= xpForNext
    level += 1
    xpForNext = 100 * level
  }
  return { level, currentLevelXP: remaining, xpForNextLevel: xpForNext }
}

export const DIFFICULTY_REWARDS = {
  1: { sequenceXP: 10, sequenceSilk: 8, winXP: 100, winSilk: 60 },
  2: { sequenceXP: 20, sequenceSilk: 15, winXP: 150, winSilk: 100 },
  4: { sequenceXP: 35, sequenceSilk: 25, winXP: 250, winSilk: 180 },
}