"use client"

import { useState } from "react"
import { Check, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Habit } from "@/lib/types"
import { useDeleteHabitMutation, useLogHabitMutation } from "@/api/queries/habit"
import { useCategory } from "@/hooks/use-categories"
import { cn, withAlpha } from "@/lib/utils"
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

/** One habit card. `date` is the day its check button records. */
export function HabitCard({ habit, date }: { habit: Habit; date: string }) {
  const logHabit = useLogHabitMutation()
  const deleteHabit = useDeleteHabitMutation()
  const category = useCategory(habit.category)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const habitId = Number(habit.id)
  const color = habit.color || category.color
  const done = habit.loggedToday
  const toggling = logHabit.isPending

  function toggle() {
    logHabit.mutate(
      { habitId, date, state: !done },
      { onError: (error) => toast.error(error.message) }
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-xl"
              style={{ backgroundColor: withAlpha(color, 0.12) }}
            />
            <div>
              <p className="font-semibold">{habit.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <HabitStreakBadge streak={habit.currentStreak} />
                <span className="text-xs text-muted-foreground">{category.label}</span>
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

        <button
          type="button"
          disabled={toggling}
          onClick={toggle}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all",
            done ? "text-white" : "border-border text-muted-foreground hover:border-primary",
            toggling && "opacity-60"
          )}
          style={done ? { backgroundColor: color, borderColor: color } : undefined}
        >
          <Check className="h-4 w-4" />
          {done ? "오늘 완료" : "오늘 체크하기"}
        </button>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>최장 연속</span>
          <span className="font-semibold text-foreground">{habit.longestStreak}일</span>
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
              disabled={deleteHabit.isPending}
              onClick={() =>
                deleteHabit.mutate(habitId, {
                  onSuccess: () => setConfirming(false),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
