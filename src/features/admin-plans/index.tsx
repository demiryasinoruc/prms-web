import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import { Tags } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { useSubscriptionPlans, useDeleteSubscriptionPlan } from "./hooks"
import { PlanDialog } from "./plan-dialog"
import type { SubscriptionPlan } from "./api"
import { createActionButtonsColumn } from "@/components/shared/column-helpers"
import { useDialogResetKey } from "@/hooks/use-dialog-reset-key"

const CYCLE_TYPE_LABELS: Record<number, string> = {
  1: "Gün",
  2: "Ay",
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatLimit(value: number): string {
  return value === 0 ? "Sınırsız" : value.toLocaleString("tr-TR")
}

export default function AdminPlansPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })
  const [demoFilter, setDemoFilter] = useState<boolean | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const dialogKey = useDialogResetKey(dialogOpen)

  const { data, isLoading } = useSubscriptionPlans({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    isDemo: demoFilter,
  })

  const deletePlan = useDeleteSubscriptionPlan()

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingPlan(null)
  }

  const columns: ColumnDef<SubscriptionPlan>[] = [
    {
      accessorKey: "name",
      header: "Plan Adı",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Tags className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Aylık Fiyat",
      enableSorting: true,
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: "yearlyPrice",
      header: "Yıllık Fiyat",
      enableSorting: true,
      cell: ({ row }) => formatCurrency(row.original.yearlyPrice),
    },
    {
      accessorKey: "maxUserCount",
      header: "Kullanıcı",
      enableSorting: true,
      cell: ({ row }) => formatLimit(row.original.maxUserCount),
    },
    {
      accessorKey: "maxProductCount",
      header: "Ürün",
      enableSorting: true,
      cell: ({ row }) => formatLimit(row.original.maxProductCount),
    },
    {
      id: "cycle",
      header: "Periyot",
      enableSorting: false,
      cell: ({ row }) => `${row.original.cycleValue} ${CYCLE_TYPE_LABELS[row.original.cycleType] ?? "?"}`,
    },
    {
      accessorKey: "isDemo",
      header: "Tip",
      enableSorting: true,
      cell: ({ row }) => (
        <Badge variant={row.original.isDemo ? "secondary" : "default"}>
          {row.original.isDemo ? "Deneme" : "Ücretli"}
        </Badge>
      ),
    },
    {
      accessorKey: "activeSubscriptionCount",
      header: "Aktif Abonelik",
      enableSorting: false,
      cell: ({ row }) => row.original.activeSubscriptionCount,
    },
    createActionButtonsColumn<SubscriptionPlan>({
      onEdit: handleEdit,
      onDelete: (id) => deletePlan.mutateAsync(Number(id)),
      getId: (row) => String(row.id),
      canUpdate: true,
      canDelete: true,
      entityName: "Plan",
    }),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Planları"
        description="Sistem genelinde kullanılabilen abonelik planlarını yönetin"
        action={{ label: "Yeni Plan", onClick: () => setDialogOpen(true), permission: true }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Plan Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} plan kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Plan ara..."
            />
            <Select
              value={demoFilter === undefined ? "all" : demoFilter ? "demo" : "paid"}
              onValueChange={(value) => {
                setDemoFilter(value === "all" ? undefined : value === "demo")
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="paid">Ücretli</SelectItem>
                <SelectItem value="demo">Deneme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz plan eklenmemiş"
            pagination={{
              pageIndex: page,
              pageSize,
              pageCount: data?.totalPages || 0,
              onPageChange: setPage,
              onPageSizeChange: (size) => {
                setPageSize(size)
                setPage(0)
              },
            }}
            sorting={{
              sortBy: sorting.sortBy,
              sortDir: sorting.sortDir,
              onSortChange: (newSortBy, newSortDir) => {
                setSorting({ sortBy: newSortBy, sortDir: newSortDir })
                setPage(0)
              },
            }}
          />
        </CardContent>
      </Card>

      <PlanDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        plan={editingPlan}
      />
    </div>
  )
}
