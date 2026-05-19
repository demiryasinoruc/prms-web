"use client"

import { CalendarIcon } from "lucide-react"
import { addDays, format, parse } from "date-fns"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  // ISO "YYYY-MM-DD" veya tam ISO string. Boş için "" veya null.
  value: string | null | undefined
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  // Disable selection of dates before this. ISO "YYYY-MM-DD".
  minDate?: string | null
  // Disable selection of dates after this. ISO "YYYY-MM-DD".
  maxDate?: string | null
}

const DISPLAY_FORMAT = "d MMMM yyyy" // Türkçe: "18 Mayıs 2026"
const VALUE_FORMAT = "yyyy-MM-dd"

function isoToDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined
  const slice = iso.slice(0, 10)
  const parsed = parse(slice, VALUE_FORMAT, new Date())
  return isNaN(parsed.getTime()) ? undefined : parsed
}

function dateToIso(date: Date | undefined): string {
  if (!date) return ""
  return format(date, VALUE_FORMAT)
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Tarih seçiniz",
  disabled,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const selected = isoToDate(value)
  const min = isoToDate(minDate)
  const max = isoToDate(maxDate)

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, DISPLAY_FORMAT, { locale: tr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {(() => {
            const today = new Date()
            const tomorrow = addDays(today, 1)
            const nextWeek = addDays(today, 7)
            const isDisabled = (d: Date) => {
              if (min && d < min) return true
              if (max && d > max) return true
              return false
            }
            const quicks = [
              { label: "Bugün", date: today },
              { label: "Yarın", date: tomorrow },
              { label: "Haftaya", date: nextWeek },
            ]
            return quicks.map((q) => (
              <Button
                key={q.label}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={isDisabled(q.date)}
                onClick={() => onChange(dateToIso(q.date))}
              >
                {q.label}
              </Button>
            ))
          })()}
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(dateToIso(date))}
          disabled={
            min || max
              ? (date) => {
                  if (min && date < min) return true
                  if (max && date > max) return true
                  return false
                }
              : undefined
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
