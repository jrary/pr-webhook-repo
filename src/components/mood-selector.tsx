"use client"

import { MOOD_LIST } from "@/lib/categories"
import type { MoodScore } from "@/lib/types"
import { cn } from "@/lib/utils"

export function MoodSelector({
  value,
  onChange,
  size = "md",
}: {
  value?: MoodScore
  onChange: (score: MoodScore) => void
  size?: "sm" | "md" | "lg"
}) {
  const emojiSize = size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl"
  return (
    <div className="flex items-stretch justify-between gap-2">
      {MOOD_LIST.map((mood) => {
        const selected = value === mood.score
        return (
          <button
            key={mood.score}
            type="button"
            onClick={() => onChange(mood.score)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent/40"
            )}
            aria-pressed={selected}
            aria-label={mood.label}
          >
            <span className={cn(emojiSize, "leading-none")}>{mood.emoji}</span>
            <span
              className={cn(
                "text-xs font-medium",
                selected ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {mood.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
