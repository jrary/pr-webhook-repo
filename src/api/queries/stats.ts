import { useQuery } from "@tanstack/react-query";
import { progressOf, type Progress } from "@/lib/progress";
import type { GratitudeEntry, Habit, MoodEntry, TimeBlock, Todo } from "@/lib/types";
import { client, unwrap } from "../client";
import type { DayResponse } from "../generated";
import { statsQueryKey, type DateRange } from "../query-keys";
import { toGratitude } from "./gratitude";
import { toHabit } from "./habit";
import { toMood } from "./mood";
import { toTimeBlock } from "./time-block";
import { toTodo } from "./todo";

/** 하루 화면이 필요한 모든 것. `GET /api/stats/days/{date}` 한 번으로 받는다. */
export interface DayData {
  date: string;
  todos: Todo[];
  habits: Habit[];
  blocks: TimeBlock[];
  mood: MoodEntry | null;
  gratitude: GratitudeEntry | null;
  progress: Progress;
}

function toDay(res: DayResponse, date: string): DayData {
  const todos = (res.todos ?? []).map(toTodo);
  const habits = (res.habits ?? []).map(toHabit);
  const blocks = (res.blocks ?? []).map(toTimeBlock).sort((a, b) => a.start - b.start);
  return {
    date: res.date ?? date,
    todos,
    habits,
    blocks,
    mood: toMood(res.mood, date),
    gratitude: toGratitude(res.gratitude, date),
    progress: progressOf(res.progress, { todos, habits, blocks }),
  };
}

/** 기간 통계 조회 (달성률 평균, 계획 준수율) */
export function useStatsQuery(range: DateRange) {
  return useQuery({
    queryKey: statsQueryKey.range(range),
    queryFn: () => unwrap(client.Stats.getStats(range)),
  });
}

/**
 * 하루 전체 데이터 조회. 할 일·습관·타임블록·무드·감사·달성률을 한 번에 받는다.
 * @param date YYYY-MM-DD
 */
export function useDayQuery(date: string) {
  return useQuery({
    queryKey: statsQueryKey.day(date),
    queryFn: () => unwrap(client.Stats.getDayData({ date })),
    select: (data) => toDay(data, date),
  });
}
