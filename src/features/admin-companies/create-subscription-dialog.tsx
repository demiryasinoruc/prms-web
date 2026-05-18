import { Controller, useForm } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/shared/form-field"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/shared/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateSubscription } from "./hooks"
import { useSubscriptionPlanSelect } from "@/features/admin-plans/hooks"

const schema = z.object({
  planId: z.coerce.number().int().min(1, "Plan seçilmelidir"),
  startDate: z.string().min(1, "Başlangıç tarihi zorunlu"),
  endDate: z.string().min(1, "Bitiş tarihi zorunlu"),
})

type FormData = z.infer<typeof schema>

interface CreateSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
}

const defaultValues: FormData = {
  planId: 0,
  startDate: "",
  endDate: "",
}

export function CreateSubscriptionDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
}: CreateSubscriptionDialogProps) {
  const createSubscription = useCreateSubscription()
  const { data: plans = [] } = useSubscriptionPlanSelect()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: formResolver<FormData>(schema),
    values: open ? defaultValues : defaultValues,
  })

  const onSubmit = async (data: FormData) => {
    try {
      await createSubscription.mutateAsync({
        companyId,
        data: {
          planId: data.planId,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      })
      onOpenChange(false)
    } catch {
      // Error handled by interceptor
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Abonelik Oluştur</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{companyName}</span> firması için manuel yeni bir abonelik kaydı oluşturur. Mevcut abonelik dokunulmadan kalır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Plan *</Label>
            <Controller
              control={control}
              name="planId"
              render={({ field }) => (
                <Select
                  key={`planId-${field.value}`}
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? 0 : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Plan seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Plan seçiniz</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>
                        {p.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.planId?.message && (
              <p className="text-sm text-destructive">{errors.planId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Başlangıç Tarihi *</Label>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Başlangıç tarihi seçiniz"
                />
              )}
            />
            {errors.startDate?.message && (
              <p className="text-sm text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Bitiş Tarihi *</Label>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Bitiş tarihi seçiniz"
                  minDate={(control._formValues as { startDate?: string })?.startDate}
                />
              )}
            />
            {errors.endDate?.message && (
              <p className="text-sm text-destructive">{errors.endDate.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={createSubscription.isPending}>
              {createSubscription.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oluştur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
