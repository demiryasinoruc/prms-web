import { useForm, Controller, useFieldArray } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Loader2, Plus, Trash2, AlertTriangle, ArrowUpRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DatePicker } from "@/components/shared/date-picker"
import { WarehouseSelect } from "@/components/shared/warehouse-select"
import { useWarehouseSelect } from "@/features/warehouses/hooks"
import {
  useCreateWarehouseTransfer,
  useUpdateWarehouseTransfer,
  useWarehouseTransferForEdit,
  useTransferInventorySelect,
} from "./hooks"

const transferItemSchema = z.object({
  inventoryId: z.string().min(1, "Envanter seçiniz"),
  quantity: z.number().gt(0, "Miktar 0'dan büyük olmalıdır"),
  notes: z.string().max(1000, "Not en fazla 1000 karakter olabilir").default(""),
})

const transferSchema = z
  .object({
    sourceWarehouseId: z.string().min(1, "Kaynak depo seçiniz"),
    destinationWarehouseId: z.string().min(1, "Hedef depo seçiniz"),
    plannedDate: z.string().min(1, "Planlı tarih zorunludur"),
    notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").default(""),
    items: z.array(transferItemSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (
      data.sourceWarehouseId &&
      data.destinationWarehouseId &&
      data.sourceWarehouseId === data.destinationWarehouseId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destinationWarehouseId"],
        message: "Hedef depo kaynak depodan farklı olmalıdır",
      })
    }
    if (data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "En az bir transfer kalemi eklenmelidir",
      })
    }
  })

type TransferFormData = z.infer<typeof transferSchema>

const defaultValues: TransferFormData = {
  sourceWarehouseId: "",
  destinationWarehouseId: "",
  plannedDate: "",
  notes: "",
  items: [],
}

// Tek kalem satırı — kaynak depoya göre filtrelenmiş envanter select'i
function TransferItemRow({
  index,
  sourceWarehouseId,
  inventoryValue,
  onInventoryChange,
  error,
  register,
  onRemove,
}: {
  index: number
  sourceWarehouseId: string | null | undefined
  inventoryValue: string | null | undefined
  onInventoryChange: (value: string) => void
  error?: string
  register: ReturnType<typeof useForm<TransferFormData>>["register"]
  onRemove: () => void
}) {
  const { data: inventories } = useTransferInventorySelect(sourceWarehouseId)

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">Kalem {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onRemove}
          title="Kalemi sil"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2 sm:col-span-2">
          <Label>Envanter *</Label>
          <Select
            key={`inv-${inventoryValue}`}
            value={inventoryValue || "none"}
            onValueChange={(v) => onInventoryChange(v === "none" ? "" : v)}
            disabled={!sourceWarehouseId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  sourceWarehouseId ? "Envanter seçiniz" : "Önce kaynak depo seçiniz"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>
                Envanter seçiniz
              </SelectItem>
              {inventories?.map((inv) => (
                <SelectItem key={inv.id} value={inv.id}>
                  {inv.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sourceWarehouseId && inventories && inventories.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Kaynak depoda müsait envanter bulunamadı
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="space-y-2">
          <Label>Miktar *</Label>
          <Input
            type="number"
            step="any"
            min={0}
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Kalem Notu</Label>
        <Input placeholder="İsteğe bağlı not" {...register(`items.${index}.notes`)} />
      </div>
    </div>
  )
}

interface WarehouseTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string | null
}

export function WarehouseTransferDialog({
  open,
  onOpenChange,
  editId,
}: WarehouseTransferDialogProps) {
  const isEditMode = !!editId
  const createTransfer = useCreateWarehouseTransfer()
  const updateTransfer = useUpdateWarehouseTransfer()
  const { data: warehouses } = useWarehouseSelect()
  // Transfer için en az 2 depo gerekir. Tek depo varsa (genelde plan kısıtı)
  // select'ler sessizce pasif kalacağından, bunun yerine açık bir uyarı gösteririz.
  const hasEnoughWarehouses = (warehouses?.length ?? 0) >= 2
  const { data: editData, isLoading: isLoadingEdit } = useWarehouseTransferForEdit(
    editId || null,
  )

  const formValues: TransferFormData =
    open && isEditMode && editData
      ? {
          sourceWarehouseId: editData.sourceWarehouseId,
          destinationWarehouseId: editData.destinationWarehouseId,
          plannedDate: editData.plannedDate ? editData.plannedDate.split("T")[0] : "",
          notes: editData.notes || "",
          items: editData.items.map((item) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            notes: item.notes || "",
          })),
        }
      : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: formResolver<TransferFormData>(transferSchema),
    values: open ? formValues : defaultValues,
  })

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: "items",
  })

  const watchedSourceWarehouseId = watch("sourceWarehouseId")
  const watchedItems = watch("items")

  const onSubmit = async (data: TransferFormData) => {
    try {
      if (isEditMode && editId) {
        await updateTransfer.mutateAsync({
          id: editId,
          data: {
            sourceWarehouseId: data.sourceWarehouseId,
            destinationWarehouseId: data.destinationWarehouseId,
            plannedDate: `${data.plannedDate}T00:00:00`,
            notes: data.notes,
            items: data.items,
          },
        })
      } else {
        await createTransfer.mutateAsync({
          sourceWarehouseId: data.sourceWarehouseId,
          destinationWarehouseId: data.destinationWarehouseId,
          plannedDate: `${data.plannedDate}T00:00:00`,
          notes: data.notes,
          items: data.items,
        })
      }
      onOpenChange(false)
    } catch {
      // Hata mutation tarafından ele alınıyor
    }
  }

  const isSubmitting = createTransfer.isPending || updateTransfer.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Transfer Düzenle" : "Yeni Depo Transferi"}
          </DialogTitle>
          <DialogDescription>
            Depolar arası stok transferi oluşturun ve kalemlerini ekleyin
          </DialogDescription>
        </DialogHeader>

        {!isEditMode && !hasEnoughWarehouses ? (
          <div className="space-y-4">
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Transfer için en az 2 depo gerekir</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Depo transferi için en az 2 depo gerekir. Mevcut planınız tek
                  depoya izin veriyor olabilir — çoklu depo için Pro pakete
                  yükseltin.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-amber-400 bg-white/60 text-amber-900 hover:bg-white dark:bg-transparent dark:text-amber-200"
                >
                  <Link to="/settings/subscription">
                    Paketi Yükselt
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Kapat
              </Button>
            </div>
          </div>
        ) : isEditMode && isLoadingEdit ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                control={control}
                name="sourceWarehouseId"
                render={({ field }) => (
                  <WarehouseSelect
                    label="Kaynak Depo *"
                    required
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v || "")
                      // Kaynak depo değişince mevcut kalem envanterlerini temizle
                      watchedItems?.forEach((_, idx) => {
                        setValue(`items.${idx}.inventoryId`, "")
                      })
                    }}
                    error={errors.sourceWarehouseId?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="destinationWarehouseId"
                render={({ field }) => (
                  <WarehouseSelect
                    label="Hedef Depo *"
                    required
                    value={field.value}
                    onChange={(v) => field.onChange(v || "")}
                    error={errors.destinationWarehouseId?.message}
                  />
                )}
              />

              <div className="space-y-2">
                <Label>Planlı Tarih *</Label>
                <Controller
                  control={control}
                  name="plannedDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Transfer tarihi seçiniz"
                    />
                  )}
                />
                {errors.plannedDate && (
                  <p className="text-sm text-destructive">{errors.plannedDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                placeholder="Transfer ile ilgili notlar..."
                rows={2}
                {...register("notes")}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Transfer Kalemleri *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendItem({ inventoryId: "", quantity: 1, notes: "" })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Kalem Ekle
                </Button>
              </div>

              {itemFields.length === 0 && (
                <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
                  Henüz kalem eklenmedi. "Kalem Ekle" ile envanter satırı ekleyin.
                </p>
              )}

              {itemFields.map((fieldItem, index) => (
                <Controller
                  key={fieldItem.id}
                  control={control}
                  name={`items.${index}.inventoryId`}
                  render={({ field }) => (
                    <TransferItemRow
                      index={index}
                      sourceWarehouseId={watchedSourceWarehouseId}
                      inventoryValue={field.value}
                      onInventoryChange={field.onChange}
                      error={errors.items?.[index]?.inventoryId?.message}
                      register={register}
                      onRemove={() => removeItem(index)}
                    />
                  )}
                />
              ))}

              {errors.items?.message && (
                <p className="text-sm text-destructive">{errors.items.message}</p>
              )}
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
