import { dateKey } from "./utils"

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"]

export function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

/** Format minutes-from-midnight as HH:mm */
export function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Monday-based week containing `date`, returned as 7 Date objects (Mon..Sun). */
export function weekDays(date: Date): Date[] {
  const day = date.getDay() // 0 = Sun
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = addDays(date, mondayOffset)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** Full month grid (weeks of 7), Sunday-first, padding with prev/next month days. */
export function monthGrid(date: Date): Date[][] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = first.getDay() // 0 = Sun
  const gridStart = addDays(first, -startOffset)
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const row: Date[] = []
    for (let d = 0; d < 7; d++) {
      row.push(addDays(gridStart, w * 7 + d))
    }
    weeks.push(row)
  }
  return weeks
}

export function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b)
}
