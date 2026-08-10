"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import type { CategoryKey } from "@/lib/types"
import { useCategories, usePlannerStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AddTodo({ date }: { date: string }) {
  const addTodo = usePlannerStore((s) => s.addTodo)
  const categories = useCategories()
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<CategoryKey>("")

  // stay valid when the selected category is renamed away or deleted
  const selected = categories.some((c) => c.id === category) ? category : categories[0]?.id ?? ""

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || !selected) return
    addTodo({ title: trimmed, category: selected, date })
    setTitle("")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="할 일을 입력하세요"
        className="flex-1"
      />
      <div className="flex gap-2">
        <Select value={selected} onValueChange={setCategory}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </div>
    </form>
  )
}
