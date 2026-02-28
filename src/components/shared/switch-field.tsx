import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface SwitchFieldProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: SwitchFieldProps) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${className ?? ""}`}>
      <div className="space-y-0.5">
        <Label>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
