import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { type ColumnDef } from "@tanstack/react-table"
import { Building2 } from "lucide-react"
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
import { useAdminCompanies } from "./hooks"
import { useSubscriptionPlanSelect } from "@/features/admin-plans/hooks"
import { CompanyDetailSheet } from "./company-detail-sheet"
import type { AdminCompanyListItem } from "./api"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 400)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy: string | null; sortDir: "asc" | "desc" | null }>({
    sortBy: null,
    sortDir: null,
  })
  const [planFilter, setPlanFilter] = useState<number | undefined>(undefined)
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyListItem | null>(null)

  const { data, isLoading } = useAdminCompanies({
    pageNumber: page + 1,
    pageSize,
    searchTerm: debouncedSearch || undefined,
    sortBy: sorting.sortBy || undefined,
    sortDir: sorting.sortDir || undefined,
    planId: planFilter,
    hasActiveSubscription: activeFilter,
  })

  const { data: plans = [] } = useSubscriptionPlanSelect()

  const handleOpenDetail = (company: AdminCompanyListItem) => {
    setSelectedCompany(company)
    setDetailOpen(true)
  }

  const handleDetailClose = () => {
    setDetailOpen(false)
    setSelectedCompany(null)
  }

  const columns: ColumnDef<AdminCompanyListItem>[] = [
    {
      accessorKey: "name",
      header: "Firma",
      enableSorting: true,
      cell: ({ row }) => (
        <button
          onClick={() => handleOpenDetail(row.original)}
          className="flex items-center gap-2 text-primary hover:underline text-left"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{row.original.name}</span>
        </button>
      ),
    },
    {
      accessorKey: "email",
      header: "E-posta",
      enableSorting: true,
    },
    {
      id: "currentPlan",
      header: "Aktif Plan",
      enableSorting: false,
      cell: ({ row }) => {
        const sub = row.original.activeSubscription
        if (!sub) {
          return <Badge variant="outline">Pasif</Badge>
        }
        return (
          <div className="flex items-center gap-2">
            <Badge variant={sub.isDemo ? "secondary" : "default"}>{sub.planName}</Badge>
            {sub.isDemo && <span className="text-xs text-muted-foreground">Deneme</span>}
          </div>
        )
      },
    },
    {
      id: "endDate",
      header: "Bitiş",
      enableSorting: false,
      cell: ({ row }) => {
        const sub = row.original.activeSubscription
        return sub ? formatDate(sub.endDate) : "—"
      },
    },
    {
      id: "daysRemaining",
      header: "Kalan",
      enableSorting: false,
      cell: ({ row }) => {
        const sub = row.original.activeSubscription
        if (!sub) return "—"
        const days = sub.daysRemaining
        return (
          <span className={days <= 7 ? "text-destructive font-medium" : ""}>
            {days} gün
          </span>
        )
      },
    },
    {
      accessorKey: "createdDate",
      header: "Kayıt Tarihi",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.createdDate),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Firmalar"
        description="Sistem üzerindeki tüm firmaları ve aboneliklerini yönetin"
      />

      <Card>
        <CardHeader>
          <CardTitle>Firma Listesi</CardTitle>
          <CardDescription>
            Toplam {data?.totalCount || 0} firma kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(0) }}
              placeholder="Firma ara..."
            />
            <Select
              value={planFilter === undefined ? "all" : String(planFilter)}
              onValueChange={(value) => {
                setPlanFilter(value === "all" ? undefined : Number(value))
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Planlar</SelectItem>
                {plans.map((p) => (
                  <SelectItem key={p.value} value={String(p.value)}>
                    {p.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"}
              onValueChange={(value) => {
                setActiveFilter(value === "all" ? undefined : value === "active")
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items || []}
            isLoading={isLoading}
            emptyMessage="Henüz firma kaydı yok"
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

      <CompanyDetailSheet
        open={detailOpen}
        onOpenChange={handleDetailClose}
        company={selectedCompany}
      />
    </div>
  )
}
