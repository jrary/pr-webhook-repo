import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanSourceType, TimeBlock } from "@/lib/types";
import { client, unwrap } from "../client";
import type {
  CreateTimeBlockRequest,
  PlanItemRequest,
  RecordActualRequest,
  TimeBlockResponse,
  UpdateTimeBlockRequest,
} from "../generated";
import {
  habitQueryKey,
  statsQueryKey,
  timeBlockQueryKey,
  todoQueryKey,
  type DateRange,
} from "../query-keys";

/** 서버 타임블록을 화면이 쓰는 `TimeBlock`으로. */
export function toTimeBlock(res: TimeBlockResponse): TimeBlock {
  const hasActual = res.actualStart != null && res.actualEnd != null;
  return {
    id: String(res.id),
    category: res.categoryId != null ? String(res.categoryId) : "",
    date: res.date ?? "",
    start: res.planStart ?? 0,
    end: res.planEnd ?? 0,
    source:
      res.sourceType && res.sourceId != null
        ? {
            type: res.sourceType.toLowerCase() as PlanSourceType,
            refId: String(res.sourceId),
          }
        : undefined,
    actual: hasActual ? { start: res.actualStart!, end: res.actualEnd! } : undefined,
    spontaneous: res.spontaneous ?? false,
  };
}

/** 타임블록 목록 조회 (기간) */
export function useTimeBlocksQuery(range: DateRange) {
  return useQuery({
    queryKey: timeBlockQueryKey.list(range),
    queryFn: () => unwrap(client.TimeBlock.getTimeBlocks(range)),
    select: (data) => data.map(toTimeBlock).sort((a, b) => a.start - b.start),
  });
}

function useTimeBlockInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: timeBlockQueryKey.all() });
    queryClient.invalidateQueries({ queryKey: statsQueryKey.all() });
    // 블록 완료/실행 기록은 서버에서 할 일 완료·습관 로그와 동기화된다.
    queryClient.invalidateQueries({ queryKey: todoQueryKey.all() });
    queryClient.invalidateQueries({ queryKey: habitQueryKey.all() });
  };
}

/**
 * 타임블록 생성 요청 (자유 블록)
 * @param CreateTimeBlockRequest
 */
export function useCreateTimeBlockMutation() {
  const invalidate = useTimeBlockInvalidation();
  return useMutation({
    mutationFn: (body: CreateTimeBlockRequest) =>
      unwrap(client.TimeBlock.createTimeBlock({ createTimeBlockRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 할 일·습관을 타임라인에 배치하는 요청
 * @param PlanItemRequest
 */
export function usePlanItemMutation() {
  const invalidate = useTimeBlockInvalidation();
  return useMutation({
    mutationFn: (body: PlanItemRequest) => unwrap(client.TimeBlock.planItem({ planItemRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 타임블록 수정 요청 (이동·길이 변경)
 * @param blockId, UpdateTimeBlockRequest
 */
export function useUpdateTimeBlockMutation() {
  const invalidate = useTimeBlockInvalidation();
  return useMutation({
    mutationFn: ({ blockId, body }: { blockId: number; body: UpdateTimeBlockRequest }) =>
      unwrap(client.TimeBlock.updateTimeBlock({ blockId, updateTimeBlockRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 타임블록 삭제 요청
 * @param blockId
 */
export function useDeleteTimeBlockMutation() {
  const invalidate = useTimeBlockInvalidation();
  return useMutation({
    mutationFn: (blockId: number) => unwrap(client.TimeBlock.deleteTimeBlock({ blockId })),
    onSuccess: invalidate,
  });
}

/**
 * 실제 실행 시간 기록 요청
 * @param blockId, RecordActualRequest
 */
export function useRecordActualMutation() {
  const invalidate = useTimeBlockInvalidation();
  return useMutation({
    mutationFn: ({ blockId, body }: { blockId: number; body: RecordActualRequest }) =>
      unwrap(client.TimeBlock.recordActual({ blockId, recordActualRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 실제 실행 시간 삭제 요청 (미실행 상태로 되돌림)
 * @param blockId
 */
export function useClearActualMutation() {
  const invalidate = useTimeBlockInvalidation();
  return useMutation({
    mutationFn: (blockId: number) => unwrap(client.TimeBlock.clearActual({ blockId })),
    onSuccess: invalidate,
  });
}
