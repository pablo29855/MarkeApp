import { useEffect, useRef, useState } from 'react'

/**
 * Anima un número desde 0 hasta `value` con easing easeOutCubic.
 * Respeta `prefers-reduced-motion`: si está activo, devuelve el valor final
 * de inmediato sin animar.
 *
 * @param value    valor final
 * @param duration duración en ms (por defecto 1400)
 * @returns        valor actual animado (number)
 */
export function useCountUp(value: number, duration = 1400): number {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    // Respeta accesibilidad: sin animación si el usuario lo pidió
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || !Number.isFinite(value) || value === 0) {
      setDisplay(value || 0)
      return
    }

    startRef.current = null

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const t = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  return display
}
