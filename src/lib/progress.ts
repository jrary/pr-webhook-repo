import { dateKey } from "./utils"
import type { Habit, TimeBlock, Todo } from "./types"

/** Fallback block length when a todo has no estimate. */
export const DEFAULT_ESTIMATE_MIN = 30

/** A start within this many minutes of the plan still counts as on time. */
export const ON_TIME_TOLERANCE_MIN = 15

export interface ProgressSource {
  todos: Todo[]
  habits: Habit[]
  blocks: TimeBlock[]
}

/**
 * The day's headline numbers. Rates come from the server so every screen agrees
 * on them; the counts next to each bar are read off the same day's lists.
 */
export interface Progress {
  /** 0-100 */
  todoRate: number
  habitRate: number
  /** share of planned minutes actually executed, 0-100 */
  planRate: number
  overall: number

  todoDone: number
  todoTotal: number
  habitDone: number
  habitTotal: number
  plannedMinutes: number
  doneMinutes: number
}

/** The interval a block occupies on screen: what really happened, else the plan. */
export function effectiveInterval(block: TimeBlock) {
  if (!block.actual) return { start: block.start, end: block.end, isActual: false }
  return { start: block.actual.start, end: block.actual.end, isActual: true }
}

/**
 * Whether a block counts as executed: a recorded actual, or a linked todo/habit
 * that was checked off without recording times.
 */
export function isBlockDone(block: TimeBlock, src: ProgressSource): boolean {
  if (block.actual) return true
  if (block.source?.type === "todo") {
    return src.todos.find((t) => t.id === block.source!.refId)?.done ?? false
  }
  if (block.source?.type === "habit") {
    return src.habits.find((h) => h.id === block.source!.refId)?.loggedToday ?? false
  }
  return false
}

/** A block whose end time has passed but which was never executed. */
export function isBlockMissed(block: TimeBlock, src: ProgressSource, now = new Date()): boolean {
  if (block.spontaneous) return false
  const todayKey = dateKey(now)
  if (block.date > todayKey) return false
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (block.date === todayKey && block.end > nowMin) return false
  return !isBlockDone(block, src)
}

/** Server-side rates for one day, as returned by `GET /api/stats/days/{date}`. */
export interface DayRates {
  todoRate?: number
  habitRate?: number
  planRate?: number
  overallRate?: number
}

/** Combine the server's rates with the counts the bars show underneath them. */
export function progressOf(rates: DayRates | undefined, src: ProgressSource): Progress {
  const planned = src.blocks.filter((b) => !b.spontaneous)
  let plannedMinutes = 0
  let doneMinutes = 0
  for (const block of planned) {
    const minutes = block.end - block.start
    plannedMinutes += minutes
    if (isBlockDone(block, src)) doneMinutes += minutes
  }

  return {
    todoRate: Math.round(rates?.todoRate ?? 0),
    habitRate: Math.round(rates?.habitRate ?? 0),
    planRate: Math.round(rates?.planRate ?? 0),
    overall: Math.round(rates?.overallRate ?? 0),
    todoDone: src.todos.filter((t) => t.done).length,
    todoTotal: src.todos.length,
    habitDone: src.habits.filter((h) => h.loggedToday).length,
    habitTotal: src.habits.length,
    plannedMinutes,
    doneMinutes,
  }
}
