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
import { useCategories, usePlannerStore } from "@/lib/store"
import {
  dayProgress,
  rangeAdherence,
  rangeProgress,
  ON_TIME_TOLERANCE_MIN,
} from "@/lib/progress"
import { weekDays } from "@/lib/date"
import { dateKey } from "@/lib/utils"
import { useMounted } from "@/hooks/use-mounted"
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
  const mounted = useMounted()
  const [period, setPeriod] = useState<Period>("week")
  const todos = usePlannerStore((s) => s.todos)
  const blocks = usePlannerStore((s) => s.blocks)
  const habits = usePlannerStore((s) => s.habits)
  const moods = usePlannerStore((s) => s.moods)
  const categories = useCategories()

  const stats = useMemo(() => {
    const days = rangeFor(period)
    const keys = new Set(days.map(dateKey))
    const progress = rangeProgress({ todos, habits, blocks }, [...keys])
    const adherence = rangeAdherence({ todos, habits, blocks }, [...keys])

    const categoryMinutes: Record<string, number> = {}
    for (const b of blocks) {
      if (!keys.has(b.date)) continue
      categoryMinutes[b.category] = (categoryMinutes[b.category] ?? 0) + (b.end - b.start)
    }
    const categoryData = categories
      .map((c) => ({
        label: c.label,
        hours: Math.round(((categoryMinutes[c.id] ?? 0) / 60) * 10) / 10,
        color: c.color,
      }))
      .filter((d) => d.hours > 0)

    const moodData = days
      .map((d) => {
        const entry = moods.find((m) => m.date === dateKey(d))
        return entry ? { label: format(d, "M/d"), score: entry.score } : null
      })
      .filter(Boolean) as { label: string; score: number }[]

    // per-day achievement next to that day's mood: the link between the two
    const daily = days.map((d) => {
      const k = dateKey(d)
      const p = dayProgress({ todos, habits, blocks }, k)
      return {
        label: format(d, "M/d"),
        overall: p.overall,
        planRate: p.plannedMinutes ? p.planRate : null,
        mood: moods.find((m) => m.date === k)?.score ?? null,
      }
    })

    const withBoth = daily.filter((d) => d.mood !== null && d.planRate !== null) as {
      planRate: number
      mood: number
    }[]
    const high = withBoth.filter((d) => d.planRate >= 70).map((d) => d.mood)
    const low = withBoth.filter((d) => d.planRate < 70).map((d) => d.mood)
    const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null)
    const correlation = {
      highAvg: avg(high),
      lowAvg: avg(low),
      highCount: high.length,
      lowCount: low.length,
    }

    return { progress, adherence, categoryData, moodData, daily, correlation }
  }, [period, todos, blocks, habits, moods, categories])

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

      {!mounted ? (
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
              <CircularProgress value={stats.progress.overall} />
              <div className="w-full max-w-xs space-y-3 text-sm">
                <MetricRow
                  label="할 일"
                  value={stats.progress.todoRate}
                  hint={`${stats.progress.todoDone} / ${stats.progress.todoTotal} 완료`}
                  color="hsl(var(--primary))"
                />
                <MetricRow
                  label="습관"
                  value={stats.progress.habitRate}
                  hint={`${stats.progress.habitDone} / ${stats.progress.habitTotal} 체크 · ${habitsLabel(period)}`}
                  color="var(--category-exercise)"
                />
                <MetricRow
                  label="계획 이행"
                  value={stats.progress.planRate}
                  hint={
                    stats.progress.plannedMinutes
                      ? `${Math.round(stats.progress.doneMinutes / 6) / 10}h / ${
                          Math.round(stats.progress.plannedMinutes / 6) / 10
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
              {stats.adherence.plannedBlocks === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  계획된 타임블록이 없습니다.
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <StatTile
                      label="실행률"
                      value={`${stats.adherence.executionRate}%`}
                      hint={`${stats.adherence.executedBlocks}/${stats.adherence.plannedBlocks} 블록`}
                    />
                    <StatTile
                      label="계획 준수도"
                      value={
                        stats.adherence.recordedBlocks ? `${stats.adherence.adherenceRate}%` : "—"
                      }
                      hint="계획·실제 시간의 겹침 비율"
                    />
                    <StatTile
                      label="정시 시작률"
                      value={stats.adherence.recordedBlocks ? `${stats.adherence.onTimeRate}%` : "—"}
                      hint={`${ON_TIME_TOLERANCE_MIN}분 이내 시작`}
                    />
                    <StatTile
                      label="기록률"
                      value={`${stats.adherence.recordRate}%`}
                      hint={`실행 ${stats.adherence.executedBlocks}건 중 ${stats.adherence.recordedBlocks}건 시간 기록`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-sm text-muted-foreground">
                    <span>
                      시간 편차{" "}
                      <span className="font-semibold text-foreground">
                        {signedHours(stats.adherence.deviationMin)}
                      </span>
                      {stats.adherence.deviationMin > 0
                        ? " (계획보다 오래)"
                        : stats.adherence.deviationMin < 0
                          ? " (계획보다 짧게)"
                          : ""}
                    </span>
                    <span>
                      평균 시작 밀림{" "}
                      <span className="font-semibold text-foreground">
                        {stats.adherence.avgShiftMin}분
                      </span>
                    </span>
                    <span>
                      즉흥 시간{" "}
                      <span className="font-semibold text-foreground">
                        {Math.round(stats.adherence.spontaneousMin / 6) / 10}h
                      </span>
                    </span>
                  </div>

                  {stats.adherence.recordRate < 100 ? (
                    <p className="text-xs text-muted-foreground">
                      준수도·정시 시작률은 실제 시간이 기록된 블록만으로 계산합니다.
                    </p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>카테고리별 시간 사용</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.categoryData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  기록된 타임블록이 없습니다.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.categoryData} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number" unit="h" fontSize={12} />
                    <YAxis type="category" dataKey="label" width={48} fontSize={12} />
                    <Tooltip formatter={(v) => [`${v}시간`, "시간"]} />
                    <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                      {stats.categoryData.map((d) => (
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
              {stats.moodData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  기록된 무드가 없습니다.
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={stats.daily} margin={{ left: -16, right: -16 }}>
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
                    {stats.correlation.highAvg !== null && stats.correlation.lowAvg !== null ? (
                      <>
                        계획 이행률 70% 이상인 날 무드 평균{" "}
                        <span className="font-semibold text-foreground">
                          {stats.correlation.highAvg}
                        </span>{" "}
                        ({stats.correlation.highCount}일) · 그 외{" "}
                        <span className="font-semibold text-foreground">
                          {stats.correlation.lowAvg}
                        </span>{" "}
                        ({stats.correlation.lowCount}일)
                      </>
                    ) : (
                      "무드와 계획 이행을 함께 기록한 날이 쌓이면 둘의 관계를 보여드려요."
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

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
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
