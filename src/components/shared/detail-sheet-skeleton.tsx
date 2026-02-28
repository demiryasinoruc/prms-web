import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

interface DetailSheetSkeletonProps {
  title: string
  description?: string
}

export function DetailSheetSkeleton({
  title,
  description = "Yükleniyor...",
}: DetailSheetSkeletonProps) {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

interface DetailSheetEmptyStateProps {
  title: string
  message: string
}

export function DetailSheetEmptyState({
  title,
  message,
}: DetailSheetEmptyStateProps) {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>Bilgi bulunamadı</SheetDescription>
      </SheetHeader>
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
