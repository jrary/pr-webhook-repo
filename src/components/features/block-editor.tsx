"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useHabitsQuery } from "@/api/queries/habit";
import {
  useClearActualMutation,
  useCreateTimeBlockMutation,
  useDeleteTimeBlockMutation,
  useRecordActualMutation,
  useUpdateTimeBlockMutation,
} from "@/api/queries/time-block";
import { useTodosQuery } from "@/api/queries/todo";
import type { ActualInterval, CategoryKey, PlanSource } from "@/lib/types";
import { useCategories } from "@/hooks/use-categories";
import { minutesToLabel } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

export interface BlockDraft {
  id?: string;
  date: string;
  start: number;
  end: number;
  category?: CategoryKey;
  source?: PlanSource;
  actual?: ActualInterval;
  spontaneous?: boolean;
  /** viewport point the popover opens next to */
  anchor?: { x: number; y: number };
}

const STEP = 10;
const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / STEP + 1 },
  (_, i) => i * STEP,
);

const FREE = "free";

function sourceValue(source?: PlanSource) {
  return source ? `${source.type}:${source.refId}` : FREE;
}

function parseSourceValue(value: string): PlanSource | undefined {
  if (value === FREE) return undefined;
  const [type, refId] = value.split(":");
  return { type: type as PlanSource["type"], refId };
}

function TimeRange({
  start,
  end,
  onChange,
}: {
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Select
        value={String(start)}
        onValueChange={(v) =>
          onChange(Number(v), Math.max(end, Number(v) + STEP))
        }
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {TIME_OPTIONS.slice(0, -1).map((m) => (
            <SelectItem key={m} value={String(m)}>
              {minutesToLabel(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(end)}
        onValueChange={(v) => onChange(start, Number(v))}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {TIME_OPTIONS.filter((m) => m > start).map((m) => (
            <SelectItem key={m} value={String(m)}>
              {minutesToLabel(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function BlockEditor({
  draft,
  onClose,
}: {
  draft: BlockDraft | null;
  onClose: () => void;
}) {
  const createBlock = useCreateTimeBlockMutation();
  const updateBlock = useUpdateTimeBlockMutation();
  const deleteBlock = useDeleteTimeBlockMutation();
  const recordActual = useRecordActualMutation();
  const clearActual = useClearActualMutation();

  const date = draft?.date ?? "";
  const { data: dayTodos = [] } = useTodosQuery({ from: date, to: date });
  const { data: habits = [] } = useHabitsQuery(date || undefined);
  const categories = useCategories();

  const [category, setCategory] = useState<CategoryKey>("");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(STEP);
  const [source, setSource] = useState<string>(FREE);
  const [actual, setActual] = useState<{ start: number; end: number } | null>(
    null,
  );
  const [unplanned, setUnplanned] = useState(false);

  useEffect(() => {
    if (!draft) return;
    setCategory(draft.category ?? categories[0]?.id ?? "");
    setStart(draft.start);
    setEnd(draft.end);
    setSource(sourceValue(draft.source));
    setUnplanned(draft.spontaneous ?? false);
    setActual(draft.actual ? { ...draft.actual } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const isEdit = Boolean(draft?.id);

  function handleSourceChange(value: string) {
    setSource(value);
    const parsed = parseSourceValue(value);
    if (!parsed) return;
    // adopt the source's category so colours never drift from the item
    if (parsed.type === "todo") {
      const todo = dayTodos.find((t) => t.id === parsed.refId);
      if (todo) setCategory(todo.category);
      return;
    }
    const habit = habits.find((h) => h.id === parsed.refId);
    if (habit) setCategory(habit.category);
  }

  /** Turning "planned" off makes the block its own record: plan span = actual span. */
  function handleUnplannedChange(next: boolean) {
    setUnplanned(next);
    if (next) setActual({ start, end });
  }

  /** Blocks show no name of their own, but the server wants one. */
  function titleFor(link: PlanSource | undefined) {
    if (link?.type === "todo") {
      return dayTodos.find((t) => t.id === link.refId)?.title ?? "할 일";
    }
    if (link?.type === "habit") {
      return habits.find((h) => h.id === link.refId)?.name ?? "습관";
    }
    return categories.find((c) => c.id === category)?.label ?? "일정";
  }

  async function save() {
    if (!draft) return;
    const s = Math.min(start, end - STEP);
    const e = Math.max(end, s + STEP);
    const link = parseSourceValue(source);
    const finalActual = unplanned ? { start: s, end: e } : actual;
    const categoryId = category ? Number(category) : undefined;

    try {
      let blockId: number;
      if (draft.id) {
        // the update endpoint only carries title/category/plan — link and
        // "계획 없이 한 일" are fixed when the block is created
        await updateBlock.mutateAsync({
          blockId: Number(draft.id),
          body: { title: titleFor(draft.source), categoryId, planStart: s, planEnd: e },
        });
        blockId = Number(draft.id);
      } else {
        const created = await createBlock.mutateAsync({
          date: draft.date,
          title: titleFor(link),
          categoryId,
          planStart: s,
          planEnd: e,
          sourceType: link ? (link.type.toUpperCase() as "TODO" | "HABIT") : undefined,
          sourceId: link ? Number(link.refId) : undefined,
          spontaneous: unplanned || undefined,
        });
        blockId = Number(created.id);
      }

      if (finalActual) {
        await recordActual.mutateAsync({
          blockId,
          body: { actualStart: finalActual.start, actualEnd: finalActual.end },
        });
      } else if (draft.actual) {
        await clearActual.mutateAsync(blockId);
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  }

  function handleDelete() {
    if (!draft?.id) {
      onClose();
      return;
    }
    deleteBlock.mutate(Number(draft.id), {
      onSuccess: onClose,
      onError: (error) => toast.error(error.message),
    });
  }

  // nothing is rendered while closed, so no stray anchor sits at the corner
  if (!draft) return null

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor asChild>
        <div
          className="pointer-events-none fixed h-1 w-1"
          style={{ left: draft.anchor?.x ?? 0, top: draft.anchor?.y ?? 0 }}
        />
      </PopoverAnchor>
      <PopoverContent
        side="right"
        align="start"
        collisionPadding={12}
        className="w-72 p-3"
        // keeping focus put stops the timeline from being scrolled into view
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">연결</Label>
            <Select value={source} onValueChange={handleSourceChange} disabled={isEdit}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value={FREE}>연결 없음</SelectItem>
                {dayTodos.map((t) => (
                  <SelectItem key={t.id} value={`todo:${t.id}`}>
                    📌 {t.title}
                  </SelectItem>
                ))}
                {habits.map((h) => (
                  <SelectItem key={h.id} value={`habit:${h.id}`}>
                    🔁 {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* plan: the toggle lives here because it decides whether a plan exists at all */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">계획 시간</Label>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                계획 없이 한 일
                <Switch
                  checked={unplanned}
                  onCheckedChange={handleUnplannedChange}
                />
              </label>
            </div>
            {!unplanned && (
              <TimeRange
                start={start}
                end={end}
                onChange={(s, e) => {
                  setStart(s);
                  setEnd(e);
                }}
              />
            )}
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">실제 시간</Label>
              {!unplanned ? (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setActual({ start, end })}
                  >
                    계획과 동일
                  </Button>
                  {actual ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive"
                      onClick={() => setActual(null)}
                    >
                      지우기
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {unplanned ? (
              <TimeRange
                start={start}
                end={end}
                onChange={(s, e) => {
                  setStart(s);
                  setEnd(e);
                  setActual({ start: s, end: e });
                }}
              />
            ) : actual ? (
              <TimeRange
                start={actual.start}
                end={actual.end}
                onChange={(s, e) => setActual({ start: s, end: e })}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                아직 기록 없음. 블록의 체크 버튼을 누르면 기록이 시작됩니다.
              </p>
            )}
          </div>

          <div className="flex gap-2 border-t pt-3">
            {isEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                삭제
              </Button>
            ) : null}
            <Button size="sm" onClick={save} className="flex-1">
              저장
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
