"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import { findCategory } from "@/lib/categories"
import { useCategories } from "@/hooks/use-categories"
import { DRAG_MIME } from "@/lib/dnd"
import { effectiveInterval } from "@/lib/progress"
import type { ActualInterval, TimeBlock } from "@/lib/types"
import { minutesToLabel, isSameDay } from "@/lib/date"
import { cn } from "@/lib/utils"

const SLOT_MIN = 10
/** default px per 10 minutes */
export const DEFAULT_SLOT_H = 14
const SLOTS = (24 * 60) / SLOT_MIN // 144

const DAY_MIN = 24 * 60

/** Viewport point an editor popover is anchored to. */
export interface Anchor {
  x: number
  y: number
}

/** An in-progress move/resize on the grid, google-calendar style. */
interface Grab {
  kind: "move" | "resize-start" | "resize-end"
  blockId: string
  /** which interval the drag is editing */
  target: "plan" | "actual"
  originSlot: number
  origStart: number
  origEnd: number
  start: number
  end: number
  moved: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function applyGrab(grab: Grab, deltaMin: number): Grab {
  if (grab.kind === "move") {
    const length = grab.origEnd - grab.origStart
    const start = clamp(grab.origStart + deltaMin, 0, DAY_MIN - length)
    return { ...grab, start, end: start + length }
  }
  if (grab.kind === "resize-start") {
    const start = clamp(grab.origStart + deltaMin, 0, grab.origEnd - SLOT_MIN)
    return { ...grab, start, end: grab.origEnd }
  }
  const end = clamp(grab.origEnd + deltaMin, grab.origStart + SLOT_MIN, DAY_MIN)
  return { ...grab, start: grab.origStart, end }
}

/** How the day's execution gets recorded from the grid. */
export interface RecordApi {
  /** record the block as having run exactly as planned */
  markPlanned: (block: TimeBlock) => void
  setActual: (blockId: string, actual: ActualInterval | null) => void
}

/** How far reality drifted from the plan, as a short chip label. */
function driftLabel(block: TimeBlock, shown: { start: number; end: number }) {
  const shift = shown.start - block.start
  if (Math.abs(shift) >= SLOT_MIN) {
    return shift > 0 ? `${shift}분 지연` : `${-shift}분 일찍`
  }
  const durationDelta = shown.end - shown.start - (block.end - block.start)
  if (Math.abs(durationDelta) >= SLOT_MIN) {
    return durationDelta > 0 ? `+${durationDelta}분` : `${durationDelta}분`
  }
  return "계획대로"
}

export interface BlockView {
  done: boolean
  missed: boolean
  /** where the block came from: 📌 todo, 🔁 habit, undefined = free block */
  sourceIcon?: string
}

export function TimeBlockGrid({
  date,
  blocks,
  onCreate,
  onEdit,
  viewOf,
  record,
  focusBlockId,
  onDropItem,
  dropDurationMin,
  onMoveBlock,
  onInteractionStart,
  slotHeight = DEFAULT_SLOT_H,
}: {
  date: Date
  blocks: TimeBlock[]
  /** `anchor` is the viewport point the editor popover should open next to */
  onCreate: (startMin: number, endMin: number, anchor: Anchor) => void
  onEdit: (block: TimeBlock, anchor: Anchor) => void
  /** execution state per block; omit to render blocks as plain plan */
  viewOf?: (block: TimeBlock) => BlockView
  /** omit to render a read-only plan with no recording controls */
  record?: RecordApi
  focusBlockId?: string | null
  /** called when a todo/habit is dropped onto the track */
  onDropItem?: (payload: string, startMin: number) => void
  /** length of the item currently being dragged, for the drop preview */
  dropDurationMin?: number
  /** commit a block moved or resized on the grid */
  onMoveBlock?: (blockId: string, startMin: number, endMin: number) => void
  /** fired when a drag begins, so an open editor popover can be dismissed */
  onInteractionStart?: () => void
  /** px per 10 minutes; lower value fits more hours on screen */
  slotHeight?: number
}) {
  const SLOT_H = slotHeight
  const HOUR_H = SLOT_H * 6
  const slotFromY = (y: number) => Math.max(0, Math.min(SLOTS - 1, Math.floor(y / SLOT_H)))
  const categories = useCategories()
  const trackRef = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState<{ a: number; b: number } | null>(null)
  const dragging = useRef(false)
  const [nowMin, setNowMin] = useState<number | null>(null)
  const [dropSlot, setDropSlot] = useState<number | null>(null)
  const [grab, setGrab] = useState<Grab | null>(null)

  useEffect(() => {
    const update = () => {
      const d = new Date()
      setNowMin(d.getHours() * 60 + d.getMinutes())
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  function pointerSlot(clientY: number) {
    const rect = trackRef.current!.getBoundingClientRect()
    return slotFromY(clientY - rect.top)
  }

  function handleDown(e: React.PointerEvent) {
    if (e.button !== 0) return
    onInteractionStart?.()
    dragging.current = true
    const s = pointerSlot(e.clientY)
    setSel({ a: s, b: s })
    trackRef.current?.setPointerCapture(e.pointerId)
  }

  /**
   * Grab an existing block to move it, or one of its edges to resize.
   * There is only ever one bar: before anything is recorded the drag edits the
   * plan, and once a real time exists the same drag edits that. Editing a plan
   * after the fact goes through the popup, so a record can't be lost by accident.
   */
  function handleBlockDown(e: React.PointerEvent, block: TimeBlock, kind: Grab["kind"]) {
    if (e.button !== 0) return
    e.stopPropagation()
    onInteractionStart?.()
    trackRef.current?.setPointerCapture(e.pointerId)
    const target: Grab["target"] = block.actual && !block.spontaneous ? "actual" : "plan"
    const from = target === "actual" ? block.actual! : block
    setGrab({
      kind,
      blockId: block.id,
      target,
      originSlot: pointerSlot(e.clientY),
      origStart: from.start,
      origEnd: from.end,
      start: from.start,
      end: from.end,
      moved: false,
    })
  }

  function handleMove(e: React.PointerEvent) {
    if (grab) {
      const delta = (pointerSlot(e.clientY) - grab.originSlot) * SLOT_MIN
      if (delta === 0 && !grab.moved) return
      setGrab((prev) => {
        if (!prev) return prev
        const next = applyGrab(prev, delta)
        // pointermove fires far more often than the 10-minute grid changes
        if (prev.moved && next.start === prev.start && next.end === prev.end) return prev
        return { ...next, moved: true }
      })
      return
    }
    if (!dragging.current) return
    const s = pointerSlot(e.clientY)
    setSel((prev) => (prev ? { ...prev, b: s } : { a: s, b: s }))
  }

  function handleUp(e: React.PointerEvent) {
    const anchor = { x: e.clientX, y: e.clientY }
    if (grab) {
      const block = blocks.find((b) => b.id === grab.blockId)
      setGrab(null)
      if (!block) return
      // a grab that never moved is just a click: open the editor
      if (!grab.moved || !onMoveBlock) {
        onEdit(block, anchor)
      } else if (grab.target === "actual") {
        record?.setActual(block.id, { start: grab.start, end: grab.end })
      } else if (grab.start !== block.start || grab.end !== block.end) {
        onMoveBlock(block.id, grab.start, grab.end)
        // a spontaneous block is its own record: keep the two in step
        if (block.spontaneous) record?.setActual(block.id, { start: grab.start, end: grab.end })
      }
      return
    }
    if (!dragging.current || !sel) return
    dragging.current = false
    const start = Math.min(sel.a, sel.b)
    const end = Math.max(sel.a, sel.b) + 1
    setSel(null)
    onCreate(start * SLOT_MIN, end * SLOT_MIN, anchor)
  }

  function handleDragOver(e: React.DragEvent) {
    if (!onDropItem) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setDropSlot(pointerSlot(e.clientY))
  }

  function handleDrop(e: React.DragEvent) {
    if (!onDropItem) return
    e.preventDefault()
    const payload = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain")
    const slot = pointerSlot(e.clientY)
    setDropSlot(null)
    if (payload) onDropItem(payload, slot * SLOT_MIN)
  }

  const showNow = nowMin !== null && isSameDay(date, new Date())
  const dropHeight = ((dropDurationMin ?? 30) / SLOT_MIN) * SLOT_H

  return (
    <div className="flex select-none">
      {/* hour gutter */}
      <div className="w-14 shrink-0">
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            style={{ height: HOUR_H }}
            className="relative -top-2 pr-2 text-right text-xs text-muted-foreground"
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* track */}
      <div
        ref={trackRef}
        className="relative flex-1 cursor-pointer touch-none rounded-md border bg-card"
        style={{ height: SLOTS * SLOT_H }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropSlot(null)}
        onDrop={handleDrop}
      >
        {/* hour lines */}
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="absolute inset-x-0 border-t border-border/60"
            style={{ top: h * HOUR_H }}
          />
        ))}

        {/* selection preview */}
        {sel ? (
          <div
            className="pointer-events-none absolute inset-x-1 rounded-md bg-primary/20 ring-1 ring-primary/40"
            style={{
              top: Math.min(sel.a, sel.b) * SLOT_H,
              height: (Math.abs(sel.a - sel.b) + 1) * SLOT_H,
            }}
          />
        ) : null}

        {/* drop preview while dragging an item from the list */}
        {dropSlot !== null ? (
          <div
            className="pointer-events-none absolute inset-x-1 z-[8] flex items-center rounded-md border-2 border-dashed border-primary bg-primary/15 px-2 text-xs font-medium text-primary"
            style={{ top: dropSlot * SLOT_H, height: dropHeight }}
          >
            {minutesToLabel(dropSlot * SLOT_MIN)}
          </div>
        ) : null}

        {/* blocks */}
        {blocks.map((block) => {
          const meta = findCategory(categories, block.category)
          const active = grab?.blockId === block.id ? grab : null
          const shown = effectiveInterval(block)
          const start = active ? active.start : shown.start
          const end = active ? active.end : shown.end
          const top = (start / SLOT_MIN) * SLOT_H
          const height = ((end - start) / SLOT_MIN) * SLOT_H
          const view = viewOf?.(block)
          const focused = focusBlockId === block.id
          const movable = Boolean(onMoveBlock)
          const drift = shown.isActual && !block.spontaneous ? driftLabel(block, shown) : null
          return (
            <Fragment key={block.id}>
              <div
                data-block-id={block.id}
                role="button"
                tabIndex={0}
                onPointerDown={(e) =>
                  movable ? handleBlockDown(e, block, "move") : e.stopPropagation()
                }
                onClick={(e) =>
                  movable ? undefined : onEdit(block, { x: e.clientX, y: e.clientY })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    const rect = e.currentTarget.getBoundingClientRect()
                    onEdit(block, { x: rect.right, y: rect.top })
                  }
                }}
                className={cn(
                  "absolute inset-x-1 overflow-hidden rounded-md px-2 py-1 text-left text-xs font-medium text-white shadow-sm hover:brightness-105",
                  movable ? "cursor-grab" : "cursor-pointer",
                  active?.moved && "z-[9] cursor-grabbing shadow-lg ring-2 ring-white/70",
                  !active && "transition-all",
                  view?.done && "opacity-70",
                  view?.missed && "ring-2 ring-destructive ring-offset-1 ring-offset-background",
                  focused && "z-[6] scale-[1.01] ring-2 ring-foreground ring-offset-2 ring-offset-background",
                )}
                style={{ top, height, backgroundColor: meta.color, minHeight: SLOT_H }}
              >
                <span className="flex items-center gap-1">
                  {view?.sourceIcon ? (
                    <span className="shrink-0 text-[10px] leading-none">{view.sourceIcon}</span>
                  ) : null}
                  {block.spontaneous ? (
                    <span className="shrink-0 text-[10px] leading-none">⚡</span>
                  ) : null}
                  <span className="truncate">
                    {shown.isActual && !block.spontaneous ? "실제 " : ""}
                    {minutesToLabel(start)} – {minutesToLabel(end)}
                  </span>
                </span>
                {height >= SLOT_H * 2 ? (
                  <span className="block truncate opacity-80">
                    {view?.missed && !active ? "미이행" : null}
                    {/* the plan only survives as text, so there is never a second bar */}
                    {drift && !active ? `계획 ${minutesToLabel(block.start)} · ${drift}` : null}
                  </span>
                ) : null}

                {movable ? (
                  <>
                    <span
                      onPointerDown={(e) => handleBlockDown(e, block, "resize-start")}
                      className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize"
                    />
                    <span
                      onPointerDown={(e) => handleBlockDown(e, block, "resize-end")}
                      className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
                    />
                  </>
                ) : null}
              </div>

              {record ? (
                <button
                  type="button"
                  aria-label={block.actual ? "완료 취소" : "완료"}
                  title={
                    block.actual
                      ? "완료 취소 — 계획 막대로 되돌립니다"
                      : "완료 — 이제 막대를 끌어 실제 시간을 맞추세요"
                  }
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() =>
                    block.actual
                      ? record.setActual(block.id, null)
                      : record.markPlanned(block)
                  }
                  className={cn(
                    "absolute right-1.5 z-[7] flex h-5 w-5 items-center justify-center rounded-full border border-white/70 bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40",
                    block.actual && "bg-white/90 text-foreground",
                  )}
                  style={{ top: top + 3 }}
                >
                  <Check className="h-3 w-3" />
                </button>
              ) : null}
            </Fragment>
          )
        })}

        {/* current time line */}
        {showNow ? (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
            style={{ top: (nowMin! / SLOT_MIN) * SLOT_H }}
          >
            <div className="h-2 w-2 -translate-x-1 rounded-full bg-red-500" />
            <div className="h-px flex-1 bg-red-500" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
