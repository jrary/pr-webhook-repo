import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Todo } from "@/lib/types";
import { client, unwrap } from "../client";
import type {
  CreateTodoRequest,
  TodoResponse,
  UpdateTodoRequest,
} from "../generated";
import { statsQueryKey, todoQueryKey, type DateRange } from "../query-keys";

/** 서버 할 일을 화면이 쓰는 `Todo`로. id·카테고리 id는 문자열로 통일한다. */
export function toTodo(res: TodoResponse): Todo {
  return {
    id: String(res.id),
    title: res.title ?? "",
    category: res.categoryId != null ? String(res.categoryId) : "",
    done: res.done ?? false,
    date: res.date ?? "",
    order: res.orderIndex ?? 0,
    estimateMin: res.estimateMin,
  };
}

/** 할 일 목록 조회 (기간) */
export function useTodosQuery(range: DateRange) {
  return useQuery({
    queryKey: todoQueryKey.list(range),
    queryFn: () => unwrap(client.Todo.getTodos(range)),
    select: (data) => data.map(toTodo).sort((a, b) => a.order - b.order),
  });
}

function useTodoInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: todoQueryKey.all() });
    // 완료율이 함께 바뀌므로 통계도 무효화한다.
    queryClient.invalidateQueries({ queryKey: statsQueryKey.all() });
  };
}

/**
 * 할 일 생성 요청
 * @param CreateTodoRequest
 */
export function useCreateTodoMutation() {
  const invalidate = useTodoInvalidation();
  return useMutation({
    mutationFn: (body: CreateTodoRequest) => unwrap(client.Todo.createTodo({ createTodoRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 할 일 수정 요청 (완료 토글 포함)
 * @param todoId, UpdateTodoRequest
 */
export function useUpdateTodoMutation() {
  const invalidate = useTodoInvalidation();
  return useMutation({
    mutationFn: ({ todoId, body }: { todoId: number; body: UpdateTodoRequest }) =>
      unwrap(client.Todo.updateTodo({ todoId, updateTodoRequest: body })),
    onSuccess: invalidate,
  });
}

/**
 * 할 일 삭제 요청
 * @param todoId
 */
export function useDeleteTodoMutation() {
  const invalidate = useTodoInvalidation();
  return useMutation({
    mutationFn: (todoId: number) => unwrap(client.Todo.deleteTodo({ todoId })),
    onSuccess: invalidate,
  });
}

