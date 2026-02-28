import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StatusFilterSelectProps {
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
  triggerClassName?: string
}

export function StatusFilterSelect({
  value,
  onChange,
  triggerClassName = "w-[150px]",
}: StatusFilterSelectProps) {
  const selectValue = value === undefined ? "all" : value ? "active" : "inactive"

  return (
    <Select
      value={selectValue}
      onValueChange={(v) => onChange(v === "all" ? undefined : v === "active")}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Durum" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tüm Durumlar</SelectItem>
        <SelectItem value="active">Aktif</SelectItem>
        <SelectItem value="inactive">Pasif</SelectItem>
      </SelectContent>
    </Select>
  )
}
