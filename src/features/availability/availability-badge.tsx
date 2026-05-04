import { Badge } from "@/components/ui/badge"
import type { BatchAvailabilityItemResult } from "./api"

type Props = {
  isLoading?: boolean
  result?: BatchAvailabilityItemResult
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
  const conflictsSummary = result.conflicts
    ?.map((c) => c.rentalNumber || "?")
    .join(", ")

  return (
    <Badge
      variant="destructive"
      title={conflictsSummary ? `Çakışan: ${conflictsSummary}` : undefined}
    >
      {result.requested != null && result.available != null
        ? `Çakışıyor (${result.requested}/${result.available} müsait)`
        : "Çakışıyor"}
    </Badge>
  )
}
