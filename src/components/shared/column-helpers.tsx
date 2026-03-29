import { type ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { confirmDelete } from "@/lib/confirm"

interface ActionButtonsOptions<T> {
  onEdit?: (row: T) => void
  onDelete?: (id: string) => Promise<unknown>
  getId: (row: T) => string
  canUpdate?: boolean
  canDelete?: boolean
  entityName?: string
}

export function createActionButtonsColumn<T>(
  options: ActionButtonsOptions<T>
): ColumnDef<T> {
  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete(options.entityName || null)
    if (!confirmed) return
    await options.onDelete!(id)
  }

  return {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        {options.canUpdate && options.onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Düzenle"
            onClick={() => options.onEdit!(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {options.canDelete && options.onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Sil"
            onClick={() => handleDelete(options.getId(row.original))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    ),
  }
}

interface StatusBadgeOptions {
  header?: string
  enableSorting?: boolean
}

export function createStatusBadgeColumn<T extends { isActive: boolean }>(
  options?: StatusBadgeOptions
): ColumnDef<T> {
  return {
    accessorKey: "isActive",
    header: options?.header ?? "Durum",
    enableSorting: options?.enableSorting ?? false,
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "secondary"}>
        {row.original.isActive ? "Aktif" : "Pasif"}
      </Badge>
    ),
  }
}
