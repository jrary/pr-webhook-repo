"use client"

import { useCategoriesQuery } from "@/api/queries/category"
import { findCategory } from "@/lib/categories"
import type { Category, CategoryKey } from "@/lib/types"

const EMPTY: Category[] = []

/** 서버 카테고리 목록. 로딩 중에는 빈 배열. */
export function useCategories(): Category[] {
  const { data } = useCategoriesQuery()
  return data ?? EMPTY
}

/** 카테고리 하나. 삭제된 id면 중립적인 "미분류"로 대체된다. */
export function useCategory(id: CategoryKey): Category {
  const categories = useCategories()
  return findCategory(categories, id)
}
