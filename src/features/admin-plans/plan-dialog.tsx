import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useSubscriptionPlanForEdit,
} from "./hooks"
import type { SubscriptionPlan } from "./api"
import { FEATURE_KEYS, FEATURE_LABELS, type FeatureKey } from "@/lib/entitlements"

// Yeni planda tüm özellikler varsayılan AÇIK (admin sonra kapatır)
const allFeaturesEnabled = (): Record<FeatureKey, boolean> =>
  Object.fromEntries(FEATURE_KEYS.map((k) => [k, true])) as Record<FeatureKey, boolean>

const CYCLE_TYPE_DAY = 1
const CYCLE_TYPE_MONTH = 2

const planSchema = z.object({
  name: z.string().min(1, "Plan adı zorunlu").max(200),
  description: z.string().max(1000).optional().default(""),
  price: z.coerce.number().min(0, "Fiyat 0 veya daha büyük olmalı"),
  yearlyPrice: z.coerce.number().min(0, "Yıllık fiyat 0 veya daha büyük olmalı"),
  maxUserCount: z.coerce.number().int().min(0),
  maxProductCount: z.coerce.number().int().min(0),
  maxWarehouseCount: z.coerce.number().int().min(0),
  maxInventoryCount: z.coerce.number().int().min(0),
  maxVehicleCount: z.coerce.number().int().min(0),
  maxMonthlyRentalCount: z.coerce.number().int().min(0),
  maxAttachmentCount: z.coerce.number().int().min(0),
  cycleType: z.coerce.number().refine(
    (v) => v === CYCLE_TYPE_DAY || v === CYCLE_TYPE_MONTH,
    "Periyot tipi seçiniz"
  ),
  cycleValue: z.coerce.number().int().min(1, "Periyot değeri 0'dan büyük olmalı"),
  isDemo: z.boolean(),
})

type PlanFormData = z.infer<typeof planSchema>

interface PlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: SubscriptionPlan | null
}

const defaultValues: PlanFormData = {
  name: "",
  description: "",
  price: 0,
  yearlyPrice: 0,
  maxUserCount: 0,
  maxProductCount: 0,
  maxWarehouseCount: 0,
  maxInventoryCount: 0,
  maxVehicleCount: 0,
  maxMonthlyRentalCount: 0,
  maxAttachmentCount: 0,
  cycleType: CYCLE_TYPE_MONTH,
  cycleValue: 1,
  isDemo: false,
}

export function PlanDialog({ open, onOpenChange, plan }: PlanDialogProps) {
  const createPlan = useCreateSubscriptionPlan()
  const updatePlan = useUpdateSubscriptionPlan()

  // Özellik matrisi (boolean) — zod formundan ayrı yerel state; düzenlemede getForEdit'ten yüklenir
  const { data: planForEdit } = useSubscriptionPlanForEdit(open && plan ? plan.id : null)
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(allFeaturesEnabled)

  useEffect(() => {
    if (!open) return
    if (plan && planForEdit?.features) {
      const map = allFeaturesEnabled()
      for (const f of planForEdit.features) {
        if (f.key in map) map[f.key as FeatureKey] = f.enabled
      }
      setFeatures(map)
    } else if (!plan) {
      setFeatures(allFeaturesEnabled())
    }
  }, [open, plan, planForEdit])

  const formValues: PlanFormData = (open && plan) ? {
    name: plan.name,
    description: plan.description ?? "",
    price: plan.price,
    yearlyPrice: plan.yearlyPrice,
    maxUserCount: plan.maxUserCount,
    maxProductCount: plan.maxProductCount,
    maxWarehouseCount: plan.maxWarehouseCount,
    maxInventoryCount: plan.maxInventoryCount,
    maxVehicleCount: plan.maxVehicleCount,
    maxMonthlyRentalCount: plan.maxMonthlyRentalCount,
    maxAttachmentCount: plan.maxAttachmentCount,
    cycleType: plan.cycleType,
    cycleValue: plan.cycleValue,
    isDemo: plan.isDemo,
  } : defaultValues

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: formResolver<PlanFormData>(planSchema),
    values: open ? formValues : defaultValues,
  })

  const isDemo = watch("isDemo")

  const onSubmit = async (data: PlanFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description ?? "",
        price: data.price,
        yearlyPrice: data.yearlyPrice,
        maxUserCount: data.maxUserCount,
        maxProductCount: data.maxProductCount,
        maxWarehouseCount: data.maxWarehouseCount,
        maxInventoryCount: data.maxInventoryCount,
        maxVehicleCount: data.maxVehicleCount,
        maxMonthlyRentalCount: data.maxMonthlyRentalCount,
        maxAttachmentCount: data.maxAttachmentCount,
        cycleType: data.cycleType,
        cycleValue: data.cycleValue,
        isDemo: data.isDemo,
        features: FEATURE_KEYS.map((k) => ({ key: k, enabled: features[k] })),
      }
      if (plan) {
        await updatePlan.mutateAsync({ id: plan.id, data: payload })
      } else {
        await createPlan.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation interceptor
    }
  }

  const isSubmitting = createPlan.isPending || updatePlan.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Plan Düzenle" : "Yeni Plan"}</DialogTitle>
          <DialogDescription>
            Plan bilgilerini girin. Limit alanlarına 0 girilirse o kaynak için
            hiçbir oluşturmaya izin verilmez. Sınırsız için yüksek bir değer
            girin (örn. 2.000.000.000).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Plan Adı *"
            placeholder="Örn: Basic"
            {...register("name")}
            autoFocus
            error={errors.name?.message}
          />

          <FormField
            label="Açıklama"
            placeholder="Plan açıklaması"
            {...register("description")}
            multiline
            rows={2}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Aylık Fiyat *"
              type="number"
              step="0.01"
              {...register("price")}
              error={errors.price?.message}
            />
            <FormField
              label="Yıllık Fiyat *"
              type="number"
              step="0.01"
              {...register("yearlyPrice")}
              error={errors.yearlyPrice?.message}
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Limitler</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Her kaynak için ayrı limit. Sınırsız için 2.000.000.000 girin.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <FormField
                label="Kullanıcı"
                type="number"
                {...register("maxUserCount")}
                error={errors.maxUserCount?.message}
              />
              <FormField
                label="Ürün"
                type="number"
                {...register("maxProductCount")}
                error={errors.maxProductCount?.message}
              />
              <FormField
                label="Depo"
                type="number"
                {...register("maxWarehouseCount")}
                error={errors.maxWarehouseCount?.message}
              />
              <FormField
                label="Envanter"
                type="number"
                {...register("maxInventoryCount")}
                error={errors.maxInventoryCount?.message}
              />
              <FormField
                label="Araç"
                type="number"
                {...register("maxVehicleCount")}
                error={errors.maxVehicleCount?.message}
              />
              <FormField
                label="Aylık Kiralama"
                type="number"
                {...register("maxMonthlyRentalCount")}
                error={errors.maxMonthlyRentalCount?.message}
              />
              <FormField
                label="Dosya Eki"
                type="number"
                {...register("maxAttachmentCount")}
                error={errors.maxAttachmentCount?.message}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Özellikler</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bu pakette hangi modüller açık olsun. Kapalı özelliği abone kullanamaz.
                Değişiklik yalnızca yeni/yenilenen abonelikleri etkiler; mevcut aboneler
                aldıkları haklarla devam eder.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FEATURE_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <span className="text-sm">{FEATURE_LABELS[key]}</span>
                  <Switch
                    checked={features[key]}
                    onCheckedChange={(checked) =>
                      setFeatures((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Periyot Tipi *</Label>
              <Controller
                control={control}
                name="cycleType"
                render={({ field }) => (
                  <Select
                    key={`cycleType-${field.value}`}
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Periyot tipi seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(CYCLE_TYPE_DAY)}>Gün</SelectItem>
                      <SelectItem value={String(CYCLE_TYPE_MONTH)}>Ay</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cycleType?.message && (
                <p className="text-sm text-destructive">{errors.cycleType.message}</p>
              )}
            </div>

            <FormField
              label="Periyot Değeri *"
              type="number"
              {...register("cycleValue")}
              error={errors.cycleValue?.message}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Deneme Planı</Label>
              <p className="text-sm text-muted-foreground">
                Bu plan deneme süresi olarak kullanılsın mı?
              </p>
            </div>
            <Switch
              checked={isDemo}
              onCheckedChange={(checked) => setValue("isDemo", checked)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
