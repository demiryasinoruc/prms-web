import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { DatePicker } from "@/components/shared/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateMaintenanceRecord,
  useUpdateMaintenanceRecord,
  useMaintenanceRecordForEdit,
} from "./hooks"
import {
  MaintenanceType,
  MaintenanceStatus,
  MaintenanceTypeLabels,
  MaintenanceStatusLabels,
  type MaintenanceRecord,
} from "./api"
import { useInventorySelect, useInventoryDetail } from "@/features/inventory/hooks"
import { useEmployeeSelect } from "@/features/employees/hooks"
import { AttachmentSection } from "@/features/attachments/attachment-section"

const maintenanceRecordSchema = z.object({
  inventoryId: z.string().min(1, "Envanter seçimi zorunlu"),
  maintenanceScheduleId: z.string().nullable(),
  maintenanceType: z.nativeEnum(MaintenanceType),
  status: z.nativeEnum(MaintenanceStatus),
  title: z.string().min(1, "Başlık zorunludur").max(200, "Başlık en fazla 200 karakter olabilir"),
  description: z.string().max(1000, "Açıklama en fazla 1000 karakter olabilir").optional(),
  scheduledDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  lifespanAtMaintenance: z.number().min(0, "Bakım anındaki ömür 0 veya daha büyük olmalıdır").nullable().optional(),
  performedByEmployeeId: z.string().nullable().optional(),
  performedByExternal: z.string().max(500, "En fazla 500 karakter olabilir").nullable().optional(),
  totalCost: z.number().min(0, "Toplam maliyet 0 veya daha büyük olmalıdır").nullable().optional(),
  laborCost: z.number().min(0, "İşçilik maliyeti 0 veya daha büyük olmalıdır").nullable().optional(),
  partsCost: z.number().min(0, "Parça maliyeti 0 veya daha büyük olmalıdır").nullable().optional(),
  nextScheduledDate: z.string().nullable().optional(),
  nextScheduledLifespan: z.number().min(0, "Sonraki planlanan ömür 0 veya daha büyük olmalıdır").nullable().optional(),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").nullable().optional(),
})

type MaintenanceRecordFormData = z.infer<typeof maintenanceRecordSchema>

interface MaintenanceRecordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: MaintenanceRecord | null
}

const defaultValues: MaintenanceRecordFormData = {
  inventoryId: "",
  maintenanceScheduleId: null,
  maintenanceType: MaintenanceType.Preventive,
  status: MaintenanceStatus.Scheduled,
  title: "",
  description: "",
  scheduledDate: null,
  startDate: null,
  completedDate: null,
  lifespanAtMaintenance: null,
  performedByEmployeeId: null,
  performedByExternal: null,
  totalCost: null,
  laborCost: null,
  partsCost: null,
  nextScheduledDate: null,
  nextScheduledLifespan: null,
  notes: null,
}

export function MaintenanceRecordDialog({
  open,
  onOpenChange,
  record,
}: MaintenanceRecordDialogProps) {
  const createRecord = useCreateMaintenanceRecord()
  const updateRecord = useUpdateMaintenanceRecord()

  const { data: editData, isLoading: isLoadingEdit, isFetching: isFetchingEdit } = useMaintenanceRecordForEdit(
    open && record ? record.id : null
  )

  const { data: inventoryItems, isLoading: isLoadingInventory } = useInventorySelect()
  const { data: employees, isLoading: isLoadingEmployees } = useEmployeeSelect()

  // Verinin doğru kayda ait olup olmadığını kontrol et
  const hasCorrectData = record
    ? editData?.id?.toLowerCase() === record.id.toLowerCase()
    : true

  const [performerType, setPerformerType] = useState<"employee" | "external">("employee")

  const formValues: MaintenanceRecordFormData = (open && record && editData && hasCorrectData)
    ? {
        inventoryId: editData.inventoryId?.toLowerCase() || "",
        maintenanceScheduleId: editData.maintenanceScheduleId?.toLowerCase() || null,
        maintenanceType: editData.maintenanceType,
        status: editData.status,
        title: editData.title,
        description: editData.description || "",
        scheduledDate: editData.scheduledDate ? editData.scheduledDate.split("T")[0] : null,
        startDate: editData.startDate ? editData.startDate.split("T")[0] : null,
        completedDate: editData.completedDate ? editData.completedDate.split("T")[0] : null,
        lifespanAtMaintenance: editData.lifespanAtMaintenance,
        performedByEmployeeId: editData.performedByEmployeeId?.toLowerCase() || null,
        performedByExternal: editData.performedByExternal,
        totalCost: editData.totalCost,
        laborCost: editData.laborCost,
        partsCost: editData.partsCost,
        nextScheduledDate: editData.nextScheduledDate ? editData.nextScheduledDate.split("T")[0] : null,
        nextScheduledLifespan: editData.nextScheduledLifespan,
        notes: editData.notes,
      }
    : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaintenanceRecordFormData>({
    resolver: formResolver<MaintenanceRecordFormData>(maintenanceRecordSchema),
    values: open && hasCorrectData ? formValues : defaultValues,
  })

  const status = watch("status")
  const inventoryId = watch("inventoryId")

  // Seçili envanterin detayını getir (ömür takibi kontrolü için)
  const { data: selectedInventory } = useInventoryDetail(inventoryId || null)

  const hasLifespanTracking = selectedInventory?.lifespanUnitTypeName != null

  // Set performer type based on edit data
  // hasCorrectData kontrolü: Sadece doğru kayda ait veri geldiğinde performerType'ı güncelle
  useEffect(() => {
    if (open && editData && hasCorrectData) {
      if (editData.performedByEmployeeId) {
        setPerformerType("employee")
      } else if (editData.performedByExternal) {
        setPerformerType("external")
      } else {
        // Neither set, default to employee
        setPerformerType("employee")
      }
    } else if (!open) {
      setPerformerType("employee")
    }
  }, [open, editData, hasCorrectData])

  // Handle performer type change
  const handlePerformerTypeChange = (type: "employee" | "external") => {
    setPerformerType(type)
    if (type === "employee") {
      setValue("performedByExternal", null)
    } else {
      setValue("performedByEmployeeId", null)
    }
  }

  const onSubmit = async (data: MaintenanceRecordFormData) => {
    try {
      const requestData = {
        inventoryId: data.inventoryId,
        maintenanceScheduleId: data.maintenanceScheduleId,
        maintenanceType: data.maintenanceType,
        status: data.status,
        title: data.title,
        description: data.description || "",
        scheduledDate: data.scheduledDate || null,
        startDate: data.startDate || null,
        completedDate: data.completedDate || null,
        lifespanAtMaintenance: data.lifespanAtMaintenance ?? null,
        performedByEmployeeId: performerType === "employee" ? (data.performedByEmployeeId || null) : null,
        performedByExternal: performerType === "external" ? (data.performedByExternal || null) : null,
        totalCost: data.totalCost ?? null,
        laborCost: data.laborCost ?? null,
        partsCost: data.partsCost ?? null,
        nextScheduledDate: data.nextScheduledDate || null,
        nextScheduledLifespan: data.nextScheduledLifespan ?? null,
        notes: data.notes || null,
      }

      if (record) {
        await updateRecord.mutateAsync({
          id: record.id,
          data: requestData,
        })
      } else {
        await createRecord.mutateAsync(requestData)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createRecord.isPending || updateRecord.isPending

  // Edit modunda tüm veriler yüklenene kadar bekle
  // hasCorrectData: Verinin doğru kayda ait olup olmadığını kontrol eder (kayıt değiştiğinde eski veriyi göstermeyi önler)
  const isLoadingData = record
    ? (isLoadingEdit || isFetchingEdit || isLoadingInventory || isLoadingEmployees || !hasCorrectData)
    : (isLoadingInventory || isLoadingEmployees)

  if (isLoadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yükleniyor</DialogTitle>
            <DialogDescription>Bakım kaydı bilgileri yükleniyor...</DialogDescription>
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
          <DialogTitle className="flex items-center gap-2">
            {record ? "Bakım Kaydı Düzenle" : "Yeni Bakım Kaydı"}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>
                    Bakım kaydı, envanter öğelerine yapılan bakım işlemlerini takip eder.
                    Periyodik bakımlar, arıza giderme, muayene ve kalibrasyon gibi işlemleri
                    kayıt altına alarak bakım geçmişini ve maliyetlerini izlemenizi sağlar.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
          <DialogDescription>
            Bakım kaydı bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Envanter *</Label>
              <Controller
                control={control}
                name="inventoryId"
                render={({ field }) => (
                  <Select
                    key={`inventory-${field.value}`}
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Envanter seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Envanter seçiniz</SelectItem>
                      {inventoryItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id.toLowerCase()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.inventoryId && (
                <p className="text-sm text-destructive">{errors.inventoryId.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <FormField
                label="Başlık *"
                placeholder="Bakım kaydı başlığı"
                {...register("title")}
                autoFocus
                error={errors.title?.message}
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

            {record && (
              <FormSelectField
                label="Durum *"
                name="status"
                control={control}
                valueType="number"
                options={Object.entries(MaintenanceStatusLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                placeholder="Durum seçiniz"
              />
            )}
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Planlanan Tarih</Label>
              <Controller
                control={control}
                name="scheduledDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Planlanan tarih"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Başlangıç tarihi"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Tamamlanma Tarihi</Label>
              <Controller
                control={control}
                name="completedDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Tamamlanma tarihi"
                  />
                )}
              />
            </div>
          </div>

          {/* Performer */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bakımı Yapan</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={performerType === "employee" ? "default" : "outline"}
                  onClick={() => handlePerformerTypeChange("employee")}
                  className="flex-1"
                  size="sm"
                >
                  Personel
                </Button>
                <Button
                  type="button"
                  variant={performerType === "external" ? "default" : "outline"}
                  onClick={() => handlePerformerTypeChange("external")}
                  className="flex-1"
                  size="sm"
                >
                  Dış Kaynak
                </Button>
              </div>
            </div>

            {performerType === "employee" ? (
              <div className="space-y-2">
                <Label>Personel</Label>
                <Controller
                  control={control}
                  name="performedByEmployeeId"
                  render={({ field }) => (
                    <Select
                      key={`employee-${field.value}`}
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Personel seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Personel seçiniz</SelectItem>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toLowerCase()}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : (
              <FormField
                label="Dış Kaynak Adı"
                placeholder="Firma/kişi adı"
                {...register("performedByExternal")}
              />
            )}
          </div>

          {/* Costs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="İşçilik Maliyeti"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("laborCost", { valueAsNumber: true })}
            />

            <FormField
              label="Parça Maliyeti"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("partsCost", { valueAsNumber: true })}
            />

            <FormField
              label="Toplam Maliyet"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("totalCost", { valueAsNumber: true })}
            />
          </div>

          {/* Lifespan - Sadece ömür takibi olan ürünler için */}
          {hasLifespanTracking && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FormField
                  label={`Bakım Anındaki Ömür (${selectedInventory?.lifespanUnitTypeName})`}
                  type="number"
                  step="0.01"
                  placeholder="Örn: 500"
                  {...register("lifespanAtMaintenance", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Bakım yapıldığında ürünün kullanım değeri
                </p>
              </div>
            </div>
          )}

          {/* Next Schedule */}
          {status === MaintenanceStatus.Completed && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sonraki Bakım Tarihi</Label>
                <Controller
                  control={control}
                  name="nextScheduledDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sonraki bakım tarihi"
                    />
                  )}
                />
              </div>

              {hasLifespanTracking && (
                <FormField
                  label={`Sonraki Bakım Ömrü (${selectedInventory?.lifespanUnitTypeName})`}
                  type="number"
                  step="0.01"
                  placeholder="Örn: 1000"
                  {...register("nextScheduledLifespan", { valueAsNumber: true })}
                />
              )}
            </div>
          )}

          {/* Description & Notes */}
          <FormField
            label="Açıklama"
            placeholder="Bakım detayları"
            {...register("description")}
            multiline
            rows={3}
          />

          <FormField
            label="Notlar"
            placeholder="Ek notlar"
            {...register("notes")}
            multiline
            rows={2}
          />

          {record && (
            <AttachmentSection
              entityType="MaintenanceRecord"
              entityId={record.id}
              description="Bakım faturası, fotoğraflar, rapor (jpg, png, webp, pdf — max 10 MB)"
            />
          )}

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
              {record ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
