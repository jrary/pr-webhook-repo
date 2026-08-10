"use client"

import { useMemo, useState } from "react"
import { usePlannerStore } from "@/lib/store"
import { dateKey } from "@/lib/utils"
import { isBlockDone, isBlockMissed } from "@/lib/progress"
import { useMounted } from "@/hooks/use-mounted"
import { useNow } from "@/hooks/use-now"
import { useRecordApi } from "@/hooks/use-record-api"
import type { TimeBlock } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { DateNav } from "@/components/date-nav"
import { TimeBlockGrid } from "@/components/features/time-block-grid"
import { BlockEditor, type BlockDraft } from "@/components/features/block-editor"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlannerPage() {
  const mounted = useMounted()
  const now = useNow()
  const [date, setDate] = useState(() => new Date())
  const [draft, setDraft] = useState<BlockDraft | null>(null)
  const blocks = usePlannerStore((s) => s.blocks)
  const todos = usePlannerStore((s) => s.todos)
  const habits = usePlannerStore((s) => s.habits)
  const record = useRecordApi()
  const updateBlock = usePlannerStore((s) => s.updateBlock)

  const key = dateKey(date)
  const dayBlocks = useMemo(() => blocks.filter((b) => b.date === key), [blocks, key])
  const source = useMemo(() => ({ todos, habits, blocks }), [todos, habits, blocks])

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
          {!mounted ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
              <TimeBlockGrid
                date={date}
                blocks={dayBlocks}
                viewOf={(b) => ({
                  done: isBlockDone(b, source),
                  missed: isBlockMissed(b, source, now ?? new Date()),
                  sourceIcon:
                    b.source?.type === "todo" ? "📌" : b.source?.type === "habit" ? "🔁" : undefined,
                })}
                record={record}
                onMoveBlock={(id, start, end) => updateBlock(id, { start, end })}
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
