"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { useGratitudesQuery } from "@/api/queries/gratitude"
import { addDays } from "@/lib/date"
import { dateKey } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { DateNav } from "@/components/date-nav"
import { GratitudeForm } from "@/components/features/gratitude-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** How far back "지난 기록" looks; the server has no range endpoint yet. */
const PAST_DAYS = 7

export default function GratitudePage() {
  const [date, setDate] = useState(() => new Date())
  const key = dateKey(date)

  const pastKeys = useMemo(
    () => Array.from({ length: PAST_DAYS }, (_, i) => dateKey(addDays(date, -(i + 1)))),
    [date]
  )
  const past = useGratitudesQuery(pastKeys)

  return (
    <div>
      <PageHeader
        title="감사 일기"
        en="Gratitude"
        description="오늘 감사한 일 세 가지를 기록하세요"
      >
        <DateNav date={date} onChange={setDate} />
      </PageHeader>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>오늘 감사한 일</CardTitle>
          </CardHeader>
          <CardContent>
            <GratitudeForm dateKey={key} />
          </CardContent>
        </Card>

        {past.data.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">지난 {PAST_DAYS}일 기록</h2>
            {past.data.map((g) => (
              <Card key={g.date}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(g.date), "yyyy년 M월 d일 (eee)", { locale: ko })}
                  </div>
                  <ol className="space-y-1.5 text-sm">
                    {g.items
                      .filter((i) => i.trim())
                      .map((item, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
