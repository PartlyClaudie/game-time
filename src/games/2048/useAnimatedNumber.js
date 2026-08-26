import { useEffect, useRef, useState } from 'react'

// Smoothly counts a displayed number up (or down) toward `target` whenever it changes.
export function useAnimatedNumber(target, duration = 400) {
  const [display, setDisplay] = useState(target)
  const frameRef = useRef(null)
  const fromRef = useRef(target)
  const startRef = useRef(null)

  useEffect(() => {
    fromRef.current = display
    startRef.current = null

    function tick(timestamp) {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      const value = Math.round(fromRef.current + (target - fromRef.current) * eased)
      setDisplay(value)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return display
}