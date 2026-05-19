import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
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

export interface SearchableSelectOption {
  value: string
  label: string
  keywords?: string[] // ek arama anahtar kelimeleri
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
}

/**
 * Klavye ile arama yapılabilen select bileşeni.
 * shadcn Command + Popover üzerine kurulu, mevcut Select'in
 * yerini alabilir. Çok sayıda seçenek olduğunda klavyeden filtreleme sağlar.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seçiniz",
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı",
  disabled,
  clearable = true,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <div className="flex items-center gap-1 shrink-0">
            {clearable && selected && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Seçimi temizle"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            // itemValue = option.value veya keyword'lerle birleştirilmiş string olabilir
            // Burada Command kendi içinde value'yu kullanır; CommandItem'de value'yu zenginleştiriyoruz
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                // value field'i Command filter için arama hedefi olarak kullanılır
                const searchValue = [option.label, ...(option.keywords || [])].join(" ").toLowerCase()
                return (
                  <CommandItem
                    key={option.value}
                    value={searchValue}
                    onSelect={() => {
                      onChange(option.value === value ? null : option.value)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
