"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { tr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  ...props
}: CalendarProps) {
  const currentYear = new Date().getFullYear()
  return (
    <DayPicker
      locale={tr}
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={new Date(currentYear - 10, 0)}
      endMonth={new Date(currentYear + 10, 11)}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full h-9",
        caption_label: "text-sm font-medium capitalize hidden",
        dropdowns: "flex items-center justify-center gap-1.5 w-full",
        dropdown_root:
          "relative inline-flex items-center rounded-md border border-input bg-background hover:bg-accent transition-colors text-sm px-2 py-1",
        dropdown:
          "absolute inset-0 opacity-0 cursor-pointer appearance-none",
        years_dropdown: "",
        months_dropdown: "",
        nav: "flex items-center gap-1 absolute inset-x-0 top-1 justify-between px-1 pointer-events-none z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto cursor-pointer",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 pointer-events-auto cursor-pointer",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] capitalize flex-1 text-center",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm flex-1 flex items-center justify-center [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside:
          "[&>button]:text-muted-foreground [&>button]:opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "[&>button]:text-muted-foreground [&>button]:opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...iconProps }) =>
          orientation === "left"
            ? <ChevronLeft className="h-4 w-4" {...iconProps} />
            : <ChevronRight className="h-4 w-4" {...iconProps} />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
