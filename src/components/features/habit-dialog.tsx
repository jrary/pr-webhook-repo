"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import type { CategoryKey, Habit } from "@/lib/types"
import { useCategories, usePlannerStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMOJI_CHOICES = ["🏃", "📚", "💧", "🧘", "🥗", "😴", "✍️", "🎯", "🌱", "🎸", "🧹", "💪"]
const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120]
const DEFAULT_DURATION = 30

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
  const addHabit = usePlannerStore((s) => s.addHabit)
  const updateHabit = usePlannerStore((s) => s.updateHabit)

  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("🎯")
  const [color, setColor] = useState<CategoryKey>(categories[0]?.id ?? "")
  const [timed, setTimed] = useState(false)
  const [duration, setDuration] = useState(DEFAULT_DURATION)

  useEffect(() => {
    if (!open) return
    setName(habit?.name ?? "")
    setEmoji(habit?.emoji ?? "🎯")
    setColor(habit?.color ?? categories[0]?.id ?? "")
    setTimed(habit?.defaultMin != null)
    setDuration(habit?.defaultMin ?? DEFAULT_DURATION)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, habit])

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    const defaultMin = timed ? duration : undefined
    if (habit) {
      updateHabit(habit.id, { name: trimmed, emoji, color, defaultMin })
    } else {
      addHabit({ name: trimmed, emoji, color, defaultMin })
    }
    onOpenChange(false)
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
            <Label>아이콘</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
                    emoji === em ? "border-primary bg-accent" : "hover:bg-accent",
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 transition-all",
                    color === c.id && "ring-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: c.color }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="habit-timed">소요 시간 정하기</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  끄면 타임라인에 놓을 때 길이를 그때그때 정합니다.
                </p>
              </div>
              <Switch id="habit-timed" checked={timed} onCheckedChange={setTimed} />
            </div>
            {timed ? (
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}분
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="w-full">
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
