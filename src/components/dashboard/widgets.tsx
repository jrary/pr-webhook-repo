"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { MoodScore } from "@/lib/types"
import { usePlannerStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoodSelector } from "@/components/mood-selector"

function En({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 font-serif text-base font-normal italic text-muted-foreground">
      {children}
    </span>
  )
}

function CardLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      더보기 <ArrowRight className="h-3 w-3" />
    </Link>
  )
}

export function MoodWidget({ dateKey: key }: { dateKey: string }) {
  const moods = usePlannerStore((s) => s.moods)
  const setMood = usePlannerStore((s) => s.setMood)
  const entry = moods.find((m) => m.date === key)
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>
          오늘의 무드<En>Mood</En>
        </CardTitle>
        <CardLink href="/mood" />
      </CardHeader>
      <CardContent>
        <MoodSelector
          value={entry?.score}
          onChange={(score: MoodScore) => setMood(key, score, entry?.note)}
        />
      </CardContent>
    </Card>
  )
}

export function GratitudeWidget({ dateKey: key }: { dateKey: string }) {
  const gratitude = usePlannerStore((s) => s.gratitude)
  const entry = gratitude.find((g) => g.date === key)
  const items = entry?.items.filter((i) => i.trim()) ?? []

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>
          감사 일기<En>Gratitude</En>
        </CardTitle>
        <CardLink href="/gratitude" />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">아직 작성하지 않았어요.</p>
        ) : (
          <ol className="space-y-1.5 text-sm">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span className="truncate">{item}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
