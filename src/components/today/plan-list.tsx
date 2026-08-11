"use client"

import Link from "next/link"
import { Clock, Flame, Plus } from "lucide-react"
import type { PlanItem } from "@/lib/plan"
import { DRAG_MIME, encodePlanItemDrag } from "@/lib/dnd"
import { minutesToLabel } from "@/lib/date"
import { cn } from "@/lib/utils"
import { CategoryTag } from "@/components/category-tag"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

/** Badge on the right of a row: the item's link to the timeline. */
function LinkBadge({
  item,
  onPlan,
  onFocusBlock,
}: {
  item: PlanItem
  onPlan: (item: PlanItem) => void
  onFocusBlock: (blockId: string) => void
}) {
  if (item.blocks.length > 0) {
    const first = item.blocks[0]
    return (
      <button
        type="button"
        onClick={() => onFocusBlock(first.id)}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs tabular-nums text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Clock className="h-3 w-3" />
        {minutesToLabel(first.start)}
        {item.blocks.length > 1 ? ` +${item.blocks.length - 1}` : ""}
      </button>
    )
  }

  if (!item.schedulable) {
    return <span className="shrink-0 text-xs text-muted-foreground">시간 없음</span>
  }

  return (
    <button
      type="button"
      onClick={() => onPlan(item)}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-solid hover:bg-secondary hover:text-foreground"
    >
      <Plus className="h-3 w-3" />
      배치
    </button>
  )
}

function Row({
  item,
  onToggle,
  onPlan,
  onFocusBlock,
  onDragStart,
  onDragEnd,
}: {
  item: PlanItem
  onToggle: (item: PlanItem) => void
  onPlan: (item: PlanItem) => void
  onFocusBlock: (blockId: string) => void
  onDragStart: (item: PlanItem) => void
  onDragEnd: () => void
}) {
  const draggable = item.schedulable

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "copy"
    const payload = encodePlanItemDrag({
      type: item.type,
      refId: item.refId,
      durationMin: item.defaultMin,
    })
    e.dataTransfer.setData(DRAG_MIME, payload)
    e.dataTransfer.setData("text/plain", payload)
    onDragStart(item)
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-secondary/40",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <Checkbox checked={item.done} onCheckedChange={() => onToggle(item)} />
      <span className={cn("flex-1 truncate text-sm", item.done && "text-muted-foreground line-through")}>
        {item.title}
      </span>
      {item.streak ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-orange-500">
          <Flame className="h-3.5 w-3.5" />
          {item.streak}
        </span>
      ) : null}
      {item.type === "todo" ? <CategoryTag category={item.category} className="hidden sm:inline-flex" /> : null}
      <LinkBadge item={item} onPlan={onPlan} onFocusBlock={onFocusBlock} />
    </div>
  )
}

function Section({
  title,
  href,
  done,
  total,
  emptyText,
  children,
}: {
  title: string
  href: string
  done: number
  total: number
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}{" "}
          <span className="tabular-nums">
            {done}/{total}
          </span>
        </h3>
        <Link href={href} className="text-xs text-muted-foreground hover:text-foreground">
          관리
        </Link>
      </div>
      {total === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  )
}

/**
 * Todos and habits in one list. Every row carries its link state to the
 * timeline, so scheduling never means leaving this screen.
 */
export function PlanList({
  items,
  filter,
  unplannedCount,
  onToggle,
  onPlan,
  onFocusBlock,
  onDragStart,
  onDragEnd,
}: {
  items: PlanItem[]
  filter: "todo" | "habit" | null
  unplannedCount: number
  onToggle: (item: PlanItem) => void
  onPlan: (item: PlanItem) => void
  onFocusBlock: (blockId: string) => void
  onDragStart: (item: PlanItem) => void
  onDragEnd: () => void
}) {
  const todos = items.filter((i) => i.type === "todo")
  const habits = items.filter((i) => i.type === "habit")

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>
          오늘 할 것
          <span className="ml-1.5 font-serif text-base font-normal italic text-muted-foreground">
            To do
          </span>
        </CardTitle>
        {unplannedCount > 0 ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            미배치 {unplannedCount}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {filter !== "habit" ? (
          <Section
            title="할 일"
            href="/todos"
            done={todos.filter((t) => t.done).length}
            total={todos.length}
            emptyText="오늘 할 일이 없습니다."
          >
            {todos.map((item) => (
              <Row
                key={item.key}
                item={item}
                onToggle={onToggle}
                onPlan={onPlan}
                onFocusBlock={onFocusBlock}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
          </Section>
        ) : null}

        {filter !== "todo" ? (
          <Section
            title="습관"
            href="/habits"
            done={habits.filter((h) => h.done).length}
            total={habits.length}
            emptyText="등록된 습관이 없습니다."
          >
            {habits.map((item) => (
              <Row
                key={item.key}
                item={item}
                onToggle={onToggle}
                onPlan={onPlan}
                onFocusBlock={onFocusBlock}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
          </Section>
        ) : null}
      </CardContent>
    </Card>
  )
}
