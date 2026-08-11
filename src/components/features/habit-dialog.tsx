"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useCreateHabitMutation, useUpdateHabitMutation } from "@/api/queries/habit"
import type { CategoryKey, Habit } from "@/lib/types"
import { useCategories } from "@/hooks/use-categories"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** Create or edit a habit. Pass `habit` to edit, omit to create. */
export function HabitDialog({
  habit,
  open,
  onOpenChange,
}: {
  habit?: Habit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const categories = useCategories()
  const createHabit = useCreateHabitMutation()
  const updateHabit = useUpdateHabitMutation()

  const [name, setName] = useState("")
  const [category, setCategory] = useState<CategoryKey>("")

  useEffect(() => {
    if (!open) return
    setName(habit?.name ?? "")
    setCategory(habit?.category || categories[0]?.id || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, habit])

  const pending = createHabit.isPending || updateHabit.isPending

  function submit() {
    const trimmed = name.trim()
    if (!trimmed || !category) return
    // a habit's own color follows its category, so one palette drives both
    const color = categories.find((c) => c.id === category)?.color
    const body = { title: trimmed, categoryId: Number(category), color }
    const options = {
      onSuccess: () => onOpenChange(false),
      onError: (error: Error) => toast.error(error.message),
    }
    if (habit) {
      updateHabit.mutate({ habitId: Number(habit.id), body }, options)
    } else {
      createHabit.mutate(body, options)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? "습관 편집" : "새 습관"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="habit-name">이름</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 운동하기"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 transition-all",
                    category === c.id && "ring-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: c.color }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="w-full" disabled={pending}>
            {habit ? "저장하기" : "추가하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddHabitButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        추가
      </Button>
      <HabitDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
