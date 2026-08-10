"use client"

import { useState } from "react"
import { Check, Pencil, Plus, Settings2, Trash2, X } from "lucide-react"
import { CATEGORY_COLORS } from "@/lib/categories"
import type { Category } from "@/lib/types"
import { useCategories, usePlannerStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={color}
          className={cn(
            "h-6 w-6 rounded-full ring-offset-1 transition-all",
            value === color && "ring-2 ring-foreground ring-offset-background",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function Row({
  category,
  usageCount,
  canDelete,
}: {
  category: Category
  usageCount: number
  canDelete: boolean
}) {
  const updateCategory = usePlannerStore((s) => s.updateCategory)
  const removeCategory = usePlannerStore((s) => s.removeCategory)
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(category.label)
  const [color, setColor] = useState(category.color)

  function save() {
    const trimmed = label.trim()
    if (!trimmed) return
    updateCategory(category.id, { label: trimmed, color })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          <Button size="icon" variant="ghost" onClick={save} aria-label="저장">
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setLabel(category.label)
              setColor(category.color)
              setEditing(false)
            }}
            aria-label="취소"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ColorPicker value={color} onChange={setColor} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="flex-1 text-sm font-medium">{category.label}</span>
      <span className="text-xs text-muted-foreground">{usageCount}개 사용</span>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">편집</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={!canDelete}
        title={canDelete ? undefined : "마지막 카테고리는 삭제할 수 없습니다"}
        onClick={() => removeCategory(category.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">삭제</span>
      </Button>
    </div>
  )
}

/** Add / rename / recolor / delete the categories shared by todos, blocks and habits. */
export function CategoryManager() {
  const categories = useCategories()
  const todos = usePlannerStore((s) => s.todos)
  const blocks = usePlannerStore((s) => s.blocks)
  const habits = usePlannerStore((s) => s.habits)
  const addCategory = usePlannerStore((s) => s.addCategory)

  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [color, setColor] = useState(CATEGORY_COLORS[0])

  function usageOf(id: string) {
    return (
      todos.filter((t) => t.category === id).length +
      blocks.filter((b) => b.category === id).length +
      habits.filter((h) => h.color === id).length
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    addCategory({ label: trimmed, color })
    setLabel("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4" />
          카테고리 관리
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카테고리</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto py-1">
          {categories.map((c) => (
            <Row
              key={c.id}
              category={c}
              usageCount={usageOf(c.id)}
              canDelete={categories.length > 1}
            />
          ))}
        </div>

        <form onSubmit={submit} className="space-y-2 border-t pt-4">
          <div className="flex gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="새 카테고리 이름"
            />
            <Button type="submit">
              <Plus className="h-4 w-4" />
              추가
            </Button>
          </div>
          <ColorPicker value={color} onChange={setColor} />
          <p className="text-xs text-muted-foreground">
            카테고리를 삭제하면 사용 중이던 할 일·타임블록·습관은 남은 첫 카테고리로 옮겨집니다.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
