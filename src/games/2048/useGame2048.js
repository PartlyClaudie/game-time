import { useCallback, useEffect, useState } from 'react'
import { ANIMATION_MS, createInitialTiles, isGameOver, performMove, spawnRandomTile } from './gameEngine.js'

const BEST_SCORE_KEY = 'game-hub:2048:best'

export function useGame2048() {
  const [tiles, setTiles] = useState(createInitialTiles)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem(BEST_SCORE_KEY)
    return stored ? Number(stored) : 0
  })
  const [status, setStatus] = useState('playing') // 'playing' | 'won' | 'lost'
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (score > best) {
      setBest(score)
      localStorage.setItem(BEST_SCORE_KEY, String(score))
    }
  }, [score, best])

  const move = useCallback(
    (direction) => {
      if (isAnimating || status === 'lost') return
      const result = performMove(tiles, direction)
      if (!result.moved) return

      setIsAnimating(true)
      setTiles(result.slidTiles) // phase 1: slide (CSS transition animates this)

      setTimeout(() => {
        const spawned = spawnRandomTile(result.settledTiles) // phase 2: merge pop + new tile
        setTiles(spawned)
        setScore((s) => s + result.scoreGained)
        setIsAnimating(false)

        if (status !== 'won' && spawned.some((t) => t.value === 2048)) {
          setStatus('won')
        } else if (isGameOver(spawned)) {
          setStatus('lost')
        }
      }, ANIMATION_MS)
    },
    [tiles, status, isAnimating],
  )

  const reset = useCallback(() => {
    setTiles(createInitialTiles())
    setScore(0)
    setStatus('playing')
    setIsAnimating(false)
  }, [])

  return { tiles, score, best, status, move, reset }
}