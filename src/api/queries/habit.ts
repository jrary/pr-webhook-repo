import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Habit } from "@/lib/types";
import { client, unwrap } from "../client";
import type {
  CreateHabitRequest,
  HabitWithStreakResponse,
  UpdateHabitRequest,
} from "../generated";
import { habitQueryKey, statsQueryKey } from "../query-keys";

/** 서버 습관을 화면이 쓰는 `Habit`로. id·카테고리 id는 문자열로 통일한다. */
export function toHabit(res: HabitWithStreakResponse): Habit {
  return {
    id: String(res.id),
    name: res.title ?? "",
    color: res.color ?? "#8a8f98",
    category: res.categoryId != null ? String(res.categoryId) : "",
    loggedToday: res.loggedToday ?? false,
    currentStreak: res.currentStreak ?? 0,
    longestStreak: res.longestStreak ?? 0,
  };
}

/**
 * 습관 목록 조회. `date`를 주면 그 날짜 기준 streak/완료 여부가 함께 온다.
 * @param date YYYY-MM-DD
 */
export function useHabitsQuery(date?: string) {
  return useQuery({
    queryKey: habitQueryKey.list(date),
    queryFn: () => unwrap(client.Habit.getHabits({ date })),
    select: (data) => data.map(toHabit),
  });
}

function useHabitInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: habitQueryKey.all() });
    queryClient.invalidateQueries({ queryKey: statsQueryKey.all() });
  };
}

/**
 * 습관 생성 요청
 * @param CreateHabitRequest
 */
export function useCreateHabitMutation() {
  const invalidate = useHabitInvalidation();
  return useMutation({
    mutationFn: (body: CreateHabitRequest) => unwrap(client.Habit.createHabit({ createHabitRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 습관 수정 요청 (보관 처리 포함)
 * @param habitId, UpdateHabitRequest
 */
export function useUpdateHabitMutation() {
  const invalidate = useHabitInvalidation();
  return useMutation({
    mutationFn: ({ habitId, body }: { habitId: number; body: UpdateHabitRequest }) =>
      unwrap(client.Habit.updateHabit({ habitId, updateHabitRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 습관 삭제 요청
 * @param habitId
 */
export function useDeleteHabitMutation() {
  const invalidate = useHabitInvalidation();
  return useMutation({
    mutationFn: (habitId: number) => unwrap(client.Habit.deleteHabit({ habitId })),
    onSuccess: invalidate,
  });
}

/**
 * 습관 수행 기록 요청. `state: false`면 기록을 취소한다.
 * @param habitId, date YYYY-MM-DD, state
 */
export function useLogHabitMutation() {
  const invalidate = useHabitInvalidation();
  return useMutation({
    mutationFn: ({
      habitId,
      date,
      state,
    }: {
      habitId: number;
      date: string;
      state: boolean;
    }) => unwrap(client.Habit.logHabit({ habitId, date, state })),
    onSuccess: invalidate,
  });
}
