'use client'

import { useEffect, useState } from 'react'

/** Current time, updated at each minute boundary. Null until mounted to avoid hydration mismatch. */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const tick = () => {
      const current = new Date()
      setNow(current)
      timeout = setTimeout(tick, 60_000 - (current.getSeconds() * 1000 + current.getMilliseconds()))
    }
    tick()
    return () => clearTimeout(timeout)
  }, [])

  return now
}

export function formatTime(date: Date | null) {
  if (!date) return '--:--'
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatDate(date: Date | null) {
  if (!date) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}
