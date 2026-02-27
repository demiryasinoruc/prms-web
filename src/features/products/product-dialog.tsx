import { useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, HelpCircle, Package, Layers, Droplets, Timer, AlertTriangle, RefreshCw, Tag, Calculator, Users, FolderTree, Boxes, Ruler, SquareStack } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCreateProduct,
  useUpdateProduct,
  useProductForEdit,
  useUnitTypeSelect,
  usePricePeriodSelect,
  useCurrencySelect,
  useLifespanUnitTypeSelect,
} from "./hooks"
import { useCompanySettings } from "@/features/settings/hooks"
import { useCategorySelectByParent } from "@/features/categories/hooks"
import { useCategoryAttributesByCategory } from "@/features/category-attributes/hooks"
import { DynamicAttributeField } from "@/components/dynamic-attribute-field"
import { ProductType, ProductTypeLabels, type Product, type ProductAttributeValue } from "./api"
import { ProductVariantManager } from "./product-variant-manager"

const productSchema = z.object({
  type: z.number(),
  name: z.string().min(1, "Ürün adı zorunlu"),
  description: z.string().optional().default(""),
  productCode: z.string().min(1, "Ürün kodu zorunlu"),
  minimumStockLevel: z.number().min(0, "Minimum stok 0 veya üzeri olmalı"),
  basePrice: z.number().min(0, "Fiyat 0 veya üzeri olmalı"),
  pricePeriodId: z.number().min(1, "Fiyat periyodu seçiniz"),
  currencyId: z.number().min(1, "Para birimi seçiniz"),
  totalLifespan: z.number().nullable().optional(),
  lifespanUnitTypeId: z.number().nullable().optional(),
  categoryId: z.string().min(1, "Kategori seçiniz"),
  unitTypeId: z.number().min(1, "Birim tipi seçiniz"),
  trackExpiryDate: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional().default(""),
}).refine(
  (data) => {
    // Ömür birim tipi seçilmişse, toplam ömür zorunlu ve > 0 olmalı
    if (data.lifespanUnitTypeId != null) {
      return data.totalLifespan != null && data.totalLifespan > 0
    }
    return true
  },
  {
    message: "Ömür takibi için toplam ömür değeri giriniz",
    path: ["totalLifespan"],
  }
)

type ProductFormData = z.infer<typeof productSchema>

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

const defaultValues: ProductFormData = {
  type: ProductType.Tracked,
  name: "",
  description: "",
  productCode: "",
  minimumStockLevel: 0,
  basePrice: 0,
  pricePeriodId: 0,
  currencyId: 0,
  totalLifespan: null,
  lifespanUnitTypeId: null,
  categoryId: "",
  unitTypeId: 0,
  trackExpiryDate: false,
  isActive: true,
  notes: "",
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
}: ProductDialogProps) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Fetch full product data for editing
  const { data: productData } = useProductForEdit(product?.id || "")
  const editProduct = product ? productData : null

  // Lookup data
  const { data: unitTypes } = useUnitTypeSelect()
  const { data: pricePeriods } = usePricePeriodSelect()
  const { data: currencies } = useCurrencySelect()
  const { data: lifespanUnitTypes } = useLifespanUnitTypeSelect()
  const { data: companySettings } = useCompanySettings()

  // Cascading kategori seçimi için state'ler
  const [level1CategoryId, setLevel1CategoryId] = useState<string | null>(null)
  const [level2CategoryId, setLevel2CategoryId] = useState<string | null>(null)

  // Cascading kategori dropdown'ları
  const { data: level1Categories } = useCategorySelectByParent(null) // Root kategoriler
  const { data: level2Categories } = useCategorySelectByParent(level1CategoryId || "")
  const { data: level3Categories } = useCategorySelectByParent(level2CategoryId || "")

  const [attributeValues, setAttributeValues] = useState<ProductAttributeValue[]>([])
  const [showTypeInfo, setShowTypeInfo] = useState(false)
  const [showCategoryInfo, setShowCategoryInfo] = useState(false)
  const [showUnitTypeInfo, setShowUnitTypeInfo] = useState(false)
  const [showLifespanInfo, setShowLifespanInfo] = useState(false)
  const [showBasePriceInfo, setShowBasePriceInfo] = useState(false)

  // values prop pattern: formValues hesapla
  const adetUnit = unitTypes?.find(u => u.text.toLowerCase() === "adet")

  const formValues: ProductFormData = useMemo(() => {
    if (!open) return defaultValues

    if (editProduct) {
      return {
        type: editProduct.type,
        name: editProduct.name,
        description: editProduct.description || "",
        productCode: editProduct.productCode,
        minimumStockLevel: editProduct.minimumStockLevel,
        basePrice: editProduct.basePrice,
        pricePeriodId: editProduct.pricePeriodId,
        currencyId: editProduct.currencyId,
        totalLifespan: editProduct.totalLifespan,
        lifespanUnitTypeId: editProduct.lifespanUnitTypeId,
        categoryId: editProduct.categoryId,
        unitTypeId: editProduct.unitTypeId,
        trackExpiryDate: editProduct.trackExpiryDate,
        isActive: editProduct.isActive,
        notes: editProduct.notes || "",
      }
    }

    if (product) {
      // product var ama editProduct henüz yüklenmedi - liste verisini kullan
      return {
        type: product.type,
        name: product.name,
        description: "",
        productCode: product.productCode,
        minimumStockLevel: 0,
        basePrice: product.basePrice,
        pricePeriodId: 0,
        currencyId: 0,
        totalLifespan: null,
        lifespanUnitTypeId: null,
        categoryId: "",
        unitTypeId: 0,
        trackExpiryDate: false,
        isActive: product.isActive,
        notes: "",
      }
    }

    // Yeni ürün - şirket varsayılan ayarlarını kullan
    return {
      ...defaultValues,
      currencyId: companySettings?.defaultCurrencyId || 0,
      pricePeriodId: companySettings?.defaultPricePeriodId || 0,
      unitTypeId: adetUnit?.value || 0, // Takipli ürün varsayılanı: Adet
    }
  }, [open, editProduct, product, companySettings, adetUnit])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues,
    values: open ? formValues : defaultValues,
  })

  const productType = watch("type")
  const watchedLifespanUnitTypeId = watch("lifespanUnitTypeId")
  const watchedCategoryId = watch("categoryId")

  // Kategori özelliklerini yükle - form'daki en spesifik seçilen kategoriden
  const { data: categoryAttributes } = useCategoryAttributesByCategory(watchedCategoryId || null)

  // Varyant özellikleri (sadece isVariantAttribute=true olanlar)
  const variantAttributes = useMemo(
    () => categoryAttributes?.filter((a) => a.isVariantAttribute) ?? [],
    [categoryAttributes]
  )
  const hasVariantAttributes = variantAttributes.length > 0

  // Ömür birim tipi kaldırıldığında toplam ömrü temizle
  useEffect(() => {
    if (watchedLifespanUnitTypeId == null) {
      setValue("totalLifespan", null)
    }
  }, [watchedLifespanUnitTypeId, setValue])

  // Takipli ürünler için birim tipini otomatik "Adet" yap
  useEffect(() => {
    if (productType === ProductType.Tracked && unitTypes) {
      const adetUnitItem = unitTypes.find(u => u.text.toLowerCase() === "adet")
      if (adetUnitItem) {
        setValue("unitTypeId", adetUnitItem.value)
      }
    }
  }, [productType, unitTypes, setValue])

  // Level 1 değiştiğinde categoryId'yi güncelle (level 2/3 seçilmemişse)
  const handleLevel1Change = (value: string | null) => {
    setLevel1CategoryId(value)
    setLevel2CategoryId(null) // Alt seviyeleri sıfırla
    // Level 1 seçildiyse ve alt seviye yoksa, categoryId = level1
    if (value) {
      setValue("categoryId", value)
    } else {
      setValue("categoryId", "")
    }
  }

  // Level 2 değiştiğinde categoryId'yi güncelle
  const handleLevel2Change = (value: string | null) => {
    setLevel2CategoryId(value)
    // Level 2 seçildiyse categoryId = level2, seçilmediyse level1
    if (value) {
      setValue("categoryId", value)
    } else if (level1CategoryId) {
      setValue("categoryId", level1CategoryId)
    }
  }

  // Dialog kapandığında state temizleme + edit modda cascading kategori ve özellik değerlerini ayarla
  useEffect(() => {
    if (!open) {
      setAttributeValues([])
      setLevel1CategoryId(null)
      setLevel2CategoryId(null)
      return
    }

    if (editProduct) {
      // Düzenleme modunda mevcut özellik değerlerini yükle
      setAttributeValues(editProduct.attributeValues || [])

      // Cascading kategori state'lerini ayarla
      // CategoryGrandParentId varsa: Level 3 kategori seçilmiş (grandparent=L1, parent=L2, category=L3)
      // CategoryParentId varsa: Level 2 kategori seçilmiş (parent=L1, category=L2)
      // Hiçbiri yoksa: Level 1 kategori seçilmiş (category=L1)
      if (editProduct.categoryGrandParentId) {
        // Level 3 seçilmiş
        setLevel1CategoryId(editProduct.categoryGrandParentId)
        setLevel2CategoryId(editProduct.categoryParentId)
        // categoryId zaten level 3, form'da doğru
      } else if (editProduct.categoryParentId) {
        // Level 2 seçilmiş
        setLevel1CategoryId(editProduct.categoryParentId)
        setLevel2CategoryId(editProduct.categoryId)
      } else {
        // Level 1 seçilmiş
        setLevel1CategoryId(editProduct.categoryId)
        setLevel2CategoryId(null)
      }
    } else if (!product) {
      // Yeni ürün
      setAttributeValues([])
      setLevel1CategoryId(null)
      setLevel2CategoryId(null)
    }
  }, [open, editProduct, product])

  // Özellik değeri değiştiğinde
  const handleAttributeChange = (newValue: ProductAttributeValue) => {
    setAttributeValues((prev) => {
      const existingIndex = prev.findIndex(
        (v) => v.categoryAttributeId === newValue.categoryAttributeId
      )
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = newValue
        return updated
      }
      return [...prev, newValue]
    })
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: {
            ...data,
            cost: 0, // Maliyet artık envanter seviyesinde takip ediliyor
            totalLifespan: data.totalLifespan || null,
            lifespanUnitTypeId: data.lifespanUnitTypeId || null,
            trackExpiryDate: data.trackExpiryDate,
            notes: data.notes || null,
            attributeValues: attributeValues.length > 0 ? attributeValues : undefined,
          },
        })
      } else {
        await createProduct.mutateAsync({
          ...data,
          cost: 0, // Maliyet artık envanter seviyesinde takip ediliyor
          totalLifespan: data.totalLifespan || null,
          lifespanUnitTypeId: data.lifespanUnitTypeId || null,
          trackExpiryDate: data.trackExpiryDate,
          notes: data.notes || null,
          attributeValues: attributeValues.length > 0 ? attributeValues : undefined,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createProduct.isPending || updateProduct.isPending

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Ürün Düzenle" : "Yeni Ürün"}
          </DialogTitle>
          <DialogDescription>
            Ürün bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className={`grid w-full ${
              product && hasVariantAttributes
                ? (categoryAttributes && categoryAttributes.length > 0 ? "grid-cols-4" : "grid-cols-3")
                : (categoryAttributes && categoryAttributes.length > 0 ? "grid-cols-3" : "grid-cols-2")
            }`}>
              <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="pricing">Fiyat ve Stok</TabsTrigger>
              {categoryAttributes && categoryAttributes.length > 0 && (
                <TabsTrigger value="attributes">Özellikler</TabsTrigger>
              )}
              {product && hasVariantAttributes && (
                <TabsTrigger value="variants">Varyantlar</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Ürün Adı *</Label>
                  <Input placeholder="Ürün adı" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Ürün Kodu *</Label>
                  <Input placeholder="PRD-001" {...register("productCode")} />
                  {errors.productCode && (
                    <p className="text-sm text-destructive">{errors.productCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1">
                    <Label>Ürün Tipi *</Label>
                    <button
                      type="button"
                      onClick={() => setShowTypeInfo(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
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
                          <SelectValue placeholder="Tip seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ProductTypeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Cascading Kategori Seçimi */}
                <div className="col-span-2 space-y-4">
                  <div className="inline-flex items-center gap-1">
                    <Label>Kategori *</Label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryInfo(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Level 1 - Ana Kategori */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Ana Kategori</Label>
                      <Select
                        value={level1CategoryId || "none"}
                        onValueChange={(value) => handleLevel1Change(value === "none" ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Seçiniz</SelectItem>
                          {level1Categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Level 2 - Alt Kategori */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Alt Kategori</Label>
                      <Select
                        value={level2CategoryId || "none"}
                        onValueChange={(value) => handleLevel2Change(value === "none" ? null : value)}
                        disabled={!level1CategoryId || !level2Categories?.length}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!level1CategoryId ? "Önce ana kategori seçin" : (level2Categories?.length ? "Seçiniz" : "Alt kategori yok")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seçilmedi</SelectItem>
                          {level2Categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Level 3 - Ürün Tipi (opsiyonel) */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Ürün Tipi</Label>
                      <Controller
                        control={control}
                        name="categoryId"
                        render={({ field }) => (
                          <Select
                            key={`categoryId-${field.value}`}
                            value={(level3Categories?.length && field.value && field.value !== level2CategoryId) ? field.value : "none"}
                            onValueChange={(value) => {
                              if (value === "none") {
                                // Level 3 seçilmedi, level2'yi kullan
                                field.onChange(level2CategoryId || level1CategoryId || "")
                              } else {
                                field.onChange(value)
                              }
                            }}
                            disabled={!level2CategoryId || !level3Categories?.length}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={!level2CategoryId ? "Önce alt kategori seçin" : (level3Categories?.length ? "Seçiniz (opsiyonel)" : "Ürün tipi yok")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Seçilmedi</SelectItem>
                              {level3Categories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                  {!level1CategoryId && (
                    <p className="text-xs text-muted-foreground">
                      En az ana kategori seçilmelidir
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1">
                    <Label>Birim Tipi *</Label>
                    <button
                      type="button"
                      onClick={() => setShowUnitTypeInfo(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <Controller
                    control={control}
                    name="unitTypeId"
                    render={({ field }) => (
                      <Select
                        key={`unitType-${field.value}-${unitTypes?.length ?? 0}`}
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? 0 : Number(value))}
                        disabled={productType === ProductType.Tracked}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Birim seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Birim seçiniz</SelectItem>
                          {unitTypes?.map((unit) => (
                            <SelectItem key={unit.value} value={String(unit.value)}>
                              {unit.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {productType === ProductType.Tracked && (
                    <p className="text-xs text-muted-foreground">
                      Takipli ürünler için birim tipi her zaman "Adet"tir
                    </p>
                  )}
                  {errors.unitTypeId && (
                    <p className="text-sm text-destructive">{errors.unitTypeId.message}</p>
                  )}
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    placeholder="Ürün açıklaması"
                    {...register("description")}
                    rows={3}
                  />
                </div>

                {productType === ProductType.Tracked && (
                  <>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1">
                        <Label>Ömür Takibi</Label>
                        <button
                          type="button"
                          onClick={() => setShowLifespanInfo(true)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </div>
                      <Controller
                        control={control}
                        name="lifespanUnitTypeId"
                        render={({ field }) => (
                          <Select
                            key={`lifespan-${field.value}-${lifespanUnitTypes?.length ?? 0}`}
                            value={field.value ? String(field.value) : "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ömür takibi yok" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ömür takibi yok</SelectItem>
                              {lifespanUnitTypes?.map((unit) => (
                                <SelectItem key={unit.value} value={String(unit.value)}>
                                  {unit.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {watchedLifespanUnitTypeId != null && (
                      <div className="space-y-2">
                        <Label>Toplam Ömür *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Örn: 1000"
                          {...register("totalLifespan", { valueAsNumber: true })}
                        />
                        {errors.totalLifespan && (
                          <p className="text-sm text-destructive">{errors.totalLifespan.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Ürünün toplam kullanım ömrü
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1">
                    <Label>Temel Fiyat *</Label>
                    <button
                      type="button"
                      onClick={() => setShowBasePriceInfo(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("basePrice", { valueAsNumber: true })}
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fiyat Periyodu *</Label>
                  <Controller
                    control={control}
                    name="pricePeriodId"
                    render={({ field }) => (
                      <Select
                        key={`pricePeriod-${field.value}-${pricePeriods?.length ?? 0}`}
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? 0 : Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Periyot seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Periyot seçiniz</SelectItem>
                          {pricePeriods?.map((period) => (
                            <SelectItem key={period.value} value={String(period.value)}>
                              {period.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.pricePeriodId && (
                    <p className="text-sm text-destructive">{errors.pricePeriodId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Para Birimi *</Label>
                  <Controller
                    control={control}
                    name="currencyId"
                    render={({ field }) => (
                      <Select
                        key={`currency-${field.value}-${currencies?.length ?? 0}`}
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? 0 : Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Para birimi seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Para birimi seçiniz</SelectItem>
                          {currencies?.map((currency) => (
                            <SelectItem key={currency.value} value={String(currency.value)}>
                              {currency.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.currencyId && (
                    <p className="text-sm text-destructive">{errors.currencyId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Minimum Stok Seviyesi</Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="0"
                    {...register("minimumStockLevel", { valueAsNumber: true })}
                  />
                  {errors.minimumStockLevel && (
                    <p className="text-sm text-destructive">{errors.minimumStockLevel.message}</p>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>Son Kullanma Tarihi Takibi</Label>
                    <p className="text-sm text-muted-foreground">
                      Bu ürün için envanterde son kullanma tarihi girilmesi zorunlu olsun
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name="trackExpiryDate"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Notlar</Label>
                  <Textarea
                    placeholder="Ek notlar..."
                    {...register("notes")}
                    rows={3}
                  />
                </div>

                {product && (
                  <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>Durum</Label>
                      <p className="text-sm text-muted-foreground">
                        Ürünün aktif/pasif durumu
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name="isActive"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${field.value ? "text-green-600" : "text-muted-foreground"}`}>
                            {field.value ? "Aktif" : "Pasif"}
                          </span>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {categoryAttributes && categoryAttributes.length > 0 && (
              <TabsContent value="attributes" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {categoryAttributes.map((attr) => (
                    <div
                      key={attr.id}
                      className={
                        attr.dataType === 7 // MultiSelect
                          ? "col-span-2"
                          : ""
                      }
                    >
                      <DynamicAttributeField
                        attribute={attr}
                        value={attributeValues.find(
                          (v) => v.categoryAttributeId === attr.id
                        )}
                        onChange={handleAttributeChange}
                      />
                    </div>
                  ))}
                </div>
                {categoryAttributes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Bu kategori için tanımlanmış özellik bulunmuyor.
                  </p>
                )}
              </TabsContent>
            )}

            {product && hasVariantAttributes && (
              <TabsContent value="variants" className="mt-4">
                <ProductVariantManager
                  productId={product.id}
                  variantAttributes={variantAttributes}
                />
              </TabsContent>
            )}
          </Tabs>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Ürün Tipi Bilgi Dialogu */}
    <Dialog open={showTypeInfo} onOpenChange={setShowTypeInfo}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ürün Tipleri Hakkında</DialogTitle>
          <DialogDescription>
            Her ürün tipi farklı iş akışları ve özellikler sunar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Takipli */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Takipli Ürün</h4>
              <p className="text-sm text-muted-foreground">
                Seri numarası ile bireysel olarak takip edilen ürünler. Her birim ayrı envanter kaydı olarak izlenir.
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Seri numarası ile bireysel takip</li>
                <li>• Ömür takibi (saat, km, kullanım adedi)</li>
                <li>• Bakım ve servis geçmişi</li>
                <li>• Örnek: İş makineleri, kameralar, jeneratörler</li>
              </ul>
            </div>
          </div>

          {/* Sayılabilir */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Layers className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Sayılabilir Ürün</h4>
              <p className="text-sm text-muted-foreground">
                Miktar bazında takip edilen ürünler. Bireysel seri numarası gerektirmez, toplam adet üzerinden yönetilir.
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Miktar bazlı stok takibi</li>
                <li>• Depo bazında adet yönetimi</li>
                <li>• Toplu kiralama desteği</li>
                <li>• Örnek: Sandalyeler, masalar, bariyerler</li>
              </ul>
            </div>
          </div>

          {/* Sarf Malzeme */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Droplets className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Sarf Malzeme</h4>
              <p className="text-sm text-muted-foreground">
                Tek kullanımlık veya tüketilebilir malzemeler. Kullanıldıktan sonra iade edilmez.
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Tek kullanımlık ürünler</li>
                <li>• Son kullanma tarihi takibi (opsiyonel)</li>
                <li>• Satış veya kiralama ile birlikte verilebilir</li>
                <li>• Örnek: Filtreler, yağlar, temizlik malzemeleri</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowTypeInfo(false)}>
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Ömür Takibi Bilgi Dialogu */}
    <Dialog open={showLifespanInfo} onOpenChange={setShowLifespanInfo}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ömür Takibi Hakkında</DialogTitle>
          <DialogDescription>
            Takipli ürünlerin kullanım ömrünü izlemek için kullanılır
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ne İşe Yarar */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Ne İşe Yarar?</h4>
              <p className="text-sm text-muted-foreground">
                Ekipmanların kullanım ömrünü takip ederek bakım zamanlaması ve yenileme kararları almanızı sağlar.
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• <strong>Saat:</strong> Jeneratör, kompresör gibi motorlu ekipmanlar</li>
                <li>• <strong>Kilometre:</strong> Araçlar, forkliftler</li>
                <li>• <strong>Kullanım Adedi:</strong> Kalıplar, özel aletler</li>
              </ul>
            </div>
          </div>

          {/* Nasıl Çalışır */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Nasıl Çalışır?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Ürüne toplam ömür değeri girin (örn: 10.000 saat)</li>
                <li>2. Envanter kaydında mevcut kullanım değerini girin</li>
                <li>3. <strong>Her kiralama sonunda</strong> kullanım değerini güncelleyin</li>
                <li>4. Sistem kalan ömrü otomatik hesaplar</li>
              </ul>
            </div>
          </div>

          {/* Önemli Not */}
          <div className="flex gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Önemli</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Kiralama iade edildiğinde, ekipmanın güncel kullanım değerini (saat, km vb.)
                envanter kaydından güncellemeyi unutmayın. Bu sayede doğru bakım planlaması yapabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowLifespanInfo(false)}>
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Temel Fiyat Bilgi Dialogu */}
    <Dialog open={showBasePriceInfo} onOpenChange={setShowBasePriceInfo}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Temel Fiyat Hakkında</DialogTitle>
          <DialogDescription>
            Ürünün varsayılan kiralama fiyatı
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ne İşe Yarar */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Liste Fiyatı</h4>
              <p className="text-sm text-muted-foreground">
                Bu fiyat, ürünün standart kiralama liste fiyatıdır. Kiralama oluşturulurken
                bu fiyat otomatik olarak gelir.
              </p>
            </div>
          </div>

          {/* Fiyat Periyodu */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Fiyat Periyodu</h4>
              <p className="text-sm text-muted-foreground">
                Fiyatın hangi süre için geçerli olduğunu belirtir:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• <strong>Günlük:</strong> Her gün için bu fiyat uygulanır</li>
                <li>• <strong>Haftalık:</strong> 7 günlük dönem için fiyat</li>
                <li>• <strong>Aylık:</strong> 30 günlük dönem için fiyat</li>
              </ul>
            </div>
          </div>

          {/* Esnek Fiyatlandırma */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Esnek Fiyatlandırma</h4>
              <p className="text-sm text-muted-foreground">
                Kiralama oluştururken bu fiyatı değiştirebilirsiniz. Müşteriye özel
                indirimler veya kampanyalar için fiyatı ayarlayabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowBasePriceInfo(false)}>
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Kategori Bilgi Dialogu */}
    <Dialog open={showCategoryInfo} onOpenChange={setShowCategoryInfo}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kategori Hakkında</DialogTitle>
          <DialogDescription>
            Ürünleri gruplandırarak yönetimi kolaylaştırır
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Kategori Hiyerarşisi */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FolderTree className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Kategori Hiyerarşisi</h4>
              <p className="text-sm text-muted-foreground">
                Kategoriler alt kategorilere sahip olabilir. Örneğin:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• İş Makineleri → Ekskavatörler → Mini Ekskavatörler</li>
                <li>• Etkinlik Ekipmanları → Ses Sistemleri → Hoparlörler</li>
              </ul>
            </div>
          </div>

          {/* Dinamik Özellikler */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <SquareStack className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Dinamik Özellikler</h4>
              <p className="text-sm text-muted-foreground">
                Her kategoriye özel özellikler tanımlanabilir. Kategori seçtiğinizde
                bu özellikler "Özellikler" sekmesinde görünür.
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• <strong>Jeneratörler:</strong> Güç (kVA), Yakıt Tipi, Motor Markası</li>
                <li>• <strong>Vinçler:</strong> Kaldırma Kapasitesi, Bom Uzunluğu</li>
                <li>• <strong>Kameralar:</strong> Çözünürlük, Lens Tipi, Sensör Boyutu</li>
              </ul>
            </div>
          </div>

          {/* Filtreleme ve Raporlama */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Boxes className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Filtreleme ve Raporlama</h4>
              <p className="text-sm text-muted-foreground">
                Doğru kategori seçimi sayesinde:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Ürün listelerinde hızlı filtreleme</li>
                <li>• Kategori bazlı stok raporları</li>
                <li>• Kiralama istatistikleri ve analizler</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowCategoryInfo(false)}>
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Birim Tipi Bilgi Dialogu */}
    <Dialog open={showUnitTypeInfo} onOpenChange={setShowUnitTypeInfo}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Birim Tipi Hakkında</DialogTitle>
          <DialogDescription>
            Ürünün nasıl sayılacağını ve envanterde nasıl takip edileceğini belirler
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Envanter Girişi */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Envanter Girişi</h4>
              <p className="text-sm text-muted-foreground">
                Envanter eklerken miktar bu birim tipine göre girilir:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• <strong>Adet:</strong> 5 adet sandalye, 10 adet masa</li>
                <li>• <strong>Metre:</strong> 100 metre kablo, 50 metre hortum</li>
                <li>• <strong>Kilogram:</strong> 25 kg çimento, 10 kg boya</li>
                <li>• <strong>Litre:</strong> 200 litre yakıt, 50 litre yağ</li>
              </ul>
            </div>
          </div>

          {/* Kiralama ve Fiyatlandırma */}
          <div className="flex gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Kiralama ve Fiyatlandırma</h4>
              <p className="text-sm text-muted-foreground">
                Kiralama oluştururken miktar ve fiyat bu birime göre hesaplanır:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• "50 metre kablo × 5₺/metre = 250₺"</li>
                <li>• "10 adet bariyer × 20₺/adet = 200₺"</li>
              </ul>
            </div>
          </div>

          {/* Takipli Ürünler */}
          <div className="flex gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Takipli Ürünler İçin</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Takipli ürünlerde birim tipi her zaman <strong>"Adet"</strong> olmalıdır
                çünkü her biri seri numarası ile bireysel olarak takip edilir.
                Uzunluk, ağırlık gibi ölçümler ürün özellikleri olarak tanımlanabilir.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowUnitTypeInfo(false)}>
            Anladım
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
