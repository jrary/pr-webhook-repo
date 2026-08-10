import { dateKey } from "./utils"
import type { TimeBlock } from "./types"

export const SLOT_MIN = 10
const DAY_MIN = 24 * 60
/** Where the day starts when scheduling on a date that is not today. */
const DAY_START = 9 * 60

function ceilToSlot(minutes: number) {
  return Math.ceil(minutes / SLOT_MIN) * SLOT_MIN
}

/**
 * First gap of `durationMin` at or after `fromMin` that no block occupies.
 * Returns null when the rest of the day is full.
 */
export function nextFreeSlot(
  blocks: TimeBlock[],
  durationMin: number,
  fromMin: number,
): number | null {
  const sorted = [...blocks].sort((a, b) => a.start - b.start)
  let candidate = ceilToSlot(Math.max(0, fromMin))

  for (const block of sorted) {
    if (block.end <= candidate) continue
    // no overlap: the gap before this block is big enough
    if (block.start - candidate >= durationMin) break
    candidate = ceilToSlot(block.end)
  }

  return candidate + durationMin <= DAY_MIN ? candidate : null
}

/**
 * Start time the "배치" action proposes: the next free slot from now on today,
 * or from the start of the day on any other date.
 */
export function defaultPlanStart(
  blocks: TimeBlock[],
  durationMin: number,
  date: Date,
  now: Date = new Date(),
): number | null {
  const isToday = dateKey(date) === dateKey(now)
  const from = isToday ? now.getHours() * 60 + now.getMinutes() : DAY_START
  return nextFreeSlot(blocks, durationMin, from) ?? nextFreeSlot(blocks, durationMin, 0)
}
