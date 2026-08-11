import {
  AuthApi,
  CategoryApi,
  Configuration,
  GratitudeApi,
  HabitApi,
  MoodApi,
  ResponseError,
  StatsApi,
  TimeBlockApi,
  TodoApi,
  UserApi,
} from "./generated";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const ACCESS_TOKEN_KEY = "dlog.accessToken";
const REFRESH_TOKEN_KEY = "dlog.refreshToken";

/** Mirrors localStorage so requests during SSR/first render do not touch `window`. */
let accessToken: string | null = null;
let hydrated = false;

function read(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function getAccessToken() {
  if (!hydrated && typeof window !== "undefined") {
    accessToken = read(ACCESS_TOKEN_KEY);
    hydrated = true;
  }
  return accessToken;
}

export function getRefreshToken() {
  return read(REFRESH_TOKEN_KEY);
}

/** Persist the tokens a login/signup/refresh returned. */
export function setTokens(tokens: { accessToken?: string; refreshToken?: string }) {
  accessToken = tokens.accessToken ?? accessToken;
  hydrated = true;
  if (typeof window === "undefined") return;
  if (tokens.accessToken) window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens() {
  accessToken = null;
  hydrated = true;
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const configuration = new Configuration({
  basePath: API_BASE_URL,
  accessToken: () => getAccessToken() ?? "",
  middleware: [
    {
      /** Generated code always attaches the bearer header, so drop it while unauthenticated. */
      async pre({ init, ...rest }) {
        const headers = init.headers as Record<string, string> | undefined;
        if (headers && !getAccessToken()) delete headers.Authorization;
        return { ...rest, init };
      },
    },
  ],
});

export const client = {
  Auth: new AuthApi(configuration),
  User: new UserApi(configuration),
  Category: new CategoryApi(configuration),
  Todo: new TodoApi(configuration),
  Habit: new HabitApi(configuration),
  TimeBlock: new TimeBlockApi(configuration),
  Mood: new MoodApi(configuration),
  Gratitude: new GratitudeApi(configuration),
  Stats: new StatsApi(configuration),
};

/** Envelope every endpoint returns (`BaseResponse<T>` on the server). */
interface BaseResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Unwrap `BaseResponse<T>` into `T`, turning failures into `ApiError` carrying the
 * server-side Korean message instead of a bare `ResponseError`.
 *
 * ```ts
 * const todos = await unwrap(client.Todo.getTodos({ from: date, to: date }))
 * ```
 */
export async function unwrap<T>(request: Promise<BaseResponse<T>>): Promise<T> {
  let response: BaseResponse<T>;
  try {
    response = await request;
  } catch (error) {
    throw await toApiError(error);
  }
  if (response.success === false) {
    throw new ApiError(response.message ?? "요청을 처리하지 못했습니다.");
  }
  return response.data as T;
}

async function toApiError(error: unknown): Promise<ApiError> {
  if (error instanceof ResponseError) {
    const body = await error.response
      .clone()
      .json()
      .catch(() => null);
    const message =
      (body as BaseResponse<unknown> | null)?.message ??
      `요청이 실패했습니다. (${error.response.status})`;
    return new ApiError(message, error.response.status);
  }
  if (error instanceof Error) return new ApiError(error.message);
  return new ApiError("알 수 없는 오류가 발생했습니다.");
}
