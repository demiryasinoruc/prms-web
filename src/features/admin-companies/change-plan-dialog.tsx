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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useChangePlan } from "./hooks"
import { useSubscriptionPlanSelect } from "@/features/admin-plans/hooks"

const schema = z.object({
  newPlanId: z.coerce.number().int().min(1, "Plan seçilmelidir"),
  newStartDate: z.string().min(1, "Başlangıç tarihi zorunlu"),
  newEndDate: z.string().min(1, "Bitiş tarihi zorunlu"),
})

type FormData = z.infer<typeof schema>

interface ChangePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
}

const defaultValues: FormData = {
  newPlanId: 0,
  newStartDate: "",
  newEndDate: "",
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
}: ChangePlanDialogProps) {
  const changePlan = useChangePlan()
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
      await changePlan.mutateAsync({
        companyId,
        data: {
          newPlanId: data.newPlanId,
          newStartDate: data.newStartDate,
          newEndDate: data.newEndDate,
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
          <DialogTitle>Planı Değiştir</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{companyName}</span> firmasının mevcut aboneliği bugün sonlandırılır ve seçilen yeni planla yeni abonelik açılır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Yeni Plan *</Label>
            <Controller
              control={control}
              name="newPlanId"
              render={({ field }) => (
                <Select
                  key={`newPlanId-${field.value}`}
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
            {errors.newPlanId?.message && (
              <p className="text-sm text-destructive">{errors.newPlanId.message}</p>
            )}
          </div>

          <FormField
            label="Yeni Başlangıç Tarihi *"
            type="date"
            {...register("newStartDate")}
            error={errors.newStartDate?.message}
          />

          <FormField
            label="Yeni Bitiş Tarihi *"
            type="date"
            {...register("newEndDate")}
            error={errors.newEndDate?.message}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={changePlan.isPending}>
              {changePlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Plan Değiştir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
