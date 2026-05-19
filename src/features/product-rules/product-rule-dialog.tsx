import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2, Copy, Shuffle } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  ProductRuleType,
  ProductRuleTypeLabels,
  ProductRuleBehavior,
  ProductRuleBehaviorLabels,
} from "./api"
import { useCreateProductRule, useUpdateProductRule, useProductRuleDetail } from "./hooks"
import { useProductSelect } from "@/features/products/hooks"
import { useCategorySelect } from "@/features/categories/hooks"
import { useExtraServiceSelect } from "@/features/extra-services/hooks"

const productRuleSchema = z.object({
  sourceProductId: z.string().min(1, "Kaynak ürün seçiniz"),
  type: z.nativeEnum(ProductRuleType),
  behavior: z.nativeEnum(ProductRuleBehavior),
  targetProductId: z.string().nullable().optional(),
  targetCategoryId: z.string().nullable().optional(),
  targetServiceId: z.string().nullable().optional(),
  quantity: z.number().min(0.01, "Miktar en az 0.01 olmalı"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  ruleGroupId: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type === ProductRuleType.Direct || data.type === ProductRuleType.Ratio) {
    if (!data.targetProductId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetProductId"],
        message: "Hedef ürün seçiniz",
      })
    }
  } else if (data.type === ProductRuleType.FromGroup) {
    if (!data.targetCategoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetCategoryId"],
        message: "Hedef kategori seçiniz",
      })
    }
  } else if (data.type === ProductRuleType.RequiresService) {
    if (!data.targetServiceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetServiceId"],
        message: "Hedef ek hizmet seçiniz",
      })
    }
  }
})

type ProductRuleFormData = z.infer<typeof productRuleSchema>

interface ProductRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string | null
}

const defaultValues: ProductRuleFormData = {
  sourceProductId: "",
  type: ProductRuleType.Direct,
  behavior: ProductRuleBehavior.Suggested,
  targetProductId: null,
  targetCategoryId: null,
  targetServiceId: null,
  quantity: 1,
  description: "",
  isActive: true,
  ruleGroupId: null,
}

export function ProductRuleDialog({ open, onOpenChange, editId }: ProductRuleDialogProps) {
  const isEditMode = !!editId
  const createRule = useCreateProductRule()
  const updateRule = useUpdateProductRule()
  const { data: editData, isLoading: isLoadingEdit } = useProductRuleDetail(editId || null)

  // Lookup data
  const { data: products, isLoading: isLoadingProducts } = useProductSelect()
  const { data: categories, isLoading: isLoadingCategories } = useCategorySelect()
  const { data: extraServices, isLoading: isLoadingServices } = useExtraServiceSelect()

  const isLoadingLookups = isLoadingProducts || isLoadingCategories || isLoadingServices

  const formValues: ProductRuleFormData = (open && isEditMode && editData) ? {
    sourceProductId: editData.sourceProductId,
    type: editData.type,
    behavior: editData.behavior,
    targetProductId: editData.targetProductId,
    targetCategoryId: editData.targetCategoryId,
    targetServiceId: editData.targetServiceId,
    quantity: editData.quantity,
    description: editData.description || "",
    isActive: editData.isActive,
    ruleGroupId: editData.ruleGroupId,
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductRuleFormData>({
    resolver: formResolver<ProductRuleFormData>(productRuleSchema),
    values: open ? formValues : defaultValues,
  })

  const watchedType = watch("type")
  const watchedSourceProductId = watch("sourceProductId")

  // Tip değiştiğinde diğer hedef alanlarını temizle
  useEffect(() => {
    if (watchedType === ProductRuleType.FromGroup) {
      setValue("targetProductId", null)
      setValue("targetServiceId", null)
    } else if (watchedType === ProductRuleType.RequiresService) {
      setValue("targetProductId", null)
      setValue("targetCategoryId", null)
      // RequiresService için miktar gerekmiyor, sabit 1 olarak gönderilir
      setValue("quantity", 1)
    } else {
      setValue("targetCategoryId", null)
      setValue("targetServiceId", null)
    }
  }, [watchedType, setValue])

  // Yeni GUID oluştur
  const generateGuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const handleGenerateGroupId = () => {
    setValue("ruleGroupId", generateGuid())
  }

  const handleCopyGroupId = () => {
    const groupId = watch("ruleGroupId")
    if (groupId) {
      navigator.clipboard.writeText(groupId)
    }
  }

  const onSubmit = async (data: ProductRuleFormData) => {
    try {
      if (isEditMode && editId) {
        await updateRule.mutateAsync({
          id: editId,
          data: {
            sourceProductId: data.sourceProductId,
            type: data.type,
            behavior: data.behavior,
            targetProductId: data.targetProductId,
            targetCategoryId: data.targetCategoryId,
            targetServiceId: data.targetServiceId,
            quantity: data.quantity,
            description: data.description,
            isActive: data.isActive,
            ruleGroupId: data.ruleGroupId || null,
          },
        })
      } else {
        await createRule.mutateAsync({
          sourceProductId: data.sourceProductId,
          type: data.type,
          behavior: data.behavior,
          targetProductId: data.targetProductId,
          targetCategoryId: data.targetCategoryId,
          targetServiceId: data.targetServiceId,
          quantity: data.quantity,
          description: data.description,
          ruleGroupId: data.ruleGroupId || null,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createRule.isPending || updateRule.isPending
  const isLoading = (isEditMode && isLoadingEdit) || isLoadingLookups

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Kural Düzenle" : "Yeni Kural"}</DialogTitle>
            <DialogDescription>Yükleniyor...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Hedef ürün listesinde kaynak ürünü gösterme
  const filteredProducts = products?.filter(p => p.id !== watchedSourceProductId) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Kural Düzenle" : "Yeni Kural"}</DialogTitle>
          <DialogDescription>
            Ürün bağımlılık kuralı tanımlayın
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Kaynak Ürün */}
          <div className="space-y-2">
            <Label>Kaynak Ürün *</Label>
            <Controller
              control={control}
              name="sourceProductId"
              render={({ field }) => (
                <Select
                  key={`source-${field.value}`}
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
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sourceProductId && (
              <p className="text-sm text-destructive">{errors.sourceProductId.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Bu ürün eklendiğinde kural tetiklenecek
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Kural Tipi */}
            <div className="space-y-2">
              <Label>Kural Tipi *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select
                    key={`type-${field.value}`}
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ProductRuleTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Davranış */}
            <div className="space-y-2">
              <Label>Davranış *</Label>
              <Controller
                control={control}
                name="behavior"
                render={({ field }) => (
                  <Select
                    key={`behavior-${field.value}`}
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ProductRuleBehaviorLabels).map(([value, label]) => (
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

          {/* Hedef Ürün (Direct veya Ratio için) */}
          {(watchedType === ProductRuleType.Direct || watchedType === ProductRuleType.Ratio) && (
            <div className="space-y-2">
              <Label>Hedef Ürün *</Label>
              <Controller
                control={control}
                name="targetProductId"
                render={({ field }) => (
                  <Select
                    key={`target-product-${field.value}`}
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ürün seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Ürün seçiniz
                      </SelectItem>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetProductId && (
                <p className="text-sm text-destructive">{errors.targetProductId.message}</p>
              )}
            </div>
          )}

          {/* Hedef Ek Hizmet (RequiresService için) */}
          {watchedType === ProductRuleType.RequiresService && (
            <div className="space-y-2">
              <Label>Hedef Ek Hizmet *</Label>
              <Controller
                control={control}
                name="targetServiceId"
                render={({ field }) => (
                  <Select
                    key={`target-service-${field.value}`}
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ek hizmet seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Ek hizmet seçiniz
                      </SelectItem>
                      {extraServices?.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetServiceId && (
                <p className="text-sm text-destructive">{errors.targetServiceId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Kaynak ürün kiralandığında bu ek hizmetin de seçilmesi gerekli olacak
              </p>
            </div>
          )}

          {/* Hedef Kategori (FromGroup için) */}
          {watchedType === ProductRuleType.FromGroup && (
            <div className="space-y-2">
              <Label>Hedef Kategori *</Label>
              <Controller
                control={control}
                name="targetCategoryId"
                render={({ field }) => (
                  <Select
                    key={`target-category-${field.value}`}
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Kategori seçiniz
                      </SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetCategoryId && (
                <p className="text-sm text-destructive">{errors.targetCategoryId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Bu kategoriden en az bir ürün seçilmeli
              </p>
            </div>
          )}

          {/* Miktar — RequiresService dışındaki tipler için */}
          {watchedType !== ProductRuleType.RequiresService && (
            <div className="space-y-2">
              <Label>
                {watchedType === ProductRuleType.Ratio ? "Oran (Kaynak başına)" : "Miktar"} *
              </Label>
              <Input
                type="number"
                step="0.01"
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {watchedType === ProductRuleType.Ratio
                  ? "Her 1 kaynak ürün için kaç hedef ürün gerekli"
                  : "Eklenmesi gereken miktar"}
              </p>
            </div>
          )}

          {/* Açıklama */}
          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              placeholder="Kural açıklaması..."
              {...register("description")}
              rows={2}
            />
          </div>

          {/* VEYA Grubu */}
          <div className="space-y-2">
            <Label>VEYA Grubu (Opsiyonel)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Grup ID (boş bırakılabilir)"
                {...register("ruleGroupId")}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGenerateGroupId}
                title="Yeni grup ID oluştur"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyGroupId}
                disabled={!watch("ruleGroupId")}
                title="Grup ID'yi kopyala"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Aynı grup ID'sine sahip kurallar VEYA mantığıyla çalışır. Birinden biri karşılandığında diğerleri gerekmez.
            </p>
          </div>

          {/* Durum (sadece düzenleme modunda) */}
          {isEditMode && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Durum</Label>
                <p className="text-xs text-muted-foreground">
                  Kuralın aktif olup olmadığı
                </p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          {/* Kural Özeti */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">Kural Özeti:</p>
            <p className="text-muted-foreground">
              {(watchedSourceProductId && products?.find(p => p.id === watchedSourceProductId)?.name) || "[Kaynak Ürün]"}
              {" "}eklendiğinde,{" "}
              {watchedType === ProductRuleType.RequiresService ? (
                <>
                  {(watch("targetServiceId") && extraServices?.find(s => s.id === watch("targetServiceId"))?.name) || "[Hizmet]"}
                  {" "}ek hizmeti{" "}
                </>
              ) : watchedType === ProductRuleType.FromGroup ? (
                <>
                  {(watch("targetCategoryId") && categories?.find(c => c.id === watch("targetCategoryId"))?.name) || "[Kategori]"}
                  {" "}kategorisinden{" "}
                  {watch("quantity") || 0} adet{" "}
                </>
              ) : (
                <>
                  {(watch("targetProductId") && filteredProducts?.find(p => p.id === watch("targetProductId"))?.name) || "[Hedef Ürün]"}
                  {" "}{watch("quantity") || 0} adet{" "}
                </>
              )}
              {watch("behavior") === ProductRuleBehavior.Required && "zorunlu olarak eklenmeli"}
              {watch("behavior") === ProductRuleBehavior.Suggested && "önerilecek"}
              {watch("behavior") === ProductRuleBehavior.Automatic && "otomatik eklenecek"}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
