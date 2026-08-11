"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { addDays } from "@/lib/date"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function DateNav({
  date,
  onChange,
  className,
}: {
  date: Date
  onChange: (date: Date) => void
  className?: string
}) {
  return (
    <div className={className}>
      <div className="inline-flex items-center gap-1 rounded-lg border bg-card p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(addDays(date, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">이전 날짜</span>
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="min-w-[9rem] font-medium">
              {format(date, "yyyy. M. d (eee)", { locale: ko })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && onChange(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(addDays(date, 1))}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">다음 날짜</span>
        </Button>
      </div>
    </div>
  )
}
