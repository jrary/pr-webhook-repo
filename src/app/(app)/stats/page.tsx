"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useMoodsQuery } from "@/api/queries/mood"
import { useStatsQuery } from "@/api/queries/stats"
import { useTimeBlocksQuery } from "@/api/queries/time-block"
import { useTodosQuery } from "@/api/queries/todo"
import { ON_TIME_TOLERANCE_MIN } from "@/lib/progress"
import { weekDays } from "@/lib/date"
import { dateKey } from "@/lib/utils"
import { useCategories } from "@/hooks/use-categories"
import { PageHeader } from "@/components/page-header"
import { CircularProgress } from "@/components/circular-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Period = "day" | "week" | "month"

function rangeFor(period: Period): Date[] {
  const today = new Date()
  if (period === "day") return [today]
  if (period === "week") return weekDays(today).filter((d) => d <= today)
  // month: 1st .. today
  const days: Date[] = []
  for (let d = 1; d <= today.getDate(); d++) {
    days.push(new Date(today.getFullYear(), today.getMonth(), d))
  }
  return days
}

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>("week")
  const categories = useCategories()

  const days = useMemo(() => rangeFor(period), [period])
  const dayKeys = useMemo(() => days.map(dateKey), [days])
  const range = useMemo(
    () => ({ from: dayKeys[0] ?? undefined, to: dayKeys[dayKeys.length - 1] }),
    [dayKeys]
  )

  const { data: summary, isPending } = useStatsQuery(range)
  const { data: blocks } = useTimeBlocksQuery(range)
  const { data: todos } = useTodosQuery(range)
  const moods = useMoodsQuery(dayKeys)

  const rates = summary?.daily
  const adherence = summary?.period

  // 실행률·즉흥 시간·카테고리별 시간은 서버 통계에 없어 타임블록에서 직접 계산한다.
  const fromBlocks = useMemo(() => {
    const list = blocks ?? []
    const planned = list.filter((b) => !b.spontaneous)
    const executed = planned.filter((b) => b.actual != null)
    const plannedMin = planned.reduce((sum, b) => sum + (b.end - b.start), 0)
    const executedMin = executed.reduce((sum, b) => sum + (b.actual!.end - b.actual!.start), 0)
    const spontaneousMin = list
      .filter((b) => b.spontaneous)
      .reduce((sum, b) => sum + ((b.actual?.end ?? b.end) - (b.actual?.start ?? b.start)), 0)

    const minutesByCategory = new Map<string, number>()
    for (const b of planned) {
      minutesByCategory.set(
        b.category,
        (minutesByCategory.get(b.category) ?? 0) + (b.end - b.start)
      )
    }
    const categoryData = categories
      .map((c) => ({
        label: c.label,
        hours: Math.round(((minutesByCategory.get(c.id) ?? 0) / 60) * 10) / 10,
        color: c.color,
      }))
      .filter((d) => d.hours > 0)

    return {
      plannedBlocks: planned.length,
      executedBlocks: executed.length,
      executionRate: planned.length ? Math.round((executed.length / planned.length) * 100) : 0,
      plannedMin,
      executedMin,
      spontaneousMin,
      categoryData,
    }
  }, [blocks, categories])

  const todoCounts = useMemo(() => {
    const list = todos ?? []
    return { total: list.length, done: list.filter((t) => t.done).length }
  }, [todos])

  // 서버가 준 일자별 종합 달성률과 그날의 무드를 나란히 놓아 둘의 관계를 본다.
  const daily = useMemo(
    () =>
      days.map((day, i) => ({
        label: format(day, "M/d"),
        overall: Math.round(summary?.overallByDate?.[dayKeys[i]] ?? 0),
        mood: moods.data[i]?.score ?? null,
      })),
    [days, dayKeys, summary, moods.data]
  )

  const correlation = useMemo(() => {
    const withMood = daily.filter((d) => d.mood !== null) as {
      overall: number
      mood: number
    }[]
    const high = withMood.filter((d) => d.overall >= 70).map((d) => d.mood)
    const low = withMood.filter((d) => d.overall < 70).map((d) => d.mood)
    const avg = (xs: number[]) =>
      xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null
    return {
      highAvg: avg(high),
      lowAvg: avg(low),
      highCount: high.length,
      lowCount: low.length,
    }
  }, [daily])

  const hasMood = daily.some((d) => d.mood !== null)
  const deviationMin = adherence?.totalDeviationMin ?? 0

  return (
    <div>
      <PageHeader title="통계" en="Statistics" description="나의 기록을 한눈에 확인하세요">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="day">일간</TabsTrigger>
            <TabsTrigger value="week">주간</TabsTrigger>
            <TabsTrigger value="month">월간</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>종합 달성률</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
              <CircularProgress value={Math.round(rates?.avgOverallRate ?? 0)} />
              <div className="w-full max-w-xs space-y-3 text-sm">
                <MetricRow
                  label="할 일"
                  value={Math.round(rates?.avgTodoRate ?? 0)}
                  hint={`${todoCounts.done} / ${todoCounts.total} 완료`}
                  color="hsl(var(--primary))"
                />
                <MetricRow
                  label="습관"
                  value={Math.round(rates?.avgHabitRate ?? 0)}
                  hint={habitsLabel(period)}
                  color="var(--category-exercise)"
                />
                <MetricRow
                  label="계획 이행"
                  value={Math.round(rates?.avgPlanRate ?? 0)}
                  hint={
                    fromBlocks.plannedMin
                      ? `${Math.round(fromBlocks.executedMin / 6) / 10}h / ${
                          Math.round(fromBlocks.plannedMin / 6) / 10
                        }h 실행`
                      : "계획된 타임블록 없음"
                  }
                  color="var(--category-work)"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>계획 대비 실행</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fromBlocks.plannedBlocks === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  계획된 타임블록이 없습니다.
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StatTile
                      label="실행률"
                      value={`${fromBlocks.executionRate}%`}
                      hint={`${fromBlocks.executedBlocks}/${fromBlocks.plannedBlocks} 블록`}
                    />
                    <StatTile
                      label="계획 준수도"
                      value={`${Math.round(adherence?.adherenceRate ?? 0)}%`}
                      hint="계획·실제 시간의 겹침 비율"
                    />
                    <StatTile
                      label="정시 시작률"
                      value={`${Math.round(adherence?.onTimeRate ?? 0)}%`}
                      hint={`${ON_TIME_TOLERANCE_MIN}분 이내 시작`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm text-muted-foreground">
                    <span>
                      시간 편차{" "}
                      <span className="font-semibold text-foreground">
                        {signedHours(deviationMin)}
                      </span>
                      {deviationMin > 0
                        ? " (계획보다 오래)"
                        : deviationMin < 0
                          ? " (계획보다 짧게)"
                          : ""}
                    </span>
                    <span>
                      평균 시작 밀림{" "}
                      <span className="font-semibold text-foreground">
                        {Math.round(adherence?.avgShiftMin ?? 0)}분
                      </span>
                    </span>
                    <span>
                      즉흥 시간{" "}
                      <span className="font-semibold text-foreground">
                        {Math.round(fromBlocks.spontaneousMin / 6) / 10}h
                      </span>
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    준수도·정시 시작률은 실제 시간이 기록된 블록만으로 계산합니다.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>카테고리별 시간 사용</CardTitle>
            </CardHeader>
            <CardContent>
              {fromBlocks.categoryData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  기록된 타임블록이 없습니다.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={fromBlocks.categoryData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" unit="h" fontSize={12} />
                    <YAxis type="category" dataKey="label" width={48} fontSize={12} />
                    <Tooltip formatter={(v) => [`${v}시간`, "시간"]} />
                    <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                      {fromBlocks.categoryData.map((d) => (
                        <Cell key={d.label} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>달성률과 무드</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasMood ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  기록된 무드가 없습니다.
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={daily} margin={{ left: -16, right: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" fontSize={12} />
                      <YAxis yAxisId="rate" domain={[0, 100]} unit="%" fontSize={12} />
                      <YAxis
                        yAxisId="mood"
                        orientation="right"
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        fontSize={12}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "무드" ? [value, name] : [`${value}%`, name]
                        }
                      />
                      <Legend fontSize={12} />
                      <Bar
                        yAxisId="rate"
                        dataKey="overall"
                        name="종합 달성률"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      />
                      <Line
                        yAxisId="mood"
                        type="monotone"
                        dataKey="mood"
                        name="무드"
                        stroke="var(--category-exercise)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {correlation.highAvg !== null && correlation.lowAvg !== null ? (
                      <>
                        종합 달성률 70% 이상인 날 무드 평균{" "}
                        <span className="font-semibold text-foreground">{correlation.highAvg}</span>{" "}
                        ({correlation.highCount}일) · 그 외{" "}
                        <span className="font-semibold text-foreground">{correlation.lowAvg}</span>{" "}
                        ({correlation.lowCount}일)
                      </>
                    ) : (
                      "무드와 달성률을 함께 기록한 날이 쌓이면 둘의 관계를 보여드려요."
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function signedHours(minutes: number) {
  const hours = Math.round(Math.abs(minutes) / 6) / 10
  if (minutes === 0) return "0h"
  return `${minutes > 0 ? "+" : "−"}${hours}h`
}

function MetricRow({
  label,
  value,
  hint,
  color,
}: {
  label: string
  value: number
  hint: string
  color: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function habitsLabel(period: Period) {
  return period === "day" ? "오늘 기준" : period === "week" ? "이번 주 기준" : "이번 달 기준"
}
