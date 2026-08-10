/** Category id. Categories are user-editable, so this is a plain string. */
export type CategoryKey = string

export interface Category {
  id: CategoryKey
  label: string
  /** css color, stored so users can pick their own */
  color: string
}

export type MoodScore = 1 | 2 | 3 | 4 | 5

export type PlanSourceType = "todo" | "habit"

/** Link from a time block back to the todo/habit it schedules. */
export interface PlanSource {
  type: PlanSourceType
  refId: string
}

export interface Todo {
  id: string
  title: string
  category: CategoryKey
  done: boolean
  /** YYYY-MM-DD */
  date: string
  order: number
  /** default length used when scheduling this todo, in minutes */
  estimateMin?: number
}

/** When something actually happened, recorded on the timeline. */
export interface ActualInterval {
  start: number
  end: number
}

export interface TimeBlock {
  id: string
  /** blocks carry no name of their own; the label comes from `source` or the category */
  category: CategoryKey
  /** YYYY-MM-DD */
  date: string
  /** planned start, minutes from 00:00, multiple of 10 */
  start: number
  /** planned end, minutes from 00:00, multiple of 10 (exclusive) */
  end: number
  /** what this block schedules; undefined = free block (meeting, lunch, ...) */
  source?: PlanSource
  /** when it really happened; undefined = not executed (or not recorded yet) */
  actual?: ActualInterval
  /** recorded after the fact with no plan behind it; excluded from plan metrics */
  spontaneous?: boolean
}

export interface Habit {
  id: string
  name: string
  emoji: string
  color: CategoryKey
  createdAt: string
  /** set of YYYY-MM-DD on which the habit was completed */
  history: string[]
  /** default block length in minutes; undefined = not schedulable (e.g. drink water) */
  defaultMin?: number
}

export interface MoodEntry {
  /** YYYY-MM-DD */
  date: string
  score: MoodScore
  note?: string
}

export interface GratitudeEntry {
  /** YYYY-MM-DD */
  date: string
  items: [string, string, string]
}
