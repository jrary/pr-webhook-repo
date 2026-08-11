"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useMoodQuery, useUpsertMoodMutation } from "@/api/queries/mood"
import type { MoodScore } from "@/lib/types"
import { MoodSelector } from "@/components/mood-selector"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function MoodForm({ dateKey: key }: { dateKey: string }) {
  const { data: existing } = useMoodQuery(key)
  const upsertMood = useUpsertMoodMutation()

  const [score, setScore] = useState<MoodScore | undefined>(undefined)
  const [note, setNote] = useState("")

  useEffect(() => {
    setScore(existing?.score)
    setNote(existing?.note ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, existing?.score, existing?.note])

  function save() {
    if (!score) {
      toast.error("기분을 선택해주세요")
      return
    }
    upsertMood.mutate(
      { date: key, body: { score, note: note.trim() || undefined } },
      {
        onSuccess: () => toast.success("오늘의 기분을 저장했어요"),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <div className="space-y-5">
      <MoodSelector value={score} onChange={setScore} size="lg" />
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="메모: 오늘 하루는 어땠나요?"
      />
      <div className="flex justify-end">
        <Button onClick={save} disabled={upsertMood.isPending}>
          저장
        </Button>
      </div>
    </div>
  )
}
