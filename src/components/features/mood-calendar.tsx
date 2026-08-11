"use client"

import { MOODS } from "@/lib/categories"
import type { MoodEntry } from "@/lib/types"
import { monthGrid, DAY_LABELS } from "@/lib/date"
import { dateKey } from "@/lib/utils"
import { cn } from "@/lib/utils"

export function MoodCalendar({ month, moods }: { month: Date; moods: MoodEntry[] }) {
  const grid = monthGrid(month)
  const byDate = new Map(moods.map((m) => [m.date, m]))
  const monthIndex = month.getMonth()
  const todayKey = dateKey(new Date())

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs text-muted-foreground">
        {DAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.flat().map((day) => {
          const key = dateKey(day)
          const entry = byDate.get(key)
          const inMonth = day.getMonth() === monthIndex
          const isToday = key === todayKey
          return (
            <div
              key={key}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg border text-xs",
                inMonth ? "bg-card" : "bg-transparent opacity-40",
                isToday && "ring-2 ring-primary"
              )}
            >
              <span className="text-[10px] text-muted-foreground">{day.getDate()}</span>
              <span className="text-base leading-none">
                {entry ? MOODS[entry.score].emoji : ""}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
