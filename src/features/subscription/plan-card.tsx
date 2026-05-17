import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BillingCycle, PlanOption } from "./api"

interface PlanCardProps {
  plan: PlanOption
  cycle: BillingCycle
  isCurrent: boolean
  isSelected?: boolean
  onSelect?: () => void
  ctaLabel?: string
  disabled?: boolean
}

function formatPrice(value: number, currency: string): string {
  if (value === 0) return "Ücretsiz"
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function PlanCard({
  plan,
  cycle,
  isCurrent,
  isSelected,
  onSelect,
  ctaLabel,
  disabled,
}: PlanCardProps) {
  const yearly = cycle === "Yearly"
  const baseMonthly = yearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice
  const savings = yearly && plan.monthlyPrice > 0
    ? Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)
    : 0

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300",
        plan.isPopular
          ? "border-primary/40 shadow-lg shadow-primary/10"
          : "border-border hover:border-primary/30 hover:shadow-md",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isCurrent && "border-emerald-500/40 shadow-emerald-500/5"
      )}
    >
      {plan.isPopular && (
        <div className="absolute right-4 top-4">
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            En Popüler
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Mevcut Plan
          </span>
        </div>
      )}

      <div className={cn("mb-6", (plan.isPopular || isCurrent) && "mt-6")}>
        <h3 className="text-2xl font-bold tracking-tight">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tabular-nums tracking-tight">
          {formatPrice(baseMonthly, plan.currency)}
        </span>
        {baseMonthly > 0 && (
          <span className="text-sm text-muted-foreground">/ay</span>
        )}
        {savings > 0 && (
          <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            %{savings} indirim
          </span>
        )}
      </div>

      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2 text-sm">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                feature.emphasize ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="flex-1 text-muted-foreground">
              {feature.label}:{" "}
              <span
                className={cn(
                  "font-medium",
                  feature.emphasize ? "text-foreground" : "text-foreground"
                )}
              >
                {feature.value}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <Button
        variant={plan.isPopular ? "default" : "outline"}
        className="w-full"
        onClick={onSelect}
        disabled={disabled || isCurrent}
      >
        {isCurrent ? "Aktif plan" : ctaLabel ?? "Bu planı seç"}
      </Button>
    </div>
  )
}
