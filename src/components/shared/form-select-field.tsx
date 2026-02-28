import { Controller, type Control } from "react-hook-form"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FormSelectFieldProps {
  label: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  disabled?: boolean
  valueType?: "string" | "number"
}

export function FormSelectField({
  label,
  name,
  control,
  options,
  placeholder = "Seçiniz",
  error,
  disabled,
  valueType = "string",
}: FormSelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const stringValue = field.value != null ? String(field.value) : "none"

          return (
            <Select
              key={`${name}-${stringValue}`}
              value={stringValue}
              onValueChange={(value) => {
                if (value === "none") {
                  field.onChange(valueType === "number" ? null : "")
                } else {
                  field.onChange(valueType === "number" ? Number(value) : value)
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  {placeholder}
                </SelectItem>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
