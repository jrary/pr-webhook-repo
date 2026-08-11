"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import { useLogHabitMutation } from "@/api/queries/habit"
import { useDayQuery } from "@/api/queries/stats"
import { usePlanItemMutation, useUpdateTimeBlockMutation } from "@/api/queries/time-block"
import { useUpdateTodoMutation } from "@/api/queries/todo"
import { dateKey } from "@/lib/utils"
import { dayPlanItems, unplannedItems, type PlanItem } from "@/lib/plan"
import { isBlockDone, isBlockMissed, progressOf } from "@/lib/progress"
import { defaultPlanStart } from "@/lib/schedule"
import { decodePlanItemDrag } from "@/lib/dnd"
import { minutesToLabel } from "@/lib/date"
import { useNow } from "@/hooks/use-now"
import { useRecordApi } from "@/hooks/use-record-api"
import { DateNav } from "@/components/date-nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { GratitudeWidget, MoodWidget } from "@/components/dashboard/widgets"
import { ProgressHeader, type ProgressFocus } from "@/components/today/progress-header"
import { PlanList } from "@/components/today/plan-list"
import { TodayTimeline } from "@/components/today/today-timeline"

const EMPTY_DAY = { todos: [], habits: [], blocks: [] }

export default function TodayPage() {
  const now = useNow()
  const [date, setDate] = useState(() => new Date())
  const [focus, setFocus] = useState<ProgressFocus>(null)
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<PlanItem | null>(null)
  const key = dateKey(date)

  // one request carries the whole day: todos, habits, blocks and the rates
  const { data: day, isPending } = useDayQuery(key)
  const updateTodo = useUpdateTodoMutation()
  const logHabit = useLogHabitMutation()
  const planItem = usePlanItemMutation()
  const updateBlock = useUpdateTimeBlockMutation()
  const record = useRecordApi()

  const source = useMemo(
    () => (day ? { todos: day.todos, habits: day.habits, blocks: day.blocks } : EMPTY_DAY),
    [day]
  )
  const progress = day?.progress ?? progressOf(undefined, EMPTY_DAY)
  const items = useMemo(() => dayPlanItems(source, key), [source, key])
  const unplanned = useMemo(() => unplannedItems(source, key).length, [source, key])
  const dayBlocks = source.blocks

  // "계획 이행" bar drills into the first block that was planned but not executed
  useEffect(() => {
    if (focus !== "plan") return
    const missed = dayBlocks.find((b) => isBlockMissed(b, source, now ?? new Date()))
    setFocusBlockId(missed?.id ?? dayBlocks[0]?.id ?? null)
  }, [focus, dayBlocks, source, now])

  function handleToggle(item: PlanItem) {
    const nextDone = !item.done
    const onError = (error: Error) => toast.error(error.message)
    if (item.type === "todo") {
      updateTodo.mutate({ todoId: Number(item.refId), body: { done: nextDone } }, { onError })
    } else {
      logHabit.mutate({ habitId: Number(item.refId), date: key, state: nextDone }, { onError })
    }

    // completing here also starts the timeline record, so the block can be
    // dragged to the time it really took; unchecking removes that record
    for (const block of item.blocks) {
      if (nextDone && !block.actual) record.markPlanned(block)
      if (!nextDone && block.actual) record.setActual(block.id, null)
    }
  }

  function schedule(
    item: { type: PlanItem["type"]; refId: string },
    start: number,
    duration: number
  ) {
    planItem.mutate(
      {
        date: key,
        planStart: start,
        planEnd: Math.min(24 * 60, start + duration),
        sourceType: item.type === "todo" ? "TODO" : "HABIT",
        sourceId: Number(item.refId),
      },
      { onError: (error) => toast.error(error.message) }
    )
  }

  function handleDropItem(payload: string, startMin: number) {
    const drag = decodePlanItemDrag(payload)
    setDragging(null)
    if (!drag) return
    schedule(drag, startMin, drag.durationMin ?? 30)
    toast.success(`${minutesToLabel(startMin)}에 배치`)
  }

  function handlePlan(item: PlanItem) {
    const duration = item.defaultMin
    const start = defaultPlanStart(dayBlocks, duration, date, now ?? new Date())
    if (start === null) {
      toast.error("남은 빈 시간이 없어요")
      return
    }
    schedule(item, start, duration)
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

      {isPending ? (
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
            onMoveBlock={(id, start, end) =>
              updateBlock.mutate(
                { blockId: Number(id), body: { planStart: start, planEnd: end } },
                { onError: (error) => toast.error(error.message) }
              )
            }
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
