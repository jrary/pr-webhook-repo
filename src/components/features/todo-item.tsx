"use client"

import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useDeleteTodoMutation, useUpdateTodoMutation } from "@/api/queries/todo"
import type { Todo } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { CategoryTag } from "@/components/category-tag"
import { Button } from "@/components/ui/button"

export function TodoItem({ todo, showDelete = true }: { todo: Todo; showDelete?: boolean }) {
  const updateTodo = useUpdateTodoMutation()
  const deleteTodo = useDeleteTodoMutation()

  function toggle() {
    updateTodo.mutate(
      { todoId: Number(todo.id), body: { done: !todo.done } },
      { onError: (error) => toast.error(error.message) },
    )
  }

  function remove() {
    deleteTodo.mutate(Number(todo.id), {
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50">
      <Checkbox
        checked={todo.done}
        disabled={updateTodo.isPending}
        onCheckedChange={toggle}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          todo.done && "text-muted-foreground line-through",
        )}
      >
        {todo.title}
      </span>
      <CategoryTag category={todo.category} />
      {showDelete ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          disabled={deleteTodo.isPending}
          onClick={remove}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">삭제</span>
        </Button>
      ) : null}
    </div>
  )
}
