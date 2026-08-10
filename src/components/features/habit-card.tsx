"use client"

import { useState } from "react"
import { Check, Clock, Pencil, Trash2 } from "lucide-react"
import type { Habit } from "@/lib/types"
import { useCategory, usePlannerStore } from "@/lib/store"
import { currentStreak, weekDays, DAY_LABELS_MON } from "@/lib/date"
import { cn, dateKey, withAlpha } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HabitStreakBadge } from "@/components/habit-streak-badge"
import { HabitDialog } from "@/components/features/habit-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function HabitCard({ habit }: { habit: Habit }) {
  const toggleHabit = usePlannerStore((s) => s.toggleHabit)
  const removeHabit = usePlannerStore((s) => s.removeHabit)
  const category = useCategory(habit.color)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const today = new Date()
  const color = category.color
  const streak = currentStreak(habit.history, today)
  const week = weekDays(today)
  const historySet = new Set(habit.history)

  // monthly completion rate over elapsed days this month
  const elapsed = today.getDate()
  const monthPrefix = dateKey(today).slice(0, 7)
  const monthDone = habit.history.filter((d) => d.startsWith(monthPrefix)).length
  const monthRate = elapsed > 0 ? Math.round((monthDone / elapsed) * 100) : 0

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
              style={{ backgroundColor: withAlpha(color, 0.12) }}
            >
              {habit.emoji}
            </div>
            <div>
              <p className="font-semibold">{habit.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <HabitStreakBadge streak={streak} />
                <span className="text-xs text-muted-foreground">{category.label}</span>
                {habit.defaultMin != null ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {habit.defaultMin}분
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">편집</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">삭제</span>
            </Button>
          </div>
        </div>

        <div className="flex justify-between">
          {week.map((day, i) => {
            const key = dateKey(day)
            const done = historySet.has(key)
            const isFuture = day > today && key !== dateKey(today)
            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{DAY_LABELS_MON[i]}</span>
                <button
                  type="button"
                  disabled={isFuture}
                  onClick={() => toggleHabit(habit.id, key)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border transition-all",
                    done ? "text-white" : "border-border text-transparent hover:border-primary",
                    isFuture && "opacity-30",
                  )}
                  style={done ? { backgroundColor: color, borderColor: color } : undefined}
                  aria-label={`${DAY_LABELS_MON[i]} ${done ? "달성" : "미달성"}`}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>이번 달 달성률</span>
          <span className="font-semibold text-foreground">{monthRate}%</span>
        </div>
      </CardContent>

      <HabitDialog habit={habit} open={editing} onOpenChange={setEditing} />

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>습관을 삭제할까요?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &ldquo;{habit.name}&rdquo;의 기록과 스트릭이 함께 사라집니다. 이 습관에 연결된
            타임블록은 남지만 연결은 끊깁니다.
          </p>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                removeHabit(habit.id)
                setConfirming(false)
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
