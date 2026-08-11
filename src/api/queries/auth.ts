import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ApiError, clearTokens, client, getRefreshToken, setTokens, unwrap } from "../client"
import type { LoginRequest, SignupRequest } from "../generated"

/**
 * 로그인 요청. 성공 시 토큰을 저장하므로 화면은 토큰을 다룰 필요가 없다.
 * @param LoginRequest
 */
export function useLoginMutation() {
  return useMutation({
    mutationFn: (body: LoginRequest) => unwrap(client.Auth.login({ loginRequest: body })),
    onSuccess: (tokens) => setTokens(tokens),
  })
}

/**
 * 회원가입 요청. 가입 직후 로그인 상태가 된다.
 * @param SignupRequest
 */
export function useSignupMutation() {
  return useMutation({
    mutationFn: (body: SignupRequest) => unwrap(client.Auth.signup({ signupRequest: body })),
    onSuccess: (tokens) => setTokens(tokens),
  })
}

/** 저장된 refresh token으로 access token 재발급. */
export function useRefreshMutation() {
  return useMutation({
    mutationFn: () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) throw new ApiError("로그인이 필요합니다.", 401)
      return unwrap(client.Auth.refresh({ refreshRequest: { refreshToken } }))
    },
    onSuccess: (tokens) => setTokens(tokens),
  })
}

/** 로그아웃. 토큰과 캐시된 서버 데이터를 모두 버린다. */
export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    clearTokens()
    queryClient.clear()
  }
}
