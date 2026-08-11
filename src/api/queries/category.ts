import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Category } from "@/lib/types"
import { client, unwrap } from "../client"
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from "../generated"
import { categoryQueryKey } from "../query-keys"

/** 서버 카테고리를 화면이 쓰는 `Category`로. id는 문자열로 통일한다. */
function toCategory(res: CategoryResponse): Category {
  return {
    id: String(res.id),
    label: res.label ?? "",
    color: res.color ?? "#8a8f98",
  }
}

/** 카테고리 목록 조회 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryQueryKey.list(),
    queryFn: () => unwrap(client.Category.getCategories()),
    select: (data) => data.map(toCategory),
  })
}

/**
 * 카테고리 생성 요청
 * @param CreateCategoryRequest
 */
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCategoryRequest) =>
      unwrap(client.Category.createCategory({ createCategoryRequest: body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryQueryKey.all() }),
  })
}

/**
 * 카테고리 수정 요청
 * @param categoryId, UpdateCategoryRequest
 */
export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, body }: { categoryId: number; body: UpdateCategoryRequest }) =>
      unwrap(client.Category.updateCategory({ categoryId, updateCategoryRequest: body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryQueryKey.all() }),
  })
}

/**
 * 카테고리 삭제 요청. 마지막 카테고리는 서버가 409로 거절한다.
 * @param categoryId
 */
export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (categoryId: number) => unwrap(client.Category.deleteCategory({ categoryId })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryQueryKey.all() }),
  })
}
