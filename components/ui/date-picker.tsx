"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface DatePickerProps {
  value?: string; // MM-DD-YYYY format
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  hasError?: boolean;
  displayFormat?: "MM/DD/YYYY" | "DD-MM-YYYY";
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  id,
  hasError,
  displayFormat = "MM/DD/YYYY",
}: DatePickerProps) {
  // Parse 'MM-DD-YYYY' safely to a Date object in local time
  const date = React.useMemo(() => {
    if (!value) return undefined;
    const parts = value.split("-");
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      const parsed = new Date(year, month, day);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (onChange) {
      if (selectedDate) {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const dd = String(selectedDate.getDate()).padStart(2, "0");
        onChange(`${mm}-${dd}-${yyyy}`);
      } else {
        onChange("");
      }
    }
  };

  // Convert Date object to formatted text representation for displaying in button
  const displayText = React.useMemo(() => {
    if (!date) return placeholder;
    return format(date, "do MMMM, yyyy");
  }, [date, placeholder]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "flex h-10 w-full items-center justify-start gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-brand-charcoal outline-none transition-all text-left cursor-pointer",
            hasError
              ? "border-red-400 focus:border-red-500 ring-1 ring-red-400/20 focus:ring-1 focus:ring-red-400/20 bg-slate-50"
              : "border-slate-200 bg-slate-50 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20",
            !value && "text-slate-400 font-normal",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
          <span>{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          captionLayout="dropdown"
          startMonth={new Date(1930, 0)}
          endMonth={new Date()}
          disabled={(date) => date > new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}
