"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useMoodsQuery } from "@/api/queries/mood"
import { monthGrid } from "@/lib/date"
import { dateKey } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { DateNav } from "@/components/date-nav"
import { MoodForm } from "@/components/features/mood-form"
import { MoodCalendar } from "@/components/features/mood-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MoodPage() {
  const [date, setDate] = useState(() => new Date())
  const key = dateKey(date)

  // no range endpoint for moods, so the calendar asks day by day
  const monthKeys = useMemo(
    () =>
      monthGrid(date)
        .flat()
        .filter((day) => day.getMonth() === date.getMonth())
        .map(dateKey),
    [date],
  )
  const moods = useMoodsQuery(monthKeys)

  return (
    <div>
      <PageHeader title="무드" en="Mood" description="오늘의 기분을 기록하고 흐름을 확인하세요">
        <DateNav date={date} onChange={setDate} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>오늘의 기분</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodForm dateKey={key} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{format(date, "yyyy년 M월", { locale: ko })} 무드</CardTitle>
          </CardHeader>
          <CardContent>
            {moods.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <MoodCalendar month={date} moods={moods.data} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
