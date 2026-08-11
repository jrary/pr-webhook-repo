"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { useClearActualMutation, useRecordActualMutation } from "@/api/queries/time-block"
import type { RecordApi } from "@/components/features/time-block-grid"

/** Server-backed recording actions for the timeline grid. */
export function useRecordApi(): RecordApi {
  const recordActual = useRecordActualMutation()
  const clearActual = useClearActualMutation()

  return useMemo(() => {
    const onError = (error: Error) => toast.error(error.message)
    return {
      markPlanned: (block) =>
        recordActual.mutate(
          { blockId: Number(block.id), body: { actualStart: block.start, actualEnd: block.end } },
          { onError },
        ),
      setActual: (blockId, actual) =>
        actual
          ? recordActual.mutate(
              { blockId: Number(blockId), body: { actualStart: actual.start, actualEnd: actual.end } },
              { onError },
            )
          : clearActual.mutate(Number(blockId), { onError }),
    }
  }, [recordActual, clearActual])
}
