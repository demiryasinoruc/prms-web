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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  name: z.string().min(1, "Plan adı zorunlu"),
  description: z.string().optional(),
  maintenanceType: z.nativeEnum(MaintenanceType),
  triggerType: z.nativeEnum(MaintenanceTriggerType),
  usageInterval: z.number().nullable().optional(),
  dayInterval: z.number().nullable().optional(),
  estimatedDurationHours: z.number().nullable().optional(),
  estimatedCost: z.number().nullable().optional(),
  alertDaysBefore: z.number().nullable().optional(),
  alertUsageBefore: z.number().nullable().optional(),
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
            <div className="space-y-2 sm:col-span-2">
              <Label>Plan Adı *</Label>
              <Input
                placeholder="Bakım planı adı"
                {...register("name")}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Bakım Türü *</Label>
              <Controller
                control={control}
                name="maintenanceType"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bakım türü seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MaintenanceTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Tetikleme Türü *</Label>
              <Controller
                control={control}
                name="triggerType"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tetikleme türü seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MaintenanceTriggerTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Trigger Intervals */}
          <div className="grid gap-4 sm:grid-cols-2">
            {showUsageInterval && (
              <div className="space-y-2">
                <Label>Kullanım Aralığı (birim) *</Label>
                <Input
                  type="number"
                  placeholder="Örn: 500"
                  {...register("usageInterval", { valueAsNumber: true })}
                />
                {errors.usageInterval && (
                  <p className="text-sm text-destructive">{errors.usageInterval.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Ürünün ömür birimi cinsinden aralık
                </p>
              </div>
            )}

            {showDayInterval && (
              <div className="space-y-2">
                <Label>Gün Aralığı *</Label>
                <Input
                  type="number"
                  placeholder="Örn: 30"
                  {...register("dayInterval", { valueAsNumber: true })}
                />
                {errors.dayInterval && (
                  <p className="text-sm text-destructive">{errors.dayInterval.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Kaç günde bir bakım yapılacak
                </p>
              </div>
            )}
          </div>

          {/* Estimates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tahmini Süre (saat)</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="Örn: 2"
                {...register("estimatedDurationHours", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tahmini Maliyet</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Örn: 500.00"
                {...register("estimatedCost", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Alerts */}
          <div className="grid gap-4 sm:grid-cols-2">
            {showDayInterval && (
              <div className="space-y-2">
                <Label>Uyarı (gün önce)</Label>
                <Input
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
                <Label>Uyarı (kullanım önce)</Label>
                <Input
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
          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              placeholder="Bakım planı açıklaması"
              {...register("description")}
              rows={3}
            />
          </div>

          {/* Switches */}
          <div className="space-y-4">
            {targetType === "category" && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Alt Kategorilere Miras</Label>
                  <p className="text-sm text-muted-foreground">
                    Bu plan alt kategorilere de uygulanır
                  </p>
                </div>
                <Switch
                  checked={inheritToChildren}
                  onCheckedChange={(checked) => setValue("inheritToChildren", checked)}
                />
              </div>
            )}

            {schedule && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Aktif</Label>
                  <p className="text-sm text-muted-foreground">
                    Plan aktif ve uygulanabilir durumda
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
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
