"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useDayQuery } from "@/api/queries/stats"
import { useUpdateTimeBlockMutation } from "@/api/queries/time-block"
import { dateKey } from "@/lib/utils"
import { isBlockDone, isBlockMissed } from "@/lib/progress"
import { useNow } from "@/hooks/use-now"
import { useRecordApi } from "@/hooks/use-record-api"
import type { TimeBlock } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { DateNav } from "@/components/date-nav"
import { TimeBlockGrid } from "@/components/features/time-block-grid"
import { BlockEditor, type BlockDraft } from "@/components/features/block-editor"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const EMPTY_DAY = { todos: [], habits: [], blocks: [] }

export default function PlannerPage() {
  const now = useNow()
  const [date, setDate] = useState(() => new Date())
  const [draft, setDraft] = useState<BlockDraft | null>(null)

  const key = dateKey(date)
  const { data: day, isPending } = useDayQuery(key)
  const record = useRecordApi()
  const updateBlock = useUpdateTimeBlockMutation()

  const source = useMemo(
    () => (day ? { todos: day.todos, habits: day.habits, blocks: day.blocks } : EMPTY_DAY),
    [day]
  )

  return (
    <div>
      <PageHeader
        title="시간 계획"
        en="Schedule"
        description="드래그로 계획을 만들고, 실행 기록 후에는 같은 드래그로 실제 시간을 고칩니다"
      >
        <DateNav date={date} onChange={setDate} />
      </PageHeader>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {isPending ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
              <TimeBlockGrid
                date={date}
                blocks={source.blocks}
                viewOf={(b) => ({
                  done: isBlockDone(b, source),
                  missed: isBlockMissed(b, source, now ?? new Date()),
                  sourceIcon:
                    b.source?.type === "todo"
                      ? "📌"
                      : b.source?.type === "habit"
                        ? "🔁"
                        : undefined,
                })}
                record={record}
                onMoveBlock={(id, start, end) =>
                  updateBlock.mutate(
                    { blockId: Number(id), body: { planStart: start, planEnd: end } },
                    { onError: (error) => toast.error(error.message) }
                  )
                }
                onInteractionStart={() => setDraft(null)}
                onCreate={(start, end, anchor) => setDraft({ date: key, start, end, anchor })}
                onEdit={(b: TimeBlock, anchor) =>
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
          )}
        </CardContent>
      </Card>

      <BlockEditor draft={draft} onClose={() => setDraft(null)} />
    </div>
  )
}
