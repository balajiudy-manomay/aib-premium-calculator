import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxSearchableProps {
  items: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  hasError?: boolean
  disabled?: boolean
}

export function ComboboxSearchable({
  items,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No option found.",
  className,
  hasError,
  disabled,
}: ComboboxSearchableProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Filter and limit items in React memory to avoid rendering thousands of DOM nodes at once
  const filteredItems = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) {
      return items.slice(0, 100)
    }
    return items
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 100)
  }, [items, searchQuery])

  // Reset search query when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-xl bg-slate-50 text-sm font-semibold text-brand-charcoal border transition-all cursor-pointer h-10 px-4 py-2",
            hasError
              ? "border-red-400 focus:border-red-500 ring-1 ring-red-400/20 focus:ring-1 focus:ring-red-400/20"
              : "border-slate-200 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20",
            !value && "text-slate-400 font-normal",
            className
          )}
        >
          <span className="truncate">{value ? value : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item}
                  value={item}
                  onSelect={(currentValue) => {
                    const selected = items.find((i) => i.toLowerCase() === currentValue.toLowerCase()) || currentValue
                    onValueChange(selected === value ? "" : selected)
                    setOpen(false)
                  }}
                  data-checked={value === item}
                >
                  {item}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
