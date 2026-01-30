import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateProductVariant,
  useUpdateProductVariant,
  useProductVariantForEdit,
} from "@/features/product-variants/hooks"
import type { CategoryAttributeForEdit } from "@/features/category-attributes/api"

const schema = z.object({
  sku: z.string().min(1, "SKU kodu gerekli"),
  priceOverride: z.number().nullable().optional(),
  displayOrder: z.number().min(0),
  notes: z.string().nullable().optional(),
  isActive: z.boolean(),
  variantValues: z.record(z.string(), z.string().min(1, "Değer seçiniz")),
})

type FormData = z.infer<typeof schema>

interface ProductVariantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  variantId: string | null
  variantAttributes: CategoryAttributeForEdit[]
}

export function ProductVariantDialog({
  open,
  onOpenChange,
  productId,
  variantId,
  variantAttributes,
}: ProductVariantDialogProps) {
  const isEditMode = !!variantId
  const { data: editData, isLoading: isLoadingEdit } = useProductVariantForEdit(
    variantId || ""
  )
  const createMutation = useCreateProductVariant()
  const updateMutation = useUpdateProductVariant()

  const defaultVariantValues: Record<string, string> = {}
  variantAttributes.forEach((attr) => {
    defaultVariantValues[attr.id] = ""
  })

  const defaultValues: FormData = {
    sku: "",
    priceOverride: null,
    displayOrder: 0,
    notes: null,
    isActive: true,
    variantValues: defaultVariantValues,
  }

  const editVariantValues: Record<string, string> = { ...defaultVariantValues }
  if (editData?.variantValues) {
    editData.variantValues.forEach((vv) => {
      editVariantValues[vv.categoryAttributeId] = vv.optionValue
    })
  }

  const formValues =
    open && isEditMode && editData
      ? {
          sku: editData.sku,
          priceOverride: editData.priceOverride,
          displayOrder: editData.displayOrder,
          notes: editData.notes,
          isActive: editData.isActive,
          variantValues: editVariantValues,
        }
      : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: FormData) => {
    const variantValues = Object.entries(data.variantValues)
      .filter(([, value]) => value)
      .map(([attributeId, optionValue]) => ({
        categoryAttributeId: attributeId,
        optionValue,
      }))

    try {
      if (isEditMode && variantId) {
        await updateMutation.mutateAsync({
          id: variantId,
          data: {
            sku: data.sku,
            priceOverride: data.priceOverride ?? null,
            displayOrder: data.displayOrder,
            notes: data.notes ?? null,
            isActive: data.isActive,
            variantValues,
          },
        })
      } else {
        await createMutation.mutateAsync({
          productId,
          sku: data.sku,
          priceOverride: data.priceOverride ?? null,
          displayOrder: data.displayOrder,
          notes: data.notes ?? null,
          variantValues,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled in mutation
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Varyant Düzenle" : "Yeni Varyant"}
          </DialogTitle>
          <DialogDescription>
            Varyant bilgilerini doldurun.
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingEdit ? (
          <div className="py-8 text-center text-muted-foreground">
            Yükleniyor...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU Kodu</Label>
              <Input id="sku" {...register("sku")} placeholder="Varyant SKU kodu" />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>

            {/* Varyant Özellikleri */}
            {variantAttributes.map((attr) => {
              const options: string[] = attr.selectOptions
                ? (() => {
                    try {
                      return JSON.parse(attr.selectOptions)
                    } catch {
                      return []
                    }
                  })()
                : []

              return (
                <div key={attr.id} className="space-y-2">
                  <Label>{attr.displayName}</Label>
                  <Controller
                    control={control}
                    name={`variantValues.${attr.id}`}
                    render={({ field }) => (
                      <Select
                        key={`variant-attr-${attr.id}-${field.value}`}
                        value={field.value || "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? "" : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`${attr.displayName} seçiniz`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>
                            {attr.displayName} seçiniz
                          </SelectItem>
                          {options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.variantValues?.[attr.id] && (
                    <p className="text-sm text-destructive">
                      {errors.variantValues[attr.id]?.message}
                    </p>
                  )}
                </div>
              )
            })}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceOverride">Fiyat Geçersiz Kılma</Label>
                <Input
                  id="priceOverride"
                  type="number"
                  step="0.01"
                  {...register("priceOverride", {
                    setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
                  })}
                  placeholder="Boş bırakılırsa ana ürün fiyatı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Sıralama</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register("displayOrder", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Varyant ile ilgili notlar"
              />
            </div>

            {/* Durum (sadece edit modda) */}
            {isEditMode && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="isActive">Durum</Label>
                  <p className="text-sm text-muted-foreground">Varyant aktif mi?</p>
                </div>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
