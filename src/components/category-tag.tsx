"use client"

import { useCategory } from "@/hooks/use-categories"
import type { CategoryKey } from "@/lib/types"
import { cn, withAlpha } from "@/lib/utils"

export function CategoryTag({
  category,
  className,
}: {
  category: CategoryKey
  className?: string
}) {
  const meta = useCategory(category)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ backgroundColor: withAlpha(meta.color, 0.12), color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}
