/** YYYY-MM-DD range, inclusive on both ends. */
export interface DateRange {
  from: string;
  to: string;
}

export const userQueryKey = {
  all: () => ["user"] as const,
  me: () => [...userQueryKey.all(), "me"] as const,
};

export const categoryQueryKey = {
  all: () => ["category"] as const,
  list: () => [...categoryQueryKey.all(), "list"] as const,
};

export const todoQueryKey = {
  all: () => ["todo"] as const,
  list: (range: DateRange) => [...todoQueryKey.all(), "list", range] as const,
};

export const habitQueryKey = {
  all: () => ["habit"] as const,
  list: (date?: string) => [...habitQueryKey.all(), "list", date ?? null] as const,
};

export const timeBlockQueryKey = {
  all: () => ["time-block"] as const,
  list: (range: DateRange) => [...timeBlockQueryKey.all(), "list", range] as const,
};

export const moodQueryKey = {
  all: () => ["mood"] as const,
  detail: (date: string) => [...moodQueryKey.all(), date] as const,
};

export const gratitudeQueryKey = {
  all: () => ["gratitude"] as const,
  detail: (date: string) => [...gratitudeQueryKey.all(), date] as const,
};

export const statsQueryKey = {
  all: () => ["stats"] as const,
  range: (range: DateRange) => [...statsQueryKey.all(), "range", range] as const,
  day: (date: string) => [...statsQueryKey.all(), "day", date] as const,
};
