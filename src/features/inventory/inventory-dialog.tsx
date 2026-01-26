import { useEffect, useMemo, useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useCreateInventory, useUpdateInventory } from "./hooks"
import { InventoryStatus, InventoryStatusLabels, type Inventory } from "./api"
import { useProductSelectWithType } from "@/features/products/hooks"
import { ProductType, ProductTypeLabels } from "@/features/products/api"
import { useWarehouseSelect } from "@/features/warehouses/hooks"

// Validation schema - tip bazlı validation backend'de yapılıyor
const inventorySchema = z.object({
  productId: z.string().min(1, "Ürün seçiniz"),
  warehouseId: z.string().min(1, "Depo seçiniz"),
  status: z.number().min(1, "Durum seçiniz"),
  serialNumber: z.string().default(""),
  quantity: z.number().min(0, "Miktar 0 veya üzeri olmalı"),
  currentUnitValue: z.number().min(0, "Birim değer 0 veya üzeri olmalı"),
  currentLifespan: z.number().nullable().optional(),
  lastMaintenanceDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  notes: z.string().default(""),
  isActive: z.boolean().default(true),
})

type InventoryFormData = z.infer<typeof inventorySchema>

// Tip badge renkleri
const productTypeBadgeVariant: Record<ProductType, "default" | "secondary" | "outline"> = {
  [ProductType.Tracked]: "default",
  [ProductType.Countable]: "secondary",
  [ProductType.Consumable]: "outline",
}

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventory: Inventory | null
}

export function InventoryDialog({
  open,
  onOpenChange,
  inventory,
}: InventoryDialogProps) {
  const createInventory = useCreateInventory()
  const updateInventory = useUpdateInventory()

  // Lookup data
  const { data: products } = useProductSelectWithType()
  const { data: warehouses } = useWarehouseSelect()

  // Info dialog state
  const [showUnitCostInfo, setShowUnitCostInfo] = useState(false)

  const defaultValues: InventoryFormData = {
    productId: "",
    warehouseId: "",
    status: InventoryStatus.Available,
    serialNumber: "",
    quantity: 1,
    currentUnitValue: 0,
    currentLifespan: null,
    lastMaintenanceDate: null,
    expiryDate: null,
    notes: "",
    isActive: true,
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema) as any,
    defaultValues,
  })

  // Seçili ürünü izle
  const watchedProductId = useWatch({ control, name: "productId" })

  // Seçili ürünün bilgilerini al
  const selectedProduct = useMemo(() => {
    if (!watchedProductId || !products) return null
    return products.find(p => p.id === watchedProductId) || null
  }, [watchedProductId, products])

  // Ürün tipi değiştiğinde quantity'yi ayarla (Tracked için 1)
  useEffect(() => {
    if (selectedProduct?.type === ProductType.Tracked) {
      setValue("quantity", 1)
    }
  }, [selectedProduct?.type, setValue])

  // Ürün tipine göre alan görünürlükleri
  const showSerialNumber = selectedProduct?.type !== ProductType.Consumable
  const isSerialNumberRequired = selectedProduct?.type === ProductType.Tracked
  const isQuantityDisabled = selectedProduct?.type === ProductType.Tracked
  // Ömür takibi: Sadece TotalLifespan > 0 ise göster (backend validation ile uyumlu)
  const showLifespanFields = selectedProduct?.type === ProductType.Tracked &&
    selectedProduct?.totalLifespan != null && selectedProduct.totalLifespan > 0
  const showExpiryDate = selectedProduct?.trackExpiryDate === true

  // KURAL: open MUTLAKA dependency'de olmalı
  useEffect(() => {
    if (!open) {
      reset(defaultValues)
      return
    }

    if (inventory) {
      reset({
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        status: inventory.status,
        serialNumber: inventory.serialNumber || "",
        quantity: inventory.quantity,
        currentUnitValue: inventory.currentUnitValue,
        currentLifespan: inventory.currentLifespan,
        lastMaintenanceDate: inventory.lastMaintenanceDate
          ? inventory.lastMaintenanceDate.split("T")[0]
          : null,
        expiryDate: inventory.expiryDate
          ? inventory.expiryDate.split("T")[0]
          : null,
        notes: "",
        isActive: inventory.isActive,
      })
    } else {
      reset(defaultValues)
    }
  }, [open, inventory, reset])

  const onSubmit = async (data: InventoryFormData) => {
    // Client-side validation based on selected product
    let hasError = false

    // Takipli ürünler için seri numarası zorunlu
    if (selectedProduct?.type === ProductType.Tracked && !data.serialNumber?.trim()) {
      setError("serialNumber", { message: "Takipli ürünler için seri numarası zorunludur" })
      hasError = true
    }

    // Ömür takibi olan ürünler için mevcut kullanım zorunlu
    if (selectedProduct?.totalLifespan && selectedProduct.totalLifespan > 0 && data.currentLifespan == null) {
      setError("currentLifespan", { message: "Ömür takibi olan ürünler için mevcut kullanım zorunludur" })
      hasError = true
    }

    // Son kullanma tarihi takibi olan ürünler için SKT zorunlu
    if (selectedProduct?.trackExpiryDate && !data.expiryDate) {
      setError("expiryDate", { message: "Bu ürün için son kullanma tarihi zorunludur" })
      hasError = true
    }

    if (hasError) return

    try {
      if (inventory) {
        await updateInventory.mutateAsync({
          id: inventory.id,
          data: {
            id: inventory.id,
            productId: data.productId,
            warehouseId: data.warehouseId,
            status: data.status,
            serialNumber: data.serialNumber,
            quantity: data.quantity,
            currentUnitValue: data.currentUnitValue,
            currentLifespan: data.currentLifespan || null,
            lastMaintenanceDate: data.lastMaintenanceDate || null,
            expiryDate: data.expiryDate || null,
            notes: data.notes || "",
            isActive: data.isActive,
          },
        })
      } else {
        await createInventory.mutateAsync({
          productId: data.productId,
          warehouseId: data.warehouseId,
          status: data.status,
          serialNumber: data.serialNumber,
          quantity: data.quantity,
          currentUnitValue: data.currentUnitValue,
          currentLifespan: data.currentLifespan || null,
          lastMaintenanceDate: data.lastMaintenanceDate || null,
          expiryDate: data.expiryDate || null,
          notes: data.notes || "",
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createInventory.isPending || updateInventory.isPending

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {inventory ? "Envanter Düzenle" : "Yeni Envanter Kaydı"}
          </DialogTitle>
          <DialogDescription>Envanter bilgilerini girin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ürün *</Label>
              {selectedProduct && (
                <Badge variant={productTypeBadgeVariant[selectedProduct.type]}>
                  {ProductTypeLabels[selectedProduct.type]}
                </Badge>
              )}
            </div>
            <Controller
              control={control}
              name="productId"
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Ürün seçiniz
                    </SelectItem>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <span>{product.name}</span>
                          <Badge
                            variant={productTypeBadgeVariant[product.type]}
                            className="text-xs px-1.5 py-0"
                          >
                            {ProductTypeLabels[product.type]}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.productId && (
              <p className="text-sm text-destructive">{errors.productId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Depo *</Label>
            <Controller
              control={control}
              name="warehouseId"
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Depo seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Depo seçiniz
                    </SelectItem>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.warehouseId && (
              <p className="text-sm text-destructive">{errors.warehouseId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durum *</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(InventoryStatusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Seri Numarası: Tracked için zorunlu, Countable için opsiyonel, Consumable için gizli */}
            {showSerialNumber && (
              <div className="space-y-2">
                <Label>
                  Seri Numarası {isSerialNumberRequired && "*"}
                </Label>
                <Input placeholder="SN-001" {...register("serialNumber")} />
                {errors.serialNumber && (
                  <p className="text-sm text-destructive">{errors.serialNumber.message}</p>
                )}
                {isSerialNumberRequired && !errors.serialNumber && (
                  <p className="text-xs text-muted-foreground">
                    Takipli ürünler için zorunlu
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={`grid gap-4 ${isQuantityDisabled ? "grid-cols-1" : "grid-cols-2"}`}>
            {/* Miktar: Takipli ürünlerde gizli (her zaman 1) */}
            {!isQuantityDisabled && (
              <div className="space-y-2">
                <Label>Miktar *</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="1"
                  {...register("quantity", { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">{errors.quantity.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1">
                <Label>Birim Maliyet (₺)</Label>
                <button
                  type="button"
                  onClick={() => setShowUnitCostInfo(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("currentUnitValue", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Ömür takibi alanları: Sadece TotalLifespan > 0 olan Tracked ürünler için */}
          {showLifespanFields && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Mevcut Kullanım *
                  {selectedProduct?.lifespanUnitTypeName && (
                    <span className="text-muted-foreground ml-1">
                      ({selectedProduct.lifespanUnitTypeName})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  {...register("currentLifespan", { valueAsNumber: true })}
                />
                {errors.currentLifespan && (
                  <p className="text-sm text-destructive">{errors.currentLifespan.message}</p>
                )}
                {selectedProduct?.totalLifespan && selectedProduct.totalLifespan > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Toplam ömür: {selectedProduct.totalLifespan} {selectedProduct.lifespanUnitTypeName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Son Bakım Tarihi</Label>
                <Input type="date" {...register("lastMaintenanceDate")} />
              </div>
            </div>
          )}

          {showExpiryDate && (
            <div className="space-y-2">
              <Label>Son Kullanma Tarihi *</Label>
              <Input type="date" {...register("expiryDate")} />
              {errors.expiryDate && (
                <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea placeholder="Ek notlar..." {...register("notes")} rows={3} />
          </div>

          {inventory && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Kayıt Durumu</Label>
                <p className="text-sm text-muted-foreground">
                  Envanter kaydının aktif/pasif durumu
                </p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${field.value ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      {field.value ? "Aktif" : "Pasif"}
                    </span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />
            </div>
          )}

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {inventory ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Birim Maliyet Bilgi Dialogu */}
    <Dialog open={showUnitCostInfo} onOpenChange={setShowUnitCostInfo}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Birim Maliyet Hakkında</DialogTitle>
          <DialogDescription>
            Bu envanter kaydının birim başına mali değeri
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Ne İşe Yarar?</h4>
            <p className="text-muted-foreground">
              Envanterdeki her bir birimin güncel mali değerini belirtir. Bu değer envanter
              değerleme raporları, amortisman takibi ve sigorta hesaplamalarında kullanılır.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-1">Ürün Tipine Göre Kullanım</h4>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <strong>Takipli Ürünler:</strong> Ekipmanın alış fiyatı veya amortisman
                sonrası güncel değeri. Örneğin 50.000₺'ye alınan bir jeneratörün 2 yıl
                sonraki değeri 35.000₺ olabilir.
              </li>
              <li>
                <strong>Sayılabilir/Sarf Malzemeler:</strong> Birim başına maliyet.
                Örneğin 1 adet vidanın maliyeti 2₺ ise, 100 adetlik stokun toplam
                değeri 200₺ olarak hesaplanır.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-1">Örnek Kullanım Alanları</h4>
            <ul className="text-muted-foreground list-disc list-inside space-y-1">
              <li>Envanter değerleme raporları</li>
              <li>Amortisman takibi</li>
              <li>Sigorta değer hesaplamaları</li>
              <li>Kayıp/hasar tazminat hesabı</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowUnitCostInfo(false)}>
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
