import { dateKey } from "./utils"
import type { Habit, TimeBlock, Todo } from "./types"

/** Fallback block length when a todo has no estimate. */
export const DEFAULT_ESTIMATE_MIN = 30

/** Weights used when a day has planned time blocks. */
const WEIGHTS = { todo: 0.4, habit: 0.3, plan: 0.3 }
/** Weights used when nothing was planned, so the plan dimension drops out. */
const WEIGHTS_NO_PLAN = { todo: 0.6, habit: 0.4, plan: 0 }

export interface ProgressSource {
  todos: Todo[]
  habits: Habit[]
  blocks: TimeBlock[]
}

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

function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0
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
    return (
      src.habits.find((h) => h.id === block.source!.refId)?.history.includes(block.date) ?? false
    )
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

function combine(
  todoRate: number,
  habitRate: number,
  planRate: number,
  todoTotal: number,
  habitTotal: number,
  plannedMinutes: number,
) {
  const weights = plannedMinutes > 0 ? WEIGHTS : WEIGHTS_NO_PLAN
  const parts: Array<[number, number]> = [
    [todoRate, todoTotal ? weights.todo : 0],
    [habitRate, habitTotal ? weights.habit : 0],
    [planRate, plannedMinutes ? weights.plan : 0],
  ]
  const weightSum = parts.reduce((acc, [, w]) => acc + w, 0)
  if (!weightSum) return 0
  return Math.round(parts.reduce((acc, [rate, w]) => acc + rate * w, 0) / weightSum)
}

function blockMinutes(blocks: TimeBlock[], src: ProgressSource) {
  let planned = 0
  let done = 0
  for (const b of blocks) {
    const minutes = b.end - b.start
    planned += minutes
    if (isBlockDone(b, src)) done += minutes
  }
  return { planned, done }
}

/**
 * The single place the three linked metrics are computed:
 * todos completed, habits checked, and how much of the planned time was executed.
 * Dimensions with an empty denominator drop out and their weight is
 * redistributed over the remaining ones.
 */
export function rangeProgress(src: ProgressSource, keys: string[]): Progress {
  const keySet = new Set(keys)
  const todos = src.todos.filter((t) => keySet.has(t.date))
  const blocks = src.blocks.filter((b) => keySet.has(b.date))

  const todoDone = todos.filter((t) => t.done).length
  const todoTotal = todos.length

  let habitDone = 0
  for (const h of src.habits) {
    for (const d of h.history) if (keySet.has(d)) habitDone++
  }
  const habitTotal = src.habits.length * keySet.size

  const minutes = blockMinutes(blocks, src)

  const todoRate = pct(todoDone, todoTotal)
  const habitRate = pct(habitDone, habitTotal)
  const planRate = pct(minutes.done, minutes.planned)

  return {
    todoRate,
    habitRate,
    planRate,
    overall: combine(todoRate, habitRate, planRate, todoTotal, habitTotal, minutes.planned),
    todoDone,
    todoTotal,
    habitDone,
    habitTotal,
    plannedMinutes: minutes.planned,
    doneMinutes: minutes.done,
  }
}

export function dayProgress(src: ProgressSource, key: string): Progress {
  return rangeProgress(src, [key])
}

/** A start within this many minutes of the plan still counts as on time. */
export const ON_TIME_TOLERANCE_MIN = 15

export interface Adherence {
  /** planned blocks that were executed at all (recorded or checked off), 0-100 */
  executionRate: number
  /** executed blocks whose real times were actually written down, 0-100 */
  recordRate: number
  /** average overlap / union of plan vs actual, 0-100 — the "as planned" score */
  adherenceRate: number
  /** recorded blocks that started within the tolerance, 0-100 */
  onTimeRate: number
  /** actual minutes − planned minutes over recorded blocks (+ = ran long) */
  deviationMin: number
  /** average |actual.start − plan.start| over recorded blocks */
  avgShiftMin: number
  /** minutes spent on things that were never planned */
  spontaneousMin: number
  plannedBlocks: number
  executedBlocks: number
  recordedBlocks: number
  plannedMinutes: number
  actualMinutes: number
}

function overlap(a: { start: number; end: number }, b: { start: number; end: number }) {
  return Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start))
}

function union(a: { start: number; end: number }, b: { start: number; end: number }) {
  return Math.max(a.end, b.end) - Math.min(a.start, b.start)
}

/**
 * How closely the day ran to its plan. Only blocks with recorded actual times
 * feed the adherence numbers; `recordRate` says how trustworthy they are.
 */
export function rangeAdherence(src: ProgressSource, keys: string[]): Adherence {
  const keySet = new Set(keys)
  const blocks = src.blocks.filter((b) => keySet.has(b.date))
  const planned = blocks.filter((b) => !b.spontaneous)
  const spontaneous = blocks.filter((b) => b.spontaneous)

  const executed = planned.filter((b) => isBlockDone(b, src))
  // only blocks with recorded times can be compared to their plan
  const recorded = planned.filter(
    (b): b is TimeBlock & { actual: { start: number; end: number } } => b.actual != null,
  )

  let plannedMinutes = 0
  for (const b of planned) plannedMinutes += b.end - b.start

  let actualMinutes = 0
  let iouSum = 0
  let onTime = 0
  let shiftSum = 0
  let recordedPlannedMinutes = 0
  for (const b of recorded) {
    const plan = { start: b.start, end: b.end }
    const act = b.actual
    actualMinutes += act.end - act.start
    recordedPlannedMinutes += plan.end - plan.start
    const u = union(plan, act)
    iouSum += u > 0 ? overlap(plan, act) / u : 1
    const shift = Math.abs(act.start - plan.start)
    shiftSum += shift
    if (shift <= ON_TIME_TOLERANCE_MIN) onTime++
  }

  let spontaneousMin = 0
  for (const b of spontaneous) {
    const act = b.actual ?? { start: b.start, end: b.end }
    spontaneousMin += act.end - act.start
  }

  return {
    executionRate: pct(executed.length, planned.length),
    recordRate: pct(recorded.length, executed.length),
    adherenceRate: recorded.length ? Math.round((iouSum / recorded.length) * 100) : 0,
    onTimeRate: pct(onTime, recorded.length),
    deviationMin: actualMinutes - recordedPlannedMinutes,
    avgShiftMin: recorded.length ? Math.round(shiftSum / recorded.length) : 0,
    spontaneousMin,
    plannedBlocks: planned.length,
    executedBlocks: executed.length,
    recordedBlocks: recorded.length,
    plannedMinutes,
    actualMinutes,
  }
}

export function dayAdherence(src: ProgressSource, key: string): Adherence {
  return rangeAdherence(src, [key])
}
