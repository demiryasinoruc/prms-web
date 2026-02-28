import { useEffect } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWarehouseSelect as useWarehouseSelectData } from "@/features/warehouses/hooks"

interface WarehouseSelectProps {
  value: string | null | undefined
  onChange: (value: string | null) => void
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  disabled?: boolean
  filterMode?: boolean
  allLabel?: string
  triggerClassName?: string
}

export function WarehouseSelect({
  value,
  onChange,
  label,
  placeholder = "Depo seçiniz",
  required = false,
  error,
  disabled = false,
  filterMode = false,
  allLabel = "Tüm Depolar",
  triggerClassName,
}: WarehouseSelectProps) {
  const { data: warehouses } = useWarehouseSelectData()

  const isSingle = warehouses?.length === 1
  const isEmpty = !warehouses || warehouses.length === 0
  const isDisabled = disabled || isSingle || isEmpty

  // Tek depo varsa otomatik seç
  useEffect(() => {
    if (isSingle && warehouses[0].id !== value) {
      onChange(warehouses[0].id)
    }
  }, [isSingle, warehouses, value, onChange])

  if (filterMode) {
    const filterValue = value || "all"

    return (
      <Select
        key={`warehouse-filter-${filterValue}`}
        value={filterValue}
        onValueChange={(v) => onChange(v === "all" ? null : v)}
        disabled={isDisabled}
      >
        <SelectTrigger className={triggerClassName || "w-[180px]"}>
          <SelectValue placeholder="Depo" />
        </SelectTrigger>
        <SelectContent>
          {!isSingle && <SelectItem value="all">{allLabel}</SelectItem>}
          {warehouses?.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Form mode
  const selectValue = value || "none"

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select
        key={`warehouse-${selectValue}`}
        value={selectValue}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
        disabled={isDisabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" disabled={required}>
            {placeholder}
          </SelectItem>
          {warehouses?.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
