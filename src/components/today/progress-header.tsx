"use client"

import type { Progress } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/circular-progress"
import { Card, CardContent } from "@/components/ui/card"

/** Which metric the user drilled into; drives the list filter / timeline focus. */
export type ProgressFocus = "todo" | "habit" | "plan" | null

function hours(minutes: number) {
  return Math.round(minutes / 6) / 10
}

function MetricBar({
  label,
  value,
  hint,
  color,
  active,
  onClick,
}: {
  label: string
  value: number
  hint: string
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary/60",
        active && "bg-secondary",
      )}
    >
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </button>
  )
}

export function ProgressHeader({
  progress,
  focus,
  onFocus,
  className,
}: {
  progress: Progress
  focus: ProgressFocus
  onFocus: (focus: ProgressFocus) => void
  className?: string
}) {
  function toggle(next: Exclude<ProgressFocus, null>) {
    onFocus(focus === next ? null : next)
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:gap-6">
        <div className="flex shrink-0 flex-col items-center">
          <CircularProgress value={progress.overall} size={96} />
          <p className="mt-1 text-xs text-muted-foreground">종합 달성률</p>
        </div>

        <div className="grid w-full gap-1 sm:grid-cols-3">
          <MetricBar
            label="할 일"
            value={progress.todoRate}
            hint={`${progress.todoDone}/${progress.todoTotal} 완료`}
            color="hsl(var(--primary))"
            active={focus === "todo"}
            onClick={() => toggle("todo")}
          />
          <MetricBar
            label="습관"
            value={progress.habitRate}
            hint={`${progress.habitDone}/${progress.habitTotal} 체크`}
            color="var(--category-exercise)"
            active={focus === "habit"}
            onClick={() => toggle("habit")}
          />
          <MetricBar
            label="계획 이행"
            value={progress.planRate}
            hint={
              progress.plannedMinutes
                ? `${hours(progress.doneMinutes)}h / ${hours(progress.plannedMinutes)}h 실행`
                : "계획된 시간 없음"
            }
            color="var(--category-work)"
            active={focus === "plan"}
            onClick={() => toggle("plan")}
          />
        </div>
      </CardContent>
    </Card>
  )
}
