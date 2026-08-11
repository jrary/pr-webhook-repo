import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { MoodEntry, MoodScore } from "@/lib/types";
import { client, unwrap } from "../client";
import type { MoodResponse, UpsertMoodRequest } from "../generated";
import { moodQueryKey } from "../query-keys";

/** 기록이 없는 날은 서버가 빈 응답을 주므로 `null`로 정규화한다. */
export function toMood(res: MoodResponse | undefined, date: string): MoodEntry | null {
  if (res?.score == null) return null;
  return {
    date: res.date ?? date,
    score: res.score as MoodScore,
    note: res.note ?? undefined,
  };
}

/**
 * 무드 조회
 * @param date YYYY-MM-DD
 */
export function useMoodQuery(date: string) {
  return useQuery({
    queryKey: moodQueryKey.detail(date),
    queryFn: () => unwrap(client.Mood.getMood({ date })),
    select: (data) => toMood(data, date),
  });
}

/**
 * 여러 날짜의 무드 조회. 서버에 기간 조회가 없어 날짜마다 한 번씩 요청한다.
 * @param dates YYYY-MM-DD 배열
 */
export function useMoodsQuery(dates: string[]) {
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: moodQueryKey.detail(date),
      queryFn: () => unwrap(client.Mood.getMood({ date })),
      select: (data: MoodResponse | undefined) => toMood(data, date),
      retry: false,
    })),
    combine: (results) => ({
      data: results
        .map((result) => result.data)
        .filter((entry): entry is MoodEntry => entry != null),
      isPending: results.some((result) => result.isPending),
    }),
  });
}

/**
 * 무드 저장 요청 (없으면 생성, 있으면 수정)
 * @param date, UpsertMoodRequest
 */
export function useUpsertMoodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, body }: { date: string; body: UpsertMoodRequest }) =>
      unwrap(client.Mood.upsertMood({ date, upsertMoodRequest: body })),
    onSuccess: (_data, { date }) =>
      queryClient.invalidateQueries({ queryKey: moodQueryKey.detail(date) }),
  });
}
