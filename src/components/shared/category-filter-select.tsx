import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCategorySelect } from "@/features/categories/hooks"

interface CategoryFilterSelectProps {
  value: string | null | undefined
  onChange: (value: string | null) => void
  filterMode?: boolean
  label?: string
  required?: boolean
  error?: string
  triggerClassName?: string
  disabled?: boolean
}

export function CategoryFilterSelect({
  value,
  onChange,
  filterMode = false,
  label,
  required = false,
  error,
  triggerClassName,
  disabled = false,
}: CategoryFilterSelectProps) {
  const { data: categories } = useCategorySelect()

  if (filterMode) {
    const filterValue = value || "all"
    return (
      <Select
        key={`category-filter-${filterValue}`}
        value={filterValue}
        onValueChange={(v) => onChange(v === "all" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className={triggerClassName || "w-[180px]"}>
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Kategoriler</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
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
        key={`category-${selectValue}`}
        value={selectValue}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder="Kategori seçiniz" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" disabled={required}>
            Kategori seçiniz
          </SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
