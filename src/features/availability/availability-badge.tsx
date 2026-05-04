import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { BatchAvailabilityItemResult } from "./api"

type Props = {
  isLoading?: boolean
  result?: BatchAvailabilityItemResult
}

const formatDate = (iso: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("tr-TR")
}

export function AvailabilityBadge({ isLoading, result }: Props) {
  if (isLoading) {
    return (
      <Badge variant="outline" className="opacity-50">
        Kontrol ediliyor...
      </Badge>
    )
  }

  if (!result) return null

  if (result.isAvailable) {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-300 hover:bg-green-50"
      >
        {result.available != null ? `Müsait: ${result.available}` : "Müsait"}
      </Badge>
    )
  }

  // Unavailable
  const label =
    result.requested != null && result.available != null
      ? `Çakışıyor (${result.requested}/${result.available} müsait)`
      : "Çakışıyor"

  const conflicts = result.conflicts ?? []

  if (conflicts.length === 0) {
    return <Badge variant="destructive">{label}</Badge>
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="cursor-help">
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          className="max-w-sm bg-popover text-popover-foreground border shadow-md"
          side="top"
        >
          <div className="space-y-2 p-1">
            <p className="font-semibold text-xs">Çakışan Kiralamalar:</p>
            <div className="space-y-2">
              {conflicts.map((c, i) => (
                <div key={i} className="text-xs border-l-2 border-destructive pl-2">
                  <div className="font-medium">
                    {c.rentalNumber || "(Aynı kiralama)"}
                  </div>
                  {c.productName && (
                    <div className="text-muted-foreground">{c.productName}</div>
                  )}
                  <div className="text-muted-foreground">
                    {c.serialNumber && <span>SN: {c.serialNumber} • </span>}
                    {formatDate(c.startDate)} - {formatDate(c.endDate)}
                  </div>
                  {c.requestedQuantity != null && c.availableQuantity != null && (
                    <div className="text-muted-foreground">
                      {c.requestedQuantity} talep, {c.availableQuantity} müsait
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
