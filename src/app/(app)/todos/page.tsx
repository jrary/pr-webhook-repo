"use client"

import { useMemo, useState } from "react"
import { useTodosQuery } from "@/api/queries/todo"
import type { CategoryKey } from "@/lib/types"
import { useCategories } from "@/hooks/use-categories"
import { dateKey } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { DateNav } from "@/components/date-nav"
import { AddTodo } from "@/components/features/add-todo"
import { CategoryManager } from "@/components/features/category-manager"
import { TodoItem } from "@/components/features/todo-item"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TodosPage() {
  const [date, setDate] = useState(() => new Date())
  const [filter, setFilter] = useState<CategoryKey | "all">("all")
  const categories = useCategories()

  const key = dateKey(date)
  const range = useMemo(() => ({ from: key, to: key }), [key])
  const { data, isPending } = useTodosQuery(range)
  const dayTodos = data ?? []
  const filtered = filter === "all" ? dayTodos : dayTodos.filter((t) => t.category === filter)
  const doneCount = dayTodos.filter((t) => t.done).length

  return (
    <div>
      <PageHeader title="할 일" en="Tasks & To-Do" description="오늘 해야 할 일을 관리하세요">
        <DateNav date={date} onChange={setDate} />
      </PageHeader>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <AddTodo date={key} />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as CategoryKey | "all")}>
              <TabsList className="flex flex-wrap justify-start">
                <TabsTrigger value="all">전체</TabsTrigger>
                {categories.map((c) => (
                  <TabsTrigger key={c.id} value={c.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <CategoryManager />
          </div>

          {isPending ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              할 일이 없습니다. 위에서 추가해보세요.
            </p>
          ) : (
            <div className="divide-y">
              {filtered.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}

          {!isPending && dayTodos.length > 0 ? (
            <p className="text-right text-xs text-muted-foreground">
              {dayTodos.length}개 중 {doneCount}개 완료
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
