"use client"

import { CalendarIcon, Clock } from "lucide-react"
import { addDays, format, parse } from "date-fns"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  // ISO "YYYY-MM-DDTHH:mm" formatı. Boş için "" veya null.
  value: string | null | undefined
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  // Disable selection of dates before this. ISO "YYYY-MM-DDTHH:mm" veya "YYYY-MM-DD".
  minDate?: string | null
  // Disable selection of dates after this.
  maxDate?: string | null
}

const DATE_DISPLAY = "d MMMM yyyy"
const DATE_VALUE = "yyyy-MM-dd"

function splitValue(value: string | null | undefined): { date: string; time: string } {
  if (!value) return { date: "", time: "" }
  const date = value.slice(0, 10)
  const time = value.length >= 16 ? value.slice(11, 16) : ""
  return { date, time }
}

function combineValue(date: string, time: string): string {
  if (!date) return ""
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00"
  return `${date}T${t}`
}

function isoDateOnly(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined
  const slice = iso.slice(0, 10)
  const parsed = parse(slice, DATE_VALUE, new Date())
  return isNaN(parsed.getTime()) ? undefined : parsed
}

function dateToIso(date: Date | undefined): string {
  if (!date) return ""
  return format(date, DATE_VALUE)
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Tarih ve saat seçiniz",
  disabled,
  className,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const { date, time } = splitValue(value)
  const selectedDate = isoDateOnly(date)
  const min = isoDateOnly(minDate)
  const max = isoDateOnly(maxDate)

  const handleDateSelect = (d: Date | undefined) => {
    const newDate = dateToIso(d)
    if (!newDate) {
      onChange("")
      return
    }
    onChange(combineValue(newDate, time || "09:00"))
  }

  const handleTimeChange = (newTime: string) => {
    if (!date) return
    onChange(combineValue(date, newTime))
  }

  const displayLabel = (() => {
    if (!selectedDate) return placeholder
    const datePart = format(selectedDate, DATE_DISPLAY, { locale: tr })
    return time ? `${datePart} ${time}` : datePart
  })()

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {(() => {
            const today = new Date()
            const isDisabled = (d: Date) => {
              if (min && d < min) return true
              if (max && d > max) return true
              return false
            }
            const quicks = [
              { label: "Bugün", date: today },
              { label: "Yarın", date: addDays(today, 1) },
              { label: "Haftaya", date: addDays(today, 7) },
            ]
            return quicks.map((q) => (
              <Button
                key={q.label}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={isDisabled(q.date)}
                onClick={() => handleDateSelect(q.date)}
              >
                {q.label}
              </Button>
            ))
          })()}
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={
            min || max
              ? (d) => {
                  if (min && d < min) return true
                  if (max && d > max) return true
                  return false
                }
              : undefined
          }
          initialFocus
        />
        <div className="border-t p-3 space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Saat
          </Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={!date}
            step={60}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

