"use client"

import { useMemo } from "react"
import { useHabitsQuery } from "@/api/queries/habit"
import { dateKey } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { AddHabitButton } from "@/components/features/habit-dialog"
import { HabitCard } from "@/components/features/habit-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function HabitsPage() {
  const today = useMemo(() => dateKey(new Date()), [])
  const { data, isPending } = useHabitsQuery(today)
  const habits = data ?? []

  return (
    <div>
      <PageHeader title="습관" en="Habits" description="매일의 작은 실천을 추적하세요">
        <AddHabitButton />
      </PageHeader>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            아직 습관이 없습니다. 우측 상단에서 추가해보세요.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} date={today} />
          ))}
        </div>
      )}
    </div>
  )
}
