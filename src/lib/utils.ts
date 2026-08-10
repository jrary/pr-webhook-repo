import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Translucent version of a category color; falls back to color-mix for non-hex input. */
export function withAlpha(color: string, alpha: number) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)
  if (hex) {
    const value = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
      .toString(16)
      .padStart(2, "0")
    return `${color}${value}`
  }
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}

/** Format a Date as a stable YYYY-MM-DD key in local time. */
export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
