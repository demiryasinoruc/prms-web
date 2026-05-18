import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
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
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { SwitchField } from "@/components/shared/switch-field"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateMaintenanceSchedule,
  useUpdateMaintenanceSchedule,
  useMaintenanceScheduleForEdit,
} from "./hooks"
import {
  MaintenanceType,
  MaintenanceTriggerType,
  MaintenanceTypeLabels,
  MaintenanceTriggerTypeLabels,
  type MaintenanceSchedule,
} from "./api"
import { useCategorySelect } from "@/features/categories/hooks"
import { useProductSelect } from "@/features/products/hooks"

const maintenanceScheduleSchema = z.object({
  categoryId: z.string().nullish(),
  productId: z.string().nullish(),
  name: z.string().min(1, "Plan adı zorunludur").max(200, "Plan adı en fazla 200 karakter olabilir"),
  description: z.string().max(1000, "Açıklama en fazla 1000 karakter olabilir").optional(),
  maintenanceType: z.nativeEnum(MaintenanceType),
  triggerType: z.nativeEnum(MaintenanceTriggerType),
  usageInterval: z.number().gt(0, "Kullanım aralığı 0'dan büyük olmalıdır").nullable().optional(),
  dayInterval: z.number().gt(0, "Gün aralığı 0'dan büyük olmalıdır").nullable().optional(),
  estimatedDurationHours: z.number().gt(0, "Tahmini süre 0'dan büyük olmalıdır").nullable().optional(),
  estimatedCost: z.number().min(0, "Tahmini maliyet 0 veya daha büyük olmalıdır").nullable().optional(),
  alertDaysBefore: z.number().gt(0, "Uyarı günü 0'dan büyük olmalıdır").nullable().optional(),
  alertUsageBefore: z.number().gt(0, "Uyarı kullanım değeri 0'dan büyük olmalıdır").nullable().optional(),
  inheritToChildren: z.boolean(),
  isActive: z.boolean(),
}).superRefine((data, ctx) => {
  // Ömür bazlı tetikleme için kullanım aralığı kontrolü
  if (data.triggerType === MaintenanceTriggerType.Usage || data.triggerType === MaintenanceTriggerType.Both) {
    if (data.usageInterval == null || data.usageInterval <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ömür bazlı tetikleme için kullanım aralığı zorunludur",
        path: ["usageInterval"],
      })
    }
  }

  // Zaman bazlı tetikleme için gün aralığı kontrolü
  if (data.triggerType === MaintenanceTriggerType.Time || data.triggerType === MaintenanceTriggerType.Both) {
    if (data.dayInterval == null || data.dayInterval <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Zaman bazlı tetikleme için gün aralığı zorunludur",
        path: ["dayInterval"],
      })
    }
  }
})

type MaintenanceScheduleFormData = z.infer<typeof maintenanceScheduleSchema>

interface MaintenanceScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: MaintenanceSchedule | null
}

const defaultValues: MaintenanceScheduleFormData = {
  categoryId: null,
  productId: null,
  name: "",
  description: "",
  maintenanceType: MaintenanceType.Preventive,
  triggerType: MaintenanceTriggerType.Time,
  usageInterval: null,
  dayInterval: null,
  estimatedDurationHours: null,
  estimatedCost: null,
  alertDaysBefore: null,
  alertUsageBefore: null,
  inheritToChildren: true,
  isActive: true,
}

export function MaintenanceScheduleDialog({
  open,
  onOpenChange,
  schedule,
}: MaintenanceScheduleDialogProps) {
  const createSchedule = useCreateMaintenanceSchedule()
  const updateSchedule = useUpdateMaintenanceSchedule()

  const { data: editData, isLoading: isLoadingEdit } = useMaintenanceScheduleForEdit(
    open && schedule ? schedule.id : null
  )

  const { data: categories } = useCategorySelect()
  const { data: products } = useProductSelect()

  const [targetType, setTargetType] = useState<"category" | "product">("category")
  const [targetError, setTargetError] = useState<string | null>(null)

  const formValues: MaintenanceScheduleFormData = (open && schedule && editData)
    ? {
        categoryId: editData.categoryId,
        productId: editData.productId,
        name: editData.name,
        description: editData.description || "",
        maintenanceType: editData.maintenanceType,
        triggerType: editData.triggerType,
        usageInterval: editData.usageInterval,
        dayInterval: editData.dayInterval,
        estimatedDurationHours: editData.estimatedDurationHours,
        estimatedCost: editData.estimatedCost,
        alertDaysBefore: editData.alertDaysBefore,
        alertUsageBefore: editData.alertUsageBefore,
        inheritToChildren: editData.inheritToChildren,
        isActive: editData.isActive,
      }
    : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceScheduleFormData>({
    resolver: formResolver<MaintenanceScheduleFormData>(maintenanceScheduleSchema),
    values: open ? formValues : defaultValues,
  })

  const triggerType = watch("triggerType")
  const isActive = watch("isActive")
  const inheritToChildren = watch("inheritToChildren")

  // Set target type based on edit data
  useEffect(() => {
    if (open && editData) {
      if (editData.productId) {
        setTargetType("product")
      } else {
        setTargetType("category")
      }
      setTargetError(null)
    } else if (!open) {
      setTargetType("category")
      setTargetError(null)
    }
  }, [open, editData])

  // Handle target type change
  const handleTargetTypeChange = (type: "category" | "product") => {
    setTargetType(type)
    setTargetError(null)
    if (type === "category") {
      setValue("productId", null)
    } else {
      setValue("categoryId", null)
    }
  }

  const onSubmit = async (data: MaintenanceScheduleFormData) => {
    // Manuel validasyon: targetType'a göre kategori veya ürün kontrolü
    if (targetType === "category" && !data.categoryId) {
      setTargetError("Kategori seçilmelidir")
      return
    }
    if (targetType === "product" && !data.productId) {
      setTargetError("Ürün seçilmelidir")
      return
    }
    setTargetError(null)

    try {
      const requestData = {
        categoryId: targetType === "category" ? (data.categoryId ?? null) : null,
        productId: targetType === "product" ? (data.productId ?? null) : null,
        name: data.name,
        description: data.description || "",
        maintenanceType: data.maintenanceType,
        triggerType: data.triggerType,
        usageInterval: data.usageInterval ?? null,
        dayInterval: data.dayInterval ?? null,
        estimatedDurationHours: data.estimatedDurationHours ?? null,
        estimatedCost: data.estimatedCost ?? null,
        alertDaysBefore: data.alertDaysBefore ?? null,
        alertUsageBefore: data.alertUsageBefore ?? null,
        inheritToChildren: data.inheritToChildren,
        isActive: data.isActive,
      }

      if (schedule) {
        await updateSchedule.mutateAsync({
          id: schedule.id,
          data: requestData,
        })
      } else {
        await createSchedule.mutateAsync(requestData)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createSchedule.isPending || updateSchedule.isPending
  const showUsageInterval = triggerType === MaintenanceTriggerType.Usage || triggerType === MaintenanceTriggerType.Both
  const showDayInterval = triggerType === MaintenanceTriggerType.Time || triggerType === MaintenanceTriggerType.Both

  if (schedule && isLoadingEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yükleniyor</DialogTitle>
            <DialogDescription>Bakım planı bilgileri yükleniyor...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Bakım Planı Düzenle" : "Yeni Bakım Planı"}
          </DialogTitle>
          <DialogDescription>
            Bakım planı bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Target Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hedef Tipi</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={targetType === "category" ? "default" : "outline"}
                  onClick={() => handleTargetTypeChange("category")}
                  className="flex-1"
                >
                  Kategori
                </Button>
                <Button
                  type="button"
                  variant={targetType === "product" ? "default" : "outline"}
                  onClick={() => handleTargetTypeChange("product")}
                  className="flex-1"
                >
                  Ürün
                </Button>
              </div>
            </div>

            {targetType === "category" ? (
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Kategori seçiniz</SelectItem>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {targetError && (
                  <p className="text-sm text-destructive">{targetError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Ürün *</Label>
                <Controller
                  control={control}
                  name="productId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ürün seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Ürün seçiniz</SelectItem>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {targetError && (
                  <p className="text-sm text-destructive">{targetError}</p>
                )}
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                label="Plan Adı *"
                placeholder="Bakım planı adı"
                {...register("name")}
                autoFocus
                error={errors.name?.message}
              />
            </div>

            <FormSelectField
              label="Bakım Türü *"
              name="maintenanceType"
              control={control}
              valueType="number"
              options={Object.entries(MaintenanceTypeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="Bakım türü seçiniz"
            />

            <FormSelectField
              label="Tetikleme Türü *"
              name="triggerType"
              control={control}
              valueType="number"
              options={Object.entries(MaintenanceTriggerTypeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="Tetikleme türü seçiniz"
            />
          </div>

          {/* Trigger Intervals */}
          <div className="grid gap-4 sm:grid-cols-2">
            {showUsageInterval && (
              <div className="space-y-2">
                <FormField
                  label="Kullanım Aralığı (birim) *"
                  type="number"
                  placeholder="Örn: 500"
                  {...register("usageInterval", { valueAsNumber: true })}
                  error={errors.usageInterval?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Ürünün ömür birimi cinsinden aralık
                </p>
              </div>
            )}

            {showDayInterval && (
              <div className="space-y-2">
                <FormField
                  label="Gün Aralığı *"
                  type="number"
                  placeholder="Örn: 30"
                  {...register("dayInterval", { valueAsNumber: true })}
                  error={errors.dayInterval?.message}
                />
                <p className="text-xs text-muted-foreground">
                  Kaç günde bir bakım yapılacak
                </p>
              </div>
            )}
          </div>

          {/* Estimates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Tahmini Süre (saat)"
              type="number"
              step="0.5"
              placeholder="Örn: 2"
              {...register("estimatedDurationHours", { valueAsNumber: true })}
            />

            <FormField
              label="Tahmini Maliyet"
              type="number"
              step="0.01"
              placeholder="Örn: 500.00"
              {...register("estimatedCost", { valueAsNumber: true })}
            />
          </div>

          {/* Alerts */}
          <div className="grid gap-4 sm:grid-cols-2">
            {showDayInterval && (
              <div className="space-y-2">
                <FormField
                  label="Uyarı (gün önce)"
                  type="number"
                  placeholder="Örn: 7"
                  {...register("alertDaysBefore", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Bakımdan kaç gün önce uyarı verilsin
                </p>
              </div>
            )}

            {showUsageInterval && (
              <div className="space-y-2">
                <FormField
                  label="Uyarı (kullanım önce)"
                  type="number"
                  placeholder="Örn: 50"
                  {...register("alertUsageBefore", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Bakımdan kaç birim önce uyarı verilsin
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <FormField
            label="Açıklama"
            placeholder="Bakım planı açıklaması"
            {...register("description")}
            multiline
            rows={3}
          />

          {/* Switches */}
          <div className="space-y-4">
            {targetType === "category" && (
              <SwitchField
                label="Alt Kategorilere Miras"
                description="Bu plan alt kategorilere de uygulanır"
                checked={inheritToChildren}
                onCheckedChange={(checked) => setValue("inheritToChildren", checked)}
              />
            )}

            {schedule && (
              <StatusSwitchField
                value={isActive}
                onChange={(checked) => setValue("isActive", checked)}
                label="Aktif"
                description="Plan aktif ve uygulanabilir durumda"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {schedule ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
