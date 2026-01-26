import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AttributeDataType,
  type CategoryAttributeForEdit,
} from "@/features/category-attributes/api"
import type { ProductAttributeValue } from "@/features/products/api"

interface DynamicAttributeFieldProps {
  attribute: CategoryAttributeForEdit
  value: ProductAttributeValue | undefined
  onChange: (value: ProductAttributeValue) => void
  error?: string
}

export function DynamicAttributeField({
  attribute,
  value,
  onChange,
  error,
}: DynamicAttributeFieldProps) {
  const selectOptions = useMemo(() => {
    if (!attribute.selectOptions) return []
    try {
      const parsed = JSON.parse(attribute.selectOptions)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [attribute.selectOptions])

  const handleChange = (
    stringValue: string | null,
    numericValue: number | null = null,
    dateValue: string | null = null,
    boolValue: boolean | null = null
  ) => {
    onChange({
      categoryAttributeId: attribute.id,
      stringValue,
      numericValue,
      dateValue,
      boolValue,
    })
  }

  const renderField = () => {
    switch (attribute.dataType) {
      case AttributeDataType.String:
        return (
          <Input
            value={value?.stringValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={attribute.placeholder || undefined}
          />
        )

      case AttributeDataType.Integer:
        return (
          <Input
            type="number"
            step="1"
            value={value?.numericValue?.toString() || ""}
            onChange={(e) => {
              const num = e.target.value ? parseInt(e.target.value, 10) : null
              handleChange(num?.toString() || null, num)
            }}
            placeholder={attribute.placeholder || undefined}
          />
        )

      case AttributeDataType.Decimal:
        return (
          <Input
            type="number"
            step="0.01"
            value={value?.numericValue?.toString() || ""}
            onChange={(e) => {
              const num = e.target.value ? parseFloat(e.target.value) : null
              handleChange(num?.toString() || null, num)
            }}
            placeholder={attribute.placeholder || undefined}
          />
        )

      case AttributeDataType.Boolean:
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={`attr-${attribute.id}`}
              checked={value?.boolValue ?? false}
              onCheckedChange={(checked) =>
                handleChange(checked ? "true" : "false", null, null, checked)
              }
            />
            <Label htmlFor={`attr-${attribute.id}`}>
              {value?.boolValue ? "Evet" : "Hayır"}
            </Label>
          </div>
        )

      case AttributeDataType.Date:
        return (
          <Input
            type="date"
            value={value?.dateValue?.split("T")[0] || ""}
            onChange={(e) => {
              const dateStr = e.target.value || null
              handleChange(dateStr, null, dateStr)
            }}
          />
        )

      case AttributeDataType.Select:
        return (
          <Select
            value={value?.stringValue || "none"}
            onValueChange={(val) =>
              handleChange(val === "none" ? null : val)
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={attribute.placeholder || "Seçiniz"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {attribute.placeholder || "Seçiniz"}
              </SelectItem>
              {selectOptions.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case AttributeDataType.MultiSelect:
        const selectedValues = value?.stringValue
          ? JSON.parse(value.stringValue)
          : []
        return (
          <div className="space-y-2">
            {selectOptions.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`attr-${attribute.id}-${index}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v: string) => v !== option)
                    handleChange(
                      newValues.length > 0 ? JSON.stringify(newValues) : null
                    )
                  }}
                />
                <Label htmlFor={`attr-${attribute.id}-${index}`}>
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )

      default:
        return (
          <Input
            value={value?.stringValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={attribute.placeholder || undefined}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`attr-${attribute.id}`}>
        {attribute.displayName}
        {attribute.isRequired && <span className="text-destructive"> *</span>}
      </Label>
      {renderField()}
      {attribute.helpText && (
        <p className="text-sm text-muted-foreground">{attribute.helpText}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
