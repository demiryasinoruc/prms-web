import * as React from "react"
import { cn } from "@/lib/utils"

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined
  onChange: (value: number) => void
  /**
   * Ondalık hane sayısı. Para alanları için 2, oran/yüzde için 0 önerilir.
   */
  decimals?: number
}

const TR_FORMATTER_CACHE = new Map<number, Intl.NumberFormat>()

function getFormatter(decimals: number): Intl.NumberFormat {
  let f = TR_FORMATTER_CACHE.get(decimals)
  if (!f) {
    f = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
      useGrouping: true,
    })
    TR_FORMATTER_CACHE.set(decimals, f)
  }
  return f
}

function parseDisplay(input: string): number | null {
  // TR formatı: binlik ayraç "." virgül ","; "1.234,56" → 1234.56
  const trimmed = input.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\./g, "").replace(",", ".")
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function formatDisplay(n: number | null | undefined, decimals: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return ""
  return getFormatter(decimals).format(n)
}

/**
 * Para girişi için TR locale'inde canlı binlik ayraçlı input.
 * Kullanıcı yazarken değer formatlanır, blur olduğunda son halini gösterir.
 * onChange sayısal değeri (number) döner.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, decimals = 2, className, onBlur, onFocus, ...rest }, ref) => {
    const [display, setDisplay] = React.useState<string>(() => formatDisplay(value, decimals))
    const [focused, setFocused] = React.useState(false)

    // Dış value değişince ve focus dışındayken display'i senkronize et
    React.useEffect(() => {
      if (!focused) {
        setDisplay(formatDisplay(value, decimals))
      }
    }, [value, decimals, focused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Geçersiz karakter (rakam, "," ve "." dışında) temizle
      const cleaned = raw.replace(/[^\d.,-]/g, "")
      const parsed = parseDisplay(cleaned)
      if (parsed === null) {
        setDisplay(cleaned)
        return
      }
      // Yazarken canlı formatla — ama son karakter "," ise henüz tamamlanmamış demektir, dokunma
      if (cleaned.endsWith(",")) {
        setDisplay(cleaned)
      } else {
        setDisplay(formatDisplay(parsed, decimals))
      }
      onChange(parsed)
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        value={display}
        onChange={handleChange}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          // Blur'da net değeri yeniden formatla
          const parsed = parseDisplay(display)
          if (parsed === null) {
            setDisplay("")
            onChange(0)
          } else {
            setDisplay(formatDisplay(parsed, decimals))
          }
          onBlur?.(e)
        }}
        {...rest}
      />
    )
  },
)
MoneyInput.displayName = "MoneyInput"
