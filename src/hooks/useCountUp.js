import { useEffect, useState } from 'react'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// 숫자가 0부터 target까지 빠르게 올라가요. (토스 금액처럼) 동작 줄이기 설정이면 바로 보여줘요.
export function useCountUp(target, duration = 1300) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (reduceMotion()) {
      const frame = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(frame)
    }

    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
