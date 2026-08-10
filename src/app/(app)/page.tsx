"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import { dateKey } from "@/lib/utils"
import { dayPlanItems, unplannedItems, usePlannerStore, type PlanItem } from "@/lib/store"
import { dayProgress, isBlockDone, isBlockMissed } from "@/lib/progress"
import { defaultPlanStart } from "@/lib/schedule"
import { decodePlanItemDrag } from "@/lib/dnd"
import { minutesToLabel } from "@/lib/date"
import { useMounted } from "@/hooks/use-mounted"
import { useNow } from "@/hooks/use-now"
import { useRecordApi } from "@/hooks/use-record-api"
import { DateNav } from "@/components/date-nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { GratitudeWidget, MoodWidget } from "@/components/dashboard/widgets"
import { ProgressHeader, type ProgressFocus } from "@/components/today/progress-header"
import { PlanList } from "@/components/today/plan-list"
import { TodayTimeline } from "@/components/today/today-timeline"

export default function TodayPage() {
  const mounted = useMounted()
  const now = useNow()
  const [date, setDate] = useState(() => new Date())
  const [focus, setFocus] = useState<ProgressFocus>(null)
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<PlanItem | null>(null)
  const key = dateKey(date)

  const todos = usePlannerStore((s) => s.todos)
  const habits = usePlannerStore((s) => s.habits)
  const blocks = usePlannerStore((s) => s.blocks)
  const toggleTodo = usePlannerStore((s) => s.toggleTodo)
  const toggleHabit = usePlannerStore((s) => s.toggleHabit)
  const record = useRecordApi()
  const updateBlock = usePlannerStore((s) => s.updateBlock)
  const planItem = usePlannerStore((s) => s.planItem)

  const source = useMemo(() => ({ todos, habits, blocks }), [todos, habits, blocks])
  const progress = useMemo(() => dayProgress(source, key), [source, key])
  const items = useMemo(() => dayPlanItems(source, key), [source, key])
  const unplanned = useMemo(() => unplannedItems(source, key).length, [source, key])
  const dayBlocks = useMemo(
    () => blocks.filter((b) => b.date === key).sort((a, b) => a.start - b.start),
    [blocks, key],
  )
  const habitHistories = useMemo(
    () => Object.fromEntries(habits.map((h) => [h.id, h.history])),
    [habits],
  )

  // "계획 이행" bar drills into the first block that was planned but not executed
  useEffect(() => {
    if (focus !== "plan") return
    const missed = dayBlocks.find((b) => isBlockMissed(b, source, now ?? new Date()))
    setFocusBlockId(missed?.id ?? dayBlocks[0]?.id ?? null)
  }, [focus, dayBlocks, source, now])

  function handleToggle(item: PlanItem) {
    const nextDone = !item.done
    if (item.type === "todo") toggleTodo(item.refId)
    else toggleHabit(item.refId, key)

    // completing here also starts the timeline record, so the block can be
    // dragged to the time it really took; unchecking removes that record
    for (const block of item.blocks) {
      if (nextDone && !block.actual) record.markPlanned(block.id)
      if (!nextDone && block.actual) record.setActual(block.id, null)
    }
  }

  function handleDropItem(payload: string, startMin: number) {
    const drag = decodePlanItemDrag(payload)
    setDragging(null)
    if (!drag) return
    planItem({
      type: drag.type,
      refId: drag.refId,
      date: key,
      start: startMin,
      durationMin: drag.durationMin,
    })
    toast.success(`${minutesToLabel(startMin)}에 배치`)
  }

  function handlePlan(item: PlanItem) {
    const duration = item.defaultMin ?? 30
    const start = defaultPlanStart(dayBlocks, duration, date, now ?? new Date())
    if (start === null) {
      toast.error("남은 빈 시간이 없어요")
      return
    }
    planItem({ type: item.type, refId: item.refId, date: key, start, durationMin: duration })
    toast.success(`${item.title} · ${minutesToLabel(start)} 배치`)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-sm italic text-muted-foreground">My Daily Record</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {format(date, "M월 d일, eeee", { locale: ko })}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <DateNav date={date} onChange={setDate} />
          <Avatar className="hidden h-10 w-10 sm:flex">
            <AvatarFallback>나</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {!mounted ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
            <Skeleton className="h-[720px] w-full" />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
          {/* columns 1-2: how the day is going, and what is left */}
          <ProgressHeader
            className="lg:col-span-2 lg:col-start-1 lg:row-start-1"
            progress={progress}
            focus={focus}
            onFocus={(next) => {
              setFocus(next)
              if (next !== "plan") setFocusBlockId(null)
            }}
          />

          <div className="space-y-4 lg:col-span-2 lg:col-start-1 lg:row-start-2">
            <PlanList
              items={items}
              habitHistories={habitHistories}
              filter={focus === "plan" ? null : focus}
              unplannedCount={unplanned}
              onToggle={handleToggle}
              onPlan={handlePlan}
              onFocusBlock={setFocusBlockId}
              onDragStart={setDragging}
              onDragEnd={() => setDragging(null)}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <MoodWidget dateKey={key} />
              <GratitudeWidget dateKey={key} />
            </div>
          </div>

          {/* column 3: the day itself, spanning both rows */}
          <TodayTimeline
            className="lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-start"
            date={date}
            dateKey={key}
            blocks={dayBlocks}
            progress={progress}
            focusBlockId={focusBlockId}
            record={record}
            onDropItem={handleDropItem}
            dropDurationMin={dragging?.defaultMin}
            onMoveBlock={(id, start, end) => updateBlock(id, { start, end })}
            viewOf={(b) => ({
              done: isBlockDone(b, source),
              missed: isBlockMissed(b, source, now ?? new Date()),
              sourceIcon:
                b.source?.type === "todo" ? "📌" : b.source?.type === "habit" ? "🔁" : undefined,
            })}
          />
        </div>
      )}
    </div>
  )
}
