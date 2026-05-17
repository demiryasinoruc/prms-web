import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PlanCard } from "./plan-card"
import { useMySubscription, usePlanOptions, useUpgradePlan } from "./hooks"
import type { BillingCycle } from "./api"

export default function SubscriptionUpgradePage() {
  const { data: plans, isLoading: plansLoading } = usePlanOptions()
  const { data: subscription } = useMySubscription()
  const upgrade = useUpgradePlan()
  const navigate = useNavigate()

  const [cycle, setCycle] = useState<BillingCycle>("Monthly")
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  const visiblePlans = useMemo(
    () => (plans ?? []).filter((plan) => !plan.isDemo),
    [plans]
  )

  const currentPlanId = subscription?.planId ?? null

  const handleConfirm = async () => {
    if (selectedPlanId === null) return
    const { checkoutUrl } = await upgrade.mutateAsync({ planId: selectedPlanId, cycle })
    if (checkoutUrl.startsWith("http")) {
      window.location.href = checkoutUrl
    } else {
      toast.success("Plan değişikliği talimatı alındı.")
      navigate(checkoutUrl)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
          <Link to="/settings/subscription">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Abonelik Yönetimi
          </Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Planınızı yükseltin</h1>
            <p className="text-muted-foreground">
              İşletmeniz büyüdükçe sınırları kaldırın. İstediğiniz zaman değiştirebilirsiniz.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Faturalama dönemi"
            className="inline-flex rounded-full border bg-muted/40 p-1"
          >
            <CycleToggle
              label="Aylık"
              active={cycle === "Monthly"}
              onClick={() => setCycle("Monthly")}
            />
            <CycleToggle
              label="Yıllık"
              active={cycle === "Yearly"}
              hint="2 ay bedava"
              onClick={() => setCycle("Yearly")}
            />
          </div>
        </div>
      </div>

      {plansLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              cycle={cycle}
              isCurrent={plan.id === currentPlanId && !subscription?.isDemo}
              isSelected={selectedPlanId === plan.id}
              onSelect={() => setSelectedPlanId(plan.id)}
              ctaLabel={selectedPlanId === plan.id ? "Seçildi" : "Bu planı seç"}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Güvenli ödeme</p>
            <p className="text-muted-foreground">
              Plan değişikliği sonraki faturalama döneminde uygulanır. Aktif kullanım kesintisiz devam eder.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          disabled={selectedPlanId === null || upgrade.isPending}
          onClick={handleConfirm}
        >
          {upgrade.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              İşleniyor...
            </>
          ) : (
            "Devam et"
          )}
        </Button>
      </div>
    </div>
  )
}

interface CycleToggleProps {
  label: string
  hint?: string
  active: boolean
  onClick: () => void
}

function CycleToggle({ label, hint, active, onClick }: CycleToggleProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {hint && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-emerald-500/10 text-emerald-700/80"
          )}
        >
          {hint}
        </span>
      )}
    </button>
  )
}
