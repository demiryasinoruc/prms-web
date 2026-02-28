import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface StatusSwitchFieldProps {
  value: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  coloredLabel?: boolean
}

export function StatusSwitchField({
  value,
  onChange,
  label = "Durum",
  description,
  coloredLabel = false,
}: StatusSwitchFieldProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {coloredLabel && (
          <span
            className={`text-sm ${value ? "text-green-600" : "text-muted-foreground"}`}
          >
            {value ? "Aktif" : "Pasif"}
          </span>
        )}
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    </div>
  )
}
