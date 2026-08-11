import { DEFAULT_ESTIMATE_MIN } from "./progress"
import type { CategoryKey, Habit, PlanSourceType, TimeBlock, Todo } from "./types"

/** The data every "today" view needs: todos, habits and blocks read together. */
export interface PlanData {
  todos: Todo[]
  habits: Habit[]
  blocks: TimeBlock[]
}

/** A todo or habit shown as one row in the unified "오늘 할 것" list. */
export interface PlanItem {
  /** stable react key, unique across both types */
  key: string
  type: PlanSourceType
  refId: string
  title: string
  category: CategoryKey
  done: boolean
  /** streak flame, habits only */
  streak?: number
  /** block length used when scheduling */
  defaultMin: number
  schedulable: boolean
  /** blocks on this date that schedule this item */
  blocks: TimeBlock[]
}

/** Todos and habits of a day merged into one list, each with its linked blocks. */
export function dayPlanItems(data: PlanData, key: string): PlanItem[] {
  const dayBlocks = data.blocks.filter((b) => b.date === key)
  const blocksFor = (type: PlanSourceType, refId: string) =>
    dayBlocks
      .filter((b) => b.source?.type === type && b.source.refId === refId)
      .sort((a, b) => a.start - b.start)

  const todoItems: PlanItem[] = data.todos
    .filter((t) => t.date === key)
    .sort((a, b) => a.order - b.order)
    .map((t) => ({
      key: `todo:${t.id}`,
      type: "todo" as const,
      refId: t.id,
      title: t.title,
      category: t.category,
      done: t.done,
      defaultMin: t.estimateMin ?? DEFAULT_ESTIMATE_MIN,
      schedulable: true,
      blocks: blocksFor("todo", t.id),
    }))

  const habitItems: PlanItem[] = data.habits.map((h) => ({
    key: `habit:${h.id}`,
    type: "habit" as const,
    refId: h.id,
    title: h.name,
    category: h.category,
    done: h.loggedToday,
    streak: h.currentStreak,
    // the server keeps no per-habit duration, so every habit gets the default
    defaultMin: DEFAULT_ESTIMATE_MIN,
    schedulable: true,
    blocks: blocksFor("habit", h.id),
  }))

  return [...todoItems, ...habitItems]
}

/** Schedulable items of the day that have no block yet — the "미배치" badge count. */
export function unplannedItems(data: PlanData, key: string): PlanItem[] {
  return dayPlanItems(data, key).filter((i) => i.schedulable && i.blocks.length === 0)
}
