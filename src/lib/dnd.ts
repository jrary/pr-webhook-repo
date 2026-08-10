import type { PlanSourceType } from "./types"

/** Payload key used when dragging a todo/habit onto the timeline. */
export const DRAG_MIME = "application/x-dlog-plan-item"

export interface PlanItemDrag {
  type: PlanSourceType
  refId: string
  durationMin: number
}

export function encodePlanItemDrag(payload: PlanItemDrag): string {
  return JSON.stringify(payload)
}

export function decodePlanItemDrag(raw: string): PlanItemDrag | null {
  try {
    const parsed = JSON.parse(raw) as PlanItemDrag
    if (parsed?.type !== "todo" && parsed?.type !== "habit") return null
    if (!parsed.refId) return null
    return { ...parsed, durationMin: Number(parsed.durationMin) || 30 }
  } catch {
    return null
  }
}
