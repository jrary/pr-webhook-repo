import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export function HabitStreakBadge({ streak, className }: { streak: number; className?: string }) {
  if (streak <= 0) {
    return <span className={cn("text-xs text-muted-foreground", className)}>아직 기록 없음</span>
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600",
        className
      )}
    >
      <Flame className="h-3.5 w-3.5" />
      {streak}일 연속 달성 중
    </span>
  )
}
