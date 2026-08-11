import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { GratitudeEntry } from "@/lib/types";
import { client, unwrap } from "../client";
import type { GratitudeResponse, UpsertGratitudeRequest } from "../generated";
import { gratitudeQueryKey } from "../query-keys";

/** 기록이 없는 날은 서버가 빈 응답을 주므로 `null`로 정규화한다. */
export function toGratitude(
  res: GratitudeResponse | undefined,
  date: string,
): GratitudeEntry | null {
  if (!res) return null;
  const items: [string, string, string] = [
    res.content1 ?? "",
    res.content2 ?? "",
    res.content3 ?? "",
  ];
  if (items.every((item) => !item.trim())) return null;
  return { date: res.date ?? date, items };
}

/**
 * 감사 기록 조회
 * @param date YYYY-MM-DD
 */
export function useGratitudeQuery(date: string) {
  return useQuery({
    queryKey: gratitudeQueryKey.detail(date),
    queryFn: () => unwrap(client.Gratitude.getGratitude({ date })),
    select: (data) => toGratitude(data, date),
  });
}

/**
 * 여러 날짜의 감사 기록 조회. 서버에 기간 조회가 없어 날짜마다 한 번씩 요청한다.
 * @param dates YYYY-MM-DD 배열
 */
export function useGratitudesQuery(dates: string[]) {
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: gratitudeQueryKey.detail(date),
      queryFn: () => unwrap(client.Gratitude.getGratitude({ date })),
      select: (data: GratitudeResponse | undefined) => toGratitude(data, date),
      retry: false,
    })),
    combine: (results) => ({
      data: results
        .map((result) => result.data)
        .filter((entry): entry is GratitudeEntry => entry != null),
      isPending: results.some((result) => result.isPending),
    }),
  });
}

/**
 * 감사 기록 저장 요청 (없으면 생성, 있으면 수정)
 * @param date, UpsertGratitudeRequest
 */
export function useUpsertGratitudeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, body }: { date: string; body: UpsertGratitudeRequest }) =>
      unwrap(client.Gratitude.upsertGratitude({ date, upsertGratitudeRequest: body })),
    onSuccess: (_data, { date }) =>
      queryClient.invalidateQueries({ queryKey: gratitudeQueryKey.detail(date) }),
  });
}
