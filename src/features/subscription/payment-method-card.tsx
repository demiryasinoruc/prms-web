import { Trash2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PaymentMethodSummary } from "./api"

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethodSummary
  onSetDefault?: (id: string) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

// Marka bazlı gradient — kart preview için sadece görsel niyet.
function gradientFor(brand: string): string {
  const lower = brand.toLowerCase()
  if (lower.includes("visa")) return "from-indigo-600 via-blue-600 to-sky-500"
  if (lower.includes("master")) return "from-orange-500 via-red-500 to-rose-600"
  if (lower.includes("amex")) return "from-emerald-600 via-teal-600 to-cyan-600"
  if (lower.includes("troy")) return "from-red-600 via-rose-600 to-fuchsia-700"
  return "from-slate-700 via-slate-600 to-slate-800"
}

function maskedNumber(last4: string): string {
  return `•••• •••• •••• ${last4}`
}

function formatExpiry(month: number, year: number): string {
  const mm = month.toString().padStart(2, "0")
  const yy = year.toString().slice(-2)
  return `${mm}/${yy}`
}

export function PaymentMethodCard({
  paymentMethod,
  onSetDefault,
  onDelete,
  isLoading,
}: PaymentMethodCardProps) {
  const gradient = gradientFor(paymentMethod.cardBrand)

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition-transform duration-300",
          gradient,
          "hover:scale-[1.015] hover:shadow-xl"
        )}
        style={{
          // Hafif noise texture niyeti — gradient overlay
          backgroundImage:
            "radial-gradient(circle at 80% 10%, rgba(255,255,255,0.18) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(0,0,0,0.25) 0%, transparent 60%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br opacity-100" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-white/80">
              {paymentMethod.isDefault ? "Varsayılan" : "Kayıtlı kart"}
            </span>
            <span className="font-display text-lg font-bold uppercase italic tracking-wider">
              {paymentMethod.cardBrand}
            </span>
          </div>
          <div>
            <div className="font-mono text-lg tracking-[0.2em] sm:text-xl">
              {maskedNumber(paymentMethod.lastFourDigits)}
            </div>
            <div className="mt-3 flex items-end justify-between text-[11px] uppercase tracking-widest">
              <div>
                <div className="text-white/60">Kart sahibi</div>
                <div className="mt-0.5 truncate text-sm font-medium tracking-wide">
                  {paymentMethod.cardHolderName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/60">Son kullanma</div>
                <div className="mt-0.5 text-sm font-medium tabular-nums">
                  {formatExpiry(paymentMethod.expiryMonth, paymentMethod.expiryYear)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {paymentMethod.isDefault ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
            Otomatik ödemede kullanılır
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onSetDefault?.(paymentMethod.id)}
            disabled={isLoading}
          >
            <Star className="mr-1 h-3 w-3" />
            Varsayılan yap
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          onClick={() => onDelete?.(paymentMethod.id)}
          disabled={isLoading}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Kaldır
        </Button>
      </div>
    </div>
  )
}
