import { create } from "zustand"
import { persist } from "zustand/middleware"
import { dateKey } from "./utils"
import { DEFAULT_ESTIMATE_MIN } from "./progress"
import { DEFAULT_CATEGORIES, findCategory } from "./categories"
import type {
  ActualInterval,
  Category,
  CategoryKey,
  GratitudeEntry,
  Habit,
  MoodEntry,
  MoodScore,
  PlanSource,
  PlanSourceType,
  TimeBlock,
  Todo,
} from "./types"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Recording a block as executed also checks off the todo/habit behind it,
 * and clearing the record unchecks it. Free blocks have nothing to update.
 */
function applySourceDone(
  state: { todos: Todo[]; habits: Habit[] },
  block: TimeBlock,
  done: boolean,
) {
  if (block.source?.type === "todo") {
    const refId = block.source.refId
    return {
      todos: state.todos.map((t) => (t.id === refId ? { ...t, done } : t)),
      habits: state.habits,
    }
  }
  if (block.source?.type === "habit") {
    const refId = block.source.refId
    return {
      todos: state.todos,
      habits: state.habits.map((h) => {
        if (h.id !== refId) return h
        const has = h.history.includes(block.date)
        if (done === has) return h
        return {
          ...h,
          history: done ? [...h.history, block.date] : h.history.filter((d) => d !== block.date),
        }
      }),
    }
  }
  return { todos: state.todos, habits: state.habits }
}

interface PlannerState {
  categories: Category[]
  todos: Todo[]
  blocks: TimeBlock[]
  habits: Habit[]
  moods: MoodEntry[]
  gratitude: GratitudeEntry[]

  // categories
  addCategory: (input: { label: string; color: string }) => void
  updateCategory: (id: string, patch: { label?: string; color?: string }) => void
  /** removes the category and moves everything that used it to `fallbackId` */
  removeCategory: (id: string) => void

  // todos
  addTodo: (input: {
    title: string
    category: CategoryKey
    date: string
    estimateMin?: number
  }) => void
  toggleTodo: (id: string) => void
  updateTodo: (id: string, patch: Partial<Todo>) => void
  removeTodo: (id: string) => void
  reorderTodos: (date: string, orderedIds: string[]) => void

  // time blocks
  addBlock: (input: Omit<TimeBlock, "id">) => void
  updateBlock: (id: string, patch: Partial<TimeBlock>) => void
  removeBlock: (id: string) => void
  /** attach a block to a todo/habit, or pass null to turn it into a free block */
  linkBlock: (blockId: string, source: PlanSource | null) => void
  /** record (or clear, with null) when the block really happened */
  setActual: (blockId: string, actual: ActualInterval | null) => void
  /** record it as having gone exactly as planned */
  markAsPlanned: (blockId: string) => void
  /** schedule a todo/habit: creates the block and the link in one step */
  planItem: (input: {
    type: PlanSourceType
    refId: string
    date: string
    start: number
    /** defaults to the item's estimate/default length */
    durationMin?: number
  }) => void

  // habits
  addHabit: (input: {
    name: string
    emoji: string
    color: CategoryKey
    /** planned length in minutes; undefined = no fixed duration */
    defaultMin?: number
  }) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  removeHabit: (id: string) => void
  toggleHabit: (id: string, date: string) => void

  // mood
  setMood: (date: string, score: MoodScore, note?: string) => void

  // gratitude
  setGratitude: (date: string, items: [string, string, string]) => void
}

function buildSeed() {
  const today = new Date()
  const t = dateKey(today)
  const yesterday = dateKey(addDays(today, -1))

  const todoIds = { algo: uid(), workout: uid(), meeting: uid(), read: uid() }
  const habitIds = { exercise: uid(), read: uid(), water: uid() }

  const todos: Todo[] = [
    {
      id: todoIds.algo,
      title: "알고리즘 문제 3개 풀기",
      category: "study",
      done: false,
      date: t,
      order: 0,
      estimateMin: 30,
    },
    {
      id: todoIds.workout,
      title: "운동 30분",
      category: "exercise",
      done: true,
      date: t,
      order: 1,
      estimateMin: 30,
    },
    {
      id: todoIds.meeting,
      title: "프로젝트 회의",
      category: "work",
      done: false,
      date: t,
      order: 2,
      estimateMin: 60,
    },
    {
      id: todoIds.read,
      title: "책 30페이지 읽기",
      category: "personal",
      done: false,
      date: t,
      order: 3,
      estimateMin: 40,
    },
  ]

  const blocks: TimeBlock[] = [
    {
      id: uid(),
      category: "study",
      date: t,
      start: 9 * 60,
      end: 9 * 60 + 30,
      source: { type: "todo", refId: todoIds.algo },
      // started 20 minutes late and ran a bit long
      actual: { start: 9 * 60 + 20, end: 10 * 60 },
    },
    {
      id: uid(),
      category: "work",
      date: t,
      start: 11 * 60,
      end: 12 * 60,
      source: { type: "todo", refId: todoIds.meeting },
    },
    // free block: no todo, no habit behind it
    {
      id: uid(),
      category: "rest",
      date: t,
      start: 12 * 60,
      end: 13 * 60,
      actual: { start: 12 * 60, end: 13 * 60 },
    },
    {
      id: uid(),
      category: "exercise",
      date: t,
      start: 18 * 60,
      end: 18 * 60 + 30,
      source: { type: "habit", refId: habitIds.exercise },
    },
  ]

  // habits with a few days of streak history
  const exerciseHistory = [0, 1, 2, 3].map((d) => dateKey(addDays(today, -d)))
  const readHistory = [0, 1, 2, 3, 4].map((d) => dateKey(addDays(today, -d)))
  const habits: Habit[] = [
    {
      id: habitIds.exercise,
      name: "운동하기",
      emoji: "🏃",
      color: "exercise",
      createdAt: dateKey(addDays(today, -30)),
      history: exerciseHistory,
      defaultMin: 30,
    },
    {
      id: habitIds.read,
      name: "책 읽기",
      emoji: "📚",
      color: "study",
      createdAt: dateKey(addDays(today, -30)),
      history: readHistory,
      defaultMin: 20,
    },
    {
      id: habitIds.water,
      name: "물 2L 마시기",
      emoji: "💧",
      color: "personal",
      createdAt: dateKey(addDays(today, -30)),
      history: [1, 2, 4].map((d) => dateKey(addDays(today, -d))),
      // no defaultMin: not a thing you put on the timeline
    },
  ]

  const moods: MoodEntry[] = [
    { date: yesterday, score: 4, note: "괜찮은 하루였다" },
    { date: dateKey(addDays(today, -2)), score: 3 },
    { date: dateKey(addDays(today, -3)), score: 5, note: "최고의 하루!" },
    { date: dateKey(addDays(today, -4)), score: 4 },
  ]

  const gratitude: GratitudeEntry[] = [
    {
      date: yesterday,
      items: ["오늘 날씨가 좋아서 산책했다", "맛있는 점심을 먹었다", "친구에게 좋은 소식을 들었다"],
    },
  ]

  return { categories: DEFAULT_CATEGORIES, todos, blocks, habits, moods, gratitude }
}

/** v1 blocks carried an unused `todoId`; v2 turns it into a real `source` link. */
function migrateV1ToV2(persisted: unknown) {
  const state = persisted as { blocks?: (TimeBlock & { todoId?: string })[] }
  if (!state?.blocks) return state
  return {
    ...state,
    blocks: state.blocks.map(({ todoId, ...block }) => ({
      ...block,
      source: block.source ?? (todoId ? { type: "todo" as const, refId: todoId } : undefined),
    })),
  }
}

/** v4 replaces the boolean `done` with a recorded actual interval. */
function migrateV3ToV4(persisted: unknown) {
  const state = persisted as { blocks?: (TimeBlock & { done?: boolean })[] }
  if (!state?.blocks) return state
  return {
    ...state,
    blocks: state.blocks.map(({ done, ...block }) => ({
      ...block,
      actual: block.actual ?? (done ? { start: block.start, end: block.end } : undefined),
    })),
  }
}

/** v3 moves the five hard-coded categories into editable state. */
function migrateV2ToV3(persisted: unknown) {
  const state = persisted as { categories?: Category[] }
  if (state?.categories?.length) return state
  return { ...state, categories: DEFAULT_CATEGORIES }
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      ...buildSeed(),

      addCategory: ({ label, color }) =>
        set((s) => ({ categories: [...s.categories, { id: uid(), label, color }] })),
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCategory: (id) =>
        set((s) => {
          // never leave the app without a category to assign
          if (s.categories.length <= 1) return s
          const fallback = s.categories.find((c) => c.id !== id)!.id
          const swap = <T extends { category: CategoryKey }>(item: T) =>
            item.category === id ? { ...item, category: fallback } : item
          return {
            categories: s.categories.filter((c) => c.id !== id),
            todos: s.todos.map(swap),
            blocks: s.blocks.map(swap),
            habits: s.habits.map((h) => (h.color === id ? { ...h, color: fallback } : h)),
          }
        }),

      addTodo: ({ title, category, date, estimateMin }) =>
        set((s) => ({
          todos: [
            ...s.todos,
            {
              id: uid(),
              title,
              category,
              done: false,
              date,
              order: s.todos.filter((td) => td.date === date).length,
              estimateMin,
            },
          ],
        })),
      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((td) => (td.id === id ? { ...td, done: !td.done } : td)),
        })),
      updateTodo: (id, patch) =>
        set((s) => ({
          todos: s.todos.map((td) => (td.id === id ? { ...td, ...patch } : td)),
        })),
      removeTodo: (id) =>
        set((s) => ({
          todos: s.todos.filter((td) => td.id !== id),
          // the time stays, it just goes back to being a free block
          blocks: s.blocks.map((b) =>
            b.source?.type === "todo" && b.source.refId === id ? { ...b, source: undefined } : b,
          ),
        })),
      reorderTodos: (date, orderedIds) =>
        set((s) => ({
          todos: s.todos.map((td) =>
            td.date === date && orderedIds.includes(td.id)
              ? { ...td, order: orderedIds.indexOf(td.id) }
              : td,
          ),
        })),

      addBlock: (input) => set((s) => ({ blocks: [...s.blocks, { ...input, id: uid() }] })),
      updateBlock: (id, patch) =>
        set((s) => ({
          blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),
      linkBlock: (blockId, source) =>
        set((s) => ({
          blocks: s.blocks.map((b) =>
            b.id === blockId ? { ...b, source: source ?? undefined } : b,
          ),
        })),
      setActual: (blockId, actual) =>
        set((s) => {
          const block = s.blocks.find((b) => b.id === blockId)
          if (!block) return s
          return {
            ...applySourceDone(s, block, actual !== null),
            blocks: s.blocks.map((b) =>
              b.id === blockId ? { ...b, actual: actual ?? undefined } : b,
            ),
          }
        }),
      markAsPlanned: (blockId) =>
        set((s) => {
          const block = s.blocks.find((b) => b.id === blockId)
          if (!block) return s
          return {
            ...applySourceDone(s, block, true),
            blocks: s.blocks.map((b) =>
              b.id === blockId ? { ...b, actual: { start: b.start, end: b.end } } : b,
            ),
          }
        }),
      planItem: ({ type, refId, date, start, durationMin }) =>
        set((s) => {
          const todo = type === "todo" ? s.todos.find((t) => t.id === refId) : undefined
          const habit = type === "habit" ? s.habits.find((h) => h.id === refId) : undefined
          if (!todo && !habit) return s

          const length =
            durationMin ??
            (todo ? todo.estimateMin ?? DEFAULT_ESTIMATE_MIN : habit!.defaultMin ?? DEFAULT_ESTIMATE_MIN)

          return {
            blocks: [
              ...s.blocks,
              {
                id: uid(),
                category: todo ? todo.category : habit!.color,
                date,
                start,
                end: Math.min(24 * 60, start + length),
                source: { type, refId },
              },
            ],
          }
        }),

      addHabit: ({ name, emoji, color, defaultMin }) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: uid(),
              name,
              emoji,
              color,
              createdAt: dateKey(new Date()),
              history: [],
              defaultMin,
            },
          ],
        })),
      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),
      removeHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          blocks: s.blocks.map((b) =>
            b.source?.type === "habit" && b.source.refId === id ? { ...b, source: undefined } : b,
          ),
        })),
      toggleHabit: (id, date) =>
        set((s) => ({
          habits: s.habits.map((h) => {
            if (h.id !== id) return h
            const has = h.history.includes(date)
            return {
              ...h,
              history: has ? h.history.filter((d) => d !== date) : [...h.history, date],
            }
          }),
        })),

      setMood: (date, score, note) =>
        set((s) => {
          const exists = s.moods.some((m) => m.date === date)
          return {
            moods: exists
              ? s.moods.map((m) => (m.date === date ? { date, score, note } : m))
              : [...s.moods, { date, score, note }],
          }
        }),

      setGratitude: (date, items) =>
        set((s) => {
          const exists = s.gratitude.some((g) => g.date === date)
          return {
            gratitude: exists
              ? s.gratitude.map((g) => (g.date === date ? { date, items } : g))
              : [...s.gratitude, { date, items }],
          }
        }),
    }),
    {
      name: "d-log-store",
      version: 4,
      migrate: (persisted, version) => {
        let state = persisted
        if (version < 2) state = migrateV1ToV2(state)
        if (version < 3) state = migrateV2ToV3(state)
        if (version < 4) state = migrateV3ToV4(state)
        return state as PlannerState
      },
    },
  ),
)

/** Categories as edited by the user. */
export function useCategories() {
  return usePlannerStore((s) => s.categories)
}

/** One category by id, falling back to a neutral "미분류" when it was deleted. */
export function useCategory(id: CategoryKey) {
  const categories = useCategories()
  return findCategory(categories, id)
}

/** The data every "today" view needs: todos, habits and blocks read together. */
export type PlannerData = Pick<PlannerState, "todos" | "habits" | "blocks">

/** A todo or habit shown as one row in the unified "오늘 할 것" list. */
export interface PlanItem {
  /** stable react key, unique across both types */
  key: string
  type: PlanSourceType
  refId: string
  title: string
  category: CategoryKey
  emoji?: string
  done: boolean
  /** block length used when scheduling; undefined = not schedulable */
  defaultMin?: number
  schedulable: boolean
  /** blocks on this date that schedule this item */
  blocks: TimeBlock[]
}

/** Todos and habits of a day merged into one list, each with its linked blocks. */
export function dayPlanItems(s: PlannerData, key: string): PlanItem[] {
  const dayBlocks = s.blocks.filter((b) => b.date === key)
  const blocksFor = (type: PlanSourceType, refId: string) =>
    dayBlocks
      .filter((b) => b.source?.type === type && b.source.refId === refId)
      .sort((a, b) => a.start - b.start)

  const todoItems: PlanItem[] = s.todos
    .filter((t) => t.date === key)
    .sort((a, b) => a.order - b.order)
    .map((t) => ({
      key: `todo:${t.id}`,
      type: "todo" as const,
      refId: t.id,
      title: t.title,
      category: t.category,
      done: t.done,
      defaultMin: t.estimateMin ?? DEFAULT_ESTIMATE_MIN,
      schedulable: true,
      blocks: blocksFor("todo", t.id),
    }))

  const habitItems: PlanItem[] = s.habits.map((h) => ({
    key: `habit:${h.id}`,
    type: "habit" as const,
    refId: h.id,
    title: h.name,
    category: h.color,
    emoji: h.emoji,
    done: h.history.includes(key),
    defaultMin: h.defaultMin,
    // habits without a fixed duration can still be dropped on the timeline
    schedulable: true,
    blocks: blocksFor("habit", h.id),
  }))

  return [...todoItems, ...habitItems]
}

/** Schedulable items of the day that have no block yet — the "미배치" badge count. */
export function unplannedItems(s: PlannerData, key: string): PlanItem[] {
  return dayPlanItems(s, key).filter((i) => i.schedulable && i.blocks.length === 0)
}
