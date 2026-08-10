"use client"

import { useMemo } from "react"
import { usePlannerStore } from "@/lib/store"
import type { RecordApi } from "@/components/features/time-block-grid"

/** Store-backed recording actions for the timeline grid. */
export function useRecordApi(): RecordApi {
  const setActual = usePlannerStore((s) => s.setActual)
  const markAsPlanned = usePlannerStore((s) => s.markAsPlanned)

  return useMemo(
    () => ({ setActual, markPlanned: markAsPlanned }),
    [setActual, markAsPlanned],
  )
}
