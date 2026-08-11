import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { client, unwrap } from "../client"
import type { UpdateUserRequest } from "../generated"
import { userQueryKey } from "../query-keys"

/** 내 정보 조회 */
export function useMeQuery() {
  return useQuery({
    queryKey: userQueryKey.me(),
    queryFn: () => unwrap(client.User.getMe()),
  })
}

/**
 * 내 정보 수정 요청
 * @param UpdateUserRequest
 */
export function useUpdateMeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateUserRequest) =>
      unwrap(client.User.updateMe({ updateUserRequest: body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueryKey.all() }),
  })
}
