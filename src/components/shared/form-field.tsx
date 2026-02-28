import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  multiline?: boolean
  rows?: number
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, multiline, rows = 3, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {multiline ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            className={className}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <Input ref={ref} className={className} {...props} />
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"
