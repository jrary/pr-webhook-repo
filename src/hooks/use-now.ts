"use client"

import { useEffect, useState } from "react"

/** Current time, refreshed on an interval. `null` until mounted, so SSR stays stable. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
