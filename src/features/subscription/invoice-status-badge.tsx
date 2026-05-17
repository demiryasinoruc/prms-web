import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { InvoiceStatusLabels, type InvoiceStatus } from "./api"

const styleByStatus: Record<InvoiceStatus, string> = {
  Paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Failed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  Refunded: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400",
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", styleByStatus[status])}
    >
      {InvoiceStatusLabels[status]}
    </Badge>
  )
}
