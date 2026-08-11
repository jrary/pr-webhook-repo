import type { Category, MoodScore } from "./types"

/** Palette offered when creating or editing a category. */
export const CATEGORY_COLORS = [
  "#6f8caf",
  "#7ba05b",
  "#c39a4c",
  "#9a82b5",
  "#c98ba0",
  "#5c9ea3",
  "#cf6b5e",
  "#8a8f98",
]

/** Stand-in for a category that was deleted while items still referenced it. */
export const UNKNOWN_CATEGORY: Category = { id: "unknown", label: "미분류", color: "#8a8f98" }

export function findCategory(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) ?? { ...UNKNOWN_CATEGORY, id }
}

export interface MoodMeta {
  score: MoodScore
  emoji: string
  label: string
  color: string
}

export const MOODS: Record<MoodScore, MoodMeta> = {
  1: { score: 1, emoji: "😢", label: "최악", color: "var(--mood-1)" },
  2: { score: 2, emoji: "😕", label: "별로야", color: "var(--mood-2)" },
  3: { score: 3, emoji: "😐", label: "평범해", color: "var(--mood-3)" },
  4: { score: 4, emoji: "🙂", label: "좋아요", color: "var(--mood-4)" },
  5: { score: 5, emoji: "😄", label: "최고야", color: "var(--mood-5)" },
}

export const MOOD_LIST = Object.values(MOODS)
