"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { TimeBlock } from "@/lib/types"
import type { Progress } from "@/lib/progress"
import { cn } from "@/lib/utils"
import {
  TimeBlockGrid,
  type BlockView,
  type RecordApi,
} from "@/components/features/time-block-grid"
import { BlockEditor, type BlockDraft } from "@/components/features/block-editor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** px per 10 minutes on the dashboard; tight enough to show 08:00–21:00 at once */
const SLOT_H = 9
const VIEW_START_HOUR = 8
const VIEW_HOURS = 13
const VIEW_HEIGHT = VIEW_HOURS * 6 * SLOT_H

function hours(minutes: number) {
  return Math.round(minutes / 6) / 10
}

/** The day's timeline: the same blocks the list rows point at. */
export function TodayTimeline({
  date,
  dateKey,
  blocks,
  progress,
  viewOf,
  record,
  focusBlockId,
  onDropItem,
  dropDurationMin,
  onMoveBlock,
  className,
}: {
  date: Date
  dateKey: string
  blocks: TimeBlock[]
  progress: Progress
  viewOf: (block: TimeBlock) => BlockView
  record: RecordApi
  focusBlockId: string | null
  onDropItem: (payload: string, startMin: number) => void
  dropDurationMin?: number
  onMoveBlock: (blockId: string, startMin: number, endMin: number) => void
  className?: string
}) {
  const [draft, setDraft] = useState<BlockDraft | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // opens on the 09:00–21:00 window; the rest of the day is a scroll away
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const target = focusBlockId
      ? container.querySelector<HTMLElement>(`[data-block-id="${focusBlockId}"]`)
      : null
    if (target) {
      container.scrollTo({ top: Math.max(0, target.offsetTop - 80), behavior: "smooth" })
      return
    }
    container.scrollTop = (VIEW_START_HOUR * 60 * SLOT_H) / 10
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusBlockId, dateKey])

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>
          타임라인
          <span className="ml-1.5 font-serif text-base font-normal italic text-muted-foreground">
            Schedule
          </span>
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {blocks.length}개 · {hours(progress.plannedMinutes)}h
          </span>
        </CardTitle>
        <Link
          href="/planner"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          주간 계획 <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {/* fixed 09:00–21:00 window; the rest of the day is a scroll away */}
        <div
          ref={scrollRef}
          style={{ height: VIEW_HEIGHT }}
          className="overflow-y-auto no-scrollbar"
        >
          <TimeBlockGrid
            date={date}
            blocks={blocks}
            viewOf={viewOf}
            record={record}
            focusBlockId={focusBlockId}
            onDropItem={onDropItem}
            dropDurationMin={dropDurationMin}
            onMoveBlock={onMoveBlock}
            onInteractionStart={() => setDraft(null)}
            slotHeight={SLOT_H}
            onCreate={(start, end, anchor) => setDraft({ date: dateKey, start, end, anchor })}
            onEdit={(b, anchor) =>
              setDraft({
                id: b.id,
                anchor,
                date: b.date,
                start: b.start,
                end: b.end,
                category: b.category,
                source: b.source,
                actual: b.actual,
                spontaneous: b.spontaneous,
              })
            }
          />
        </div>
      </CardContent>
      <BlockEditor draft={draft} onClose={() => setDraft(null)} />
    </Card>
  )
}
