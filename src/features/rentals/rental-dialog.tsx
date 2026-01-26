import { useEffect, useState } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreateRental, useUpdateRental, useRentalForEdit } from "./hooks"
import { RentalStatus } from "./api"
import { useCustomerSelect, useCustomerAddresses } from "@/features/customers/hooks"
import { useWarehouseSelect } from "@/features/warehouses/hooks"
import { useVehicleSelect } from "@/features/vehicles/hooks"
import { useEmployeeSelect } from "@/features/employees/hooks"
import { useProductSelectForRental, useCurrencySelect, usePricePeriodSelect } from "@/features/products/hooks"
import { useExtraServiceSelectForRental } from "@/features/extra-services/hooks"
import { useCompanySettings } from "@/features/settings/hooks"
import { DeliveryType } from "@/features/company/api"
import { Switch } from "@/components/ui/switch"

// İndirim tipi enum
export enum DiscountType {
  Percent = 1,
  Amount = 2
}

const rentalItemSchema = z.object({
  productId: z.string().min(1, "Ürün seçiniz"),
  inventoryId: z.string().nullable().optional(),
  quantity: z.number().min(1, "Miktar en az 1 olmalı"),
  unitPrice: z.number().min(0, "Fiyat 0 veya üzeri olmalı"),
  pricePeriodId: z.number().nullable().optional(),
  startDateTime: z.string().nullable().optional(),
  endDateTime: z.string().nullable().optional(),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.Percent),
  discountValue: z.number().default(0),
  applyRentalDiscount: z.boolean().default(true),
})

const rentalServiceSchema = z.object({
  extraServiceId: z.string().min(1, "Hizmet seçiniz"),
  assignedEmployeeId: z.string().nullable().optional(),
  quantity: z.number().min(1, "Miktar en az 1 olmalı"),
  unitPrice: z.number().min(0, "Fiyat 0 veya üzeri olmalı"),
  pricePeriodId: z.number().nullable().optional(),
  startDateTime: z.string().nullable().optional(),
  endDateTime: z.string().nullable().optional(),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.Percent),
  discountValue: z.number().default(0),
  applyRentalDiscount: z.boolean().default(true),
  notes: z.string().default(""),
})

const rentalSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçiniz"),
  deliveryAddressId: z.string().nullable().optional(),
  plannedStartDate: z.string().min(1, "Başlangıç tarihi zorunlu"),
  plannedEndDate: z.string().min(1, "Bitiş tarihi zorunlu"),
  sourceWarehouseId: z.string().nullable().optional(),
  deliveryVehicleId: z.string().nullable().optional(),
  deliveryEmployeeId: z.string().nullable().optional(),
  currencyId: z.number().nullable().optional(),
  exchangeRate: z.number().min(0, "Kur 0 veya üzeri olmalı").default(1),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.Percent),
  discountValue: z.number().default(0),
  depositAmount: z.number().default(0),
  notes: z.string().default(""),
  items: z.array(rentalItemSchema).default([]),
  services: z.array(rentalServiceSchema).default([]),
})

type RentalFormData = z.infer<typeof rentalSchema>

interface RentalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: string | null
}

export function RentalDialog({ open, onOpenChange, editId }: RentalDialogProps) {
  const isEditMode = !!editId
  const createRental = useCreateRental()
  const updateRental = useUpdateRental()
  const { data: editData, isLoading: isLoadingEdit } = useRentalForEdit(editId || null)

  // Lookup data
  const { data: customers, isLoading: isLoadingCustomers } = useCustomerSelect()
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouseSelect()
  const { data: vehicles, isLoading: isLoadingVehicles } = useVehicleSelect()
  const { data: employees, isLoading: isLoadingEmployees } = useEmployeeSelect()
  const { data: products, isLoading: isLoadingProducts } = useProductSelectForRental()
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencySelect()
  const { data: pricePeriods, isLoading: isLoadingPricePeriods } = usePricePeriodSelect()
  const { data: extraServices, isLoading: isLoadingExtraServices } = useExtraServiceSelectForRental()
  const { data: companySettings } = useCompanySettings()

  // Lookup veriler yüklenene kadar loading göster
  const isLoadingLookups = isLoadingCustomers || isLoadingWarehouses || isLoadingVehicles ||
    isLoadingEmployees || isLoadingProducts || isLoadingCurrencies ||
    isLoadingPricePeriods || isLoadingExtraServices

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

  // Müşteri ID'si: selectedCustomerId set edildiyse onu kullan,
  // yoksa edit modunda editData.customerId'yi fallback olarak kullan
  // Bu sayede hem ilk yüklemede hem de müşteri değiştiğinde doğru çalışır
  const effectiveCustomerId = selectedCustomerId ||
    (open && isEditMode && editData ? editData.customerId : "")

  const { data: customerAddresses, isLoading: isLoadingAddresses } = useCustomerAddresses(effectiveCustomerId)

  const defaultValues: RentalFormData = {
    customerId: "",
    deliveryAddressId: null,
    plannedStartDate: "",
    plannedEndDate: "",
    sourceWarehouseId: null,
    deliveryVehicleId: null,
    deliveryEmployeeId: null,
    currencyId: companySettings?.defaultCurrencyId || null,
    exchangeRate: 1,
    discountType: DiscountType.Percent,
    discountValue: 0,
    depositAmount: 0,
    notes: "",
    items: [],
    services: [],
  }

  // Form values - edit modunda editData'dan, yoksa defaultValues'dan
  const formValues: RentalFormData = (open && isEditMode && editData) ? {
    customerId: editData.customerId,
    deliveryAddressId: editData.deliveryAddressId,
    plannedStartDate: editData.plannedStartDate.split("T")[0],
    plannedEndDate: editData.plannedEndDate.split("T")[0],
    sourceWarehouseId: editData.sourceWarehouseId,
    deliveryVehicleId: editData.deliveryVehicleId,
    deliveryEmployeeId: editData.deliveryEmployeeId,
    currencyId: editData.currencyId,
    exchangeRate: editData.exchangeRate || 1,
    discountType: editData.discountType || DiscountType.Percent,
    discountValue: editData.discountValue || 0,
    depositAmount: editData.depositAmount,
    notes: editData.notes || "",
    items: editData.items.map((item) => ({
      productId: item.productId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      pricePeriodId: item.pricePeriodId,
      startDateTime: item.startDateTime ? item.startDateTime.slice(0, 16) : null,
      endDateTime: item.endDateTime ? item.endDateTime.slice(0, 16) : null,
      discountType: item.discountType || DiscountType.Percent,
      discountValue: item.discountValue || 0,
      applyRentalDiscount: item.applyRentalDiscount ?? true,
    })),
    services: editData.services.map((service) => ({
      extraServiceId: service.extraServiceId,
      assignedEmployeeId: service.assignedEmployeeId,
      quantity: service.quantity,
      unitPrice: service.unitPrice,
      pricePeriodId: service.pricePeriodId,
      startDateTime: service.startDateTime ? service.startDateTime.slice(0, 16) : null,
      endDateTime: service.endDateTime ? service.endDateTime.slice(0, 16) : null,
      discountType: service.discountType || DiscountType.Percent,
      discountValue: service.discountValue || 0,
      applyRentalDiscount: service.applyRentalDiscount ?? true,
      notes: service.notes || "",
    })),
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema) as any,
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

  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
  } = useFieldArray({
    control,
    name: "services",
  })

  const watchedCustomerId = watch("customerId")
  const watchedItems = watch("items")
  const watchedServices = watch("services")
  const watchedRentalDiscountType = watch("discountType")
  const watchedRentalDiscountValue = watch("discountValue")
  const watchedCurrencyId = watch("currencyId")
  const watchedExchangeRate = watch("exchangeRate")

  // Seçili para birimi TL mi? (TL varsayılan olarak ID=1 kabul ediyoruz)
  // Eğer currencies'den TL'nin ID'sini bulmak istersek currencies listesini kontrol edebiliriz
  const selectedCurrency = currencies?.find(c => c.value === watchedCurrencyId)
  const isTRY = !watchedCurrencyId || selectedCurrency?.text?.includes("TL") || selectedCurrency?.text?.includes("TRY")

  // Kiralama indirimi yüzde olarak hesapla (sadece yüzde tipinde)
  const rentalDiscountPercent = watchedRentalDiscountType === DiscountType.Percent ? (watchedRentalDiscountValue || 0) : 0

  // Ürün tutarı hesaplama fonksiyonu
  const calculateItemTotal = (index: number) => {
    const item = watchedItems?.[index]
    if (!item) return { lineTotal: 0, afterRentalDiscount: 0 }

    const quantity = item.quantity || 0
    const unitPrice = item.unitPrice || 0
    const discountType = item.discountType || DiscountType.Percent
    const discountValue = item.discountValue || 0
    const applyRentalDiscount = item.applyRentalDiscount ?? true

    // Brüt tutar
    const grossTotal = quantity * unitPrice

    // Ürün indirimi
    let discountAmount = 0
    if (discountType === DiscountType.Percent) {
      discountAmount = grossTotal * (discountValue / 100)
    } else {
      discountAmount = discountValue
    }

    // Ürün indirimi sonrası tutar
    const lineTotal = Math.max(0, grossTotal - discountAmount)

    // Kiralama indirimi sonrası tutar (sadece yüzde tipinde uygulanır)
    let afterRentalDiscount = lineTotal
    if (applyRentalDiscount && rentalDiscountPercent > 0) {
      afterRentalDiscount = lineTotal * (1 - rentalDiscountPercent / 100)
    }

    return { grossTotal, discountAmount, lineTotal, afterRentalDiscount }
  }

  // Hizmet tutarı hesaplama fonksiyonu
  const calculateServiceTotal = (index: number) => {
    const service = watchedServices?.[index]
    if (!service) return { lineTotal: 0, afterRentalDiscount: 0 }

    const quantity = service.quantity || 0
    const unitPrice = service.unitPrice || 0
    const discountType = service.discountType || DiscountType.Percent
    const discountValue = service.discountValue || 0
    const applyRentalDiscount = service.applyRentalDiscount ?? true

    // Brüt tutar
    const grossTotal = quantity * unitPrice

    // Hizmet indirimi
    let discountAmount = 0
    if (discountType === DiscountType.Percent) {
      discountAmount = grossTotal * (discountValue / 100)
    } else {
      discountAmount = discountValue
    }

    // Hizmet indirimi sonrası tutar
    const lineTotal = Math.max(0, grossTotal - discountAmount)

    // Kiralama indirimi sonrası tutar (sadece yüzde tipinde uygulanır)
    let afterRentalDiscount = lineTotal
    if (applyRentalDiscount && rentalDiscountPercent > 0) {
      afterRentalDiscount = lineTotal * (1 - rentalDiscountPercent / 100)
    }

    return { grossTotal, discountAmount, lineTotal, afterRentalDiscount }
  }

  useEffect(() => {
    setSelectedCustomerId(watchedCustomerId)
  }, [watchedCustomerId])

  // Müşterinin tek adresi varsa otomatik seç
  useEffect(() => {
    if (customerAddresses && customerAddresses.length === 1 && !isEditMode) {
      setValue("deliveryAddressId", customerAddresses[0].id)
    }
  }, [customerAddresses, setValue, isEditMode])

  // Tek depo, araç veya personel varsa otomatik ata
  useEffect(() => {
    if (!isEditMode && open) {
      if (warehouses && warehouses.length === 1) {
        setValue("sourceWarehouseId", warehouses[0].id)
      }
      if (vehicles && vehicles.length === 1) {
        setValue("deliveryVehicleId", vehicles[0].id)
      }
      if (employees && employees.length === 1) {
        setValue("deliveryEmployeeId", employees[0].id)
      }
    }
  }, [warehouses, vehicles, employees, setValue, isEditMode, open])

  // Ürün seçildiğinde fiyat ve periyodu otomatik doldur
  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p) => p.id === productId)
    if (product) {
      setValue(`items.${index}.unitPrice`, product.basePrice)
      setValue(`items.${index}.pricePeriodId`, product.pricePeriodId)
    } else {
      setValue(`items.${index}.unitPrice`, 0)
      setValue(`items.${index}.pricePeriodId`, null)
    }
  }

  // Hizmet seçildiğinde fiyat ve periyodu otomatik doldur
  const handleServiceChange = (index: number, serviceId: string) => {
    const service = extraServices?.find((s) => s.id === serviceId)
    if (service) {
      setValue(`services.${index}.unitPrice`, service.price)
      setValue(`services.${index}.pricePeriodId`, service.pricePeriodId)
    } else {
      setValue(`services.${index}.unitPrice`, 0)
      setValue(`services.${index}.pricePeriodId`, null)
    }
  }

  // Edit modunda müşteri adreslerini yüklemek için selectedCustomerId'yi güncelle
  useEffect(() => {
    if (open && isEditMode && editData) {
      setSelectedCustomerId(editData.customerId)
    } else if (!open) {
      setSelectedCustomerId("")
    }
  }, [open, isEditMode, editData])

  const onSubmit = async (data: RentalFormData) => {
    try {
      const payload = {
        ...data,
        deliveryAddressId: data.deliveryAddressId || null,
        sourceWarehouseId: data.sourceWarehouseId || null,
        deliveryVehicleId: data.deliveryVehicleId || null,
        deliveryEmployeeId: data.deliveryEmployeeId || null,
        currencyId: data.currencyId || null,
        items: data.items.map((item) => ({
          ...item,
          inventoryId: item.inventoryId || null,
          pricePeriodId: item.pricePeriodId || null,
          startDateTime: item.startDateTime || null,
          endDateTime: item.endDateTime || null,
        })),
        services: data.services.map((service) => ({
          ...service,
          assignedEmployeeId: service.assignedEmployeeId || null,
          pricePeriodId: service.pricePeriodId || null,
          startDateTime: service.startDateTime || null,
          endDateTime: service.endDateTime || null,
        })),
      }

      if (isEditMode && editId) {
        await updateRental.mutateAsync({
          id: editId,
          data: {
            ...payload,
            status: editData?.status || RentalStatus.Draft,
          },
        })
      } else {
        await createRental.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createRental.isPending || updateRental.isPending

  // Edit modunda editData VE lookup verileri yüklenene kadar bekle
  // Edit modunda müşteri adresleri de yüklenmeli
  const isLoading = (isEditMode && isLoadingEdit) || isLoadingLookups ||
    (isEditMode && editData?.customerId && isLoadingAddresses)

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Kiralama Düzenle" : "Yeni Kiralama"}</DialogTitle>
            <DialogDescription>Yükleniyor...</DialogDescription>
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Kiralama Düzenle" : "Yeni Kiralama"}</DialogTitle>
          <DialogDescription>Kiralama bilgilerini girin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="delivery">Teslimat</TabsTrigger>
              <TabsTrigger value="items">Ürünler</TabsTrigger>
              <TabsTrigger value="services">Hizmetler</TabsTrigger>
            </TabsList>

            {/* Genel Bilgiler */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Müşteri *</Label>
                  <Controller
                    control={control}
                    name="customerId"
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Müşteri seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>
                            Müşteri seçiniz
                          </SelectItem>
                          {customers?.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.customerId && (
                    <p className="text-sm text-destructive">{errors.customerId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Teslimat Adresi</Label>
                  <Controller
                    control={control}
                    name="deliveryAddressId"
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                        disabled={!effectiveCustomerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Adres seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Adres seçiniz</SelectItem>
                          {customerAddresses?.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {address.title} - {address.addressLine1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Başlangıç Tarihi *</Label>
                  <Input type="date" {...register("plannedStartDate")} />
                  {errors.plannedStartDate && (
                    <p className="text-sm text-destructive">{errors.plannedStartDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Bitiş Tarihi *</Label>
                  <Input type="date" {...register("plannedEndDate")} />
                  {errors.plannedEndDate && (
                    <p className="text-sm text-destructive">{errors.plannedEndDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Para Birimi</Label>
                  <Controller
                    control={control}
                    name="currencyId"
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) => {
                          field.onChange(value === "none" ? null : Number(value))
                          // TL seçildiğinde kuru 1 yap
                          const selectedCurr = currencies?.find(c => String(c.value) === value)
                          if (value === "none" || selectedCurr?.text?.includes("TL") || selectedCurr?.text?.includes("TRY")) {
                            setValue("exchangeRate", 1)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Para birimi seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Para birimi seçiniz</SelectItem>
                          {currencies?.map((currency) => (
                            <SelectItem key={currency.value} value={String(currency.value)}>
                              {currency.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {!isTRY && (
                  <div className="space-y-2">
                    <Label>
                      Döviz Kuru (1 {selectedCurrency?.text} = ? TL)
                    </Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="1.0000"
                      {...register("exchangeRate", { valueAsNumber: true })}
                    />
                    {watchedExchangeRate && watchedExchangeRate > 0 && (
                      <p className="text-xs text-muted-foreground">
                        1 {selectedCurrency?.text} = {watchedExchangeRate.toFixed(4)} TL
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Depozito</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("depositAmount", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>İndirim Tipi</Label>
                  <Controller
                    control={control}
                    name="discountType"
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="İndirim tipi seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={String(DiscountType.Percent)}>Yüzde (%)</SelectItem>
                          <SelectItem value={String(DiscountType.Amount)}>Tutar</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <Controller
                  control={control}
                  name="discountType"
                  render={({ field: typeField }) => (
                    <div className="space-y-2">
                      <Label>
                        Genel İndirim {typeField.value === DiscountType.Percent ? "(%)" : "Tutarı"}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...register("discountValue", { valueAsNumber: true })}
                      />
                    </div>
                  )}
                />

                <div className="col-span-2 space-y-2">
                  <Label>Notlar</Label>
                  <Textarea placeholder="Kiralama notları..." {...register("notes")} rows={3} />
                </div>
              </div>
            </TabsContent>

            {/* Teslimat Bilgileri */}
            <TabsContent value="delivery" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kaynak Depo</Label>
                  <Controller
                    control={control}
                    name="sourceWarehouseId"
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Depo seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Depo seçiniz</SelectItem>
                          {warehouses?.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {companySettings?.defaultDeliveryType === DeliveryType.CompanyDelivery && (
                  <>
                    <div className="space-y-2">
                      <Label>Teslimat Aracı</Label>
                      <Controller
                        control={control}
                        name="deliveryVehicleId"
                        render={({ field }) => (
                          <Select
                            value={field.value || "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Araç seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Araç seçiniz</SelectItem>
                              {vehicles?.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.plate}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Teslimat Personeli</Label>
                      <Controller
                        control={control}
                        name="deliveryEmployeeId"
                        render={({ field }) => (
                          <Select
                            value={field.value || "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Personel seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Personel seçiniz</SelectItem>
                              {employees?.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Kiralama Kalemleri */}
            <TabsContent value="items" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Kiralama Kalemleri</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Önceki ürünün indirim değerlerini al
                    const items = watch("items")
                    const lastItem = items.length > 0 ? items[items.length - 1] : null

                    appendItem({
                      productId: "",
                      inventoryId: null,
                      quantity: 1,
                      unitPrice: 0,
                      pricePeriodId: companySettings?.defaultPricePeriodId || null,
                      startDateTime: null,
                      endDateTime: null,
                      discountType: lastItem?.discountType ?? DiscountType.Percent,
                      discountValue: 0,
                      applyRentalDiscount: lastItem?.applyRentalDiscount ?? true,
                    })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Kalem Ekle
                </Button>
              </div>
              {errors.items?.message && (
                <p className="text-sm text-destructive">{errors.items.message}</p>
              )}

              {itemFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Henüz ürün eklenmemiş. Taslak olarak kaydedebilirsiniz.
                </div>
              ) : (
              <div className="space-y-4">
                {itemFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Kalem #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Ürün *</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <Select
                              value={field.value || "none"}
                              onValueChange={(value) => {
                                const productId = value === "none" ? "" : value
                                field.onChange(productId)
                                handleProductChange(index, productId)
                              }}
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
                        {errors.items?.[index]?.productId && (
                          <p className="text-sm text-destructive">
                            {errors.items[index]?.productId?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Miktar *</Label>
                        <Input
                          type="number"
                          step="1"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>

                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field: productField }) => (
                          <div className="space-y-2">
                            <Label>Birim Fiyat *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              disabled={!productField.value}
                              {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            />
                          </div>
                        )}
                      />

                      <div className="space-y-2">
                        <Label>Fiyat Periyodu</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.pricePeriodId`}
                          render={({ field }) => (
                            <Select
                              value={field.value ? String(field.value) : "none"}
                              onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Periyot seçiniz" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Periyot seçiniz</SelectItem>
                                {pricePeriods?.map((period) => (
                                  <SelectItem key={period.value} value={String(period.value)}>
                                    {period.text}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Özel Başlangıç Tarihi/Saati</Label>
                        <Input
                          type="datetime-local"
                          {...register(`items.${index}.startDateTime`)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Boş bırakılırsa kiralama tarihi kullanılır
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Özel Bitiş Tarihi/Saati</Label>
                        <Input
                          type="datetime-local"
                          {...register(`items.${index}.endDateTime`)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Boş bırakılırsa kiralama tarihi kullanılır
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>İndirim Tipi</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.discountType`}
                          render={({ field }) => (
                            <Select
                              value={String(field.value)}
                              onValueChange={(value) => field.onChange(Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={String(DiscountType.Percent)}>Yüzde (%)</SelectItem>
                                <SelectItem value={String(DiscountType.Amount)}>Tutar</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <Controller
                        control={control}
                        name={`items.${index}.discountType`}
                        render={({ field: typeField }) => (
                          <div className="space-y-2">
                            <Label>
                              İndirim {typeField.value === DiscountType.Percent ? "(%)" : "Tutarı"}
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.discountValue`, { valueAsNumber: true })}
                            />
                          </div>
                        )}
                      />

                      <div className="col-span-3 flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label>Kiralama İndirimi Uygulansın</Label>
                          <p className="text-xs text-muted-foreground">
                            Kiralamaya uygulanan genel indirim oranı bu ürüne de uygulansın mı?
                          </p>
                        </div>
                        <Controller
                          control={control}
                          name={`items.${index}.applyRentalDiscount`}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>

                      {/* Hesaplama Özeti */}
                      <div className="col-span-3 rounded-lg bg-muted/50 p-3 space-y-1">
                        {(() => {
                          const calc = calculateItemTotal(index)
                          const item = watchedItems?.[index]
                          const formatCurrency = (val: number) => val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Brüt Tutar:</span>
                                <span>{formatCurrency(calc.grossTotal || 0)}</span>
                              </div>
                              {(calc.discountAmount || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Ürün İndirimi:</span>
                                  <span className="text-orange-600">-{formatCurrency(calc.discountAmount || 0)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-medium">
                                <span className="text-muted-foreground">Satır Tutarı:</span>
                                <span className="text-primary">{formatCurrency(calc.lineTotal || 0)}</span>
                              </div>
                              {item?.applyRentalDiscount && rentalDiscountPercent > 0 && (
                                <>
                                  <Separator className="my-1" />
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Kiralama İndirimi (%{rentalDiscountPercent}):</span>
                                    <span className="text-orange-600">-{formatCurrency((calc.lineTotal || 0) - (calc.afterRentalDiscount || 0))}</span>
                                  </div>
                                  <div className="flex justify-between text-sm font-medium">
                                    <span className="text-muted-foreground">İndirimli Tutar:</span>
                                    <span className="text-green-600">{formatCurrency(calc.afterRentalDiscount || 0)}</span>
                                  </div>
                                </>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </TabsContent>

            {/* Ek Hizmetler */}
            <TabsContent value="services" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Ek Hizmetler</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const singleService = extraServices?.length === 1 ? extraServices[0] : null
                    // Önceki hizmetin indirim ayarlarını al
                    const services = watch("services")
                    const lastService = services.length > 0 ? services[services.length - 1] : null

                    appendService({
                      extraServiceId: singleService?.id || "",
                      assignedEmployeeId: employees?.length === 1 ? employees[0].id : null,
                      quantity: 1,
                      unitPrice: singleService?.price || 0,
                      pricePeriodId: singleService?.pricePeriodId || companySettings?.defaultPricePeriodId || null,
                      startDateTime: null,
                      endDateTime: null,
                      discountType: lastService?.discountType ?? DiscountType.Percent,
                      discountValue: 0,
                      applyRentalDiscount: lastService?.applyRentalDiscount ?? true,
                      notes: "",
                    })
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Hizmet Ekle
                </Button>
              </div>

              {serviceFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Henüz ek hizmet eklenmemiş
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Hizmet #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeService(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Hizmet *</Label>
                          <Controller
                            control={control}
                            name={`services.${index}.extraServiceId`}
                            render={({ field }) => (
                              <Select
                                value={field.value || "none"}
                                onValueChange={(value) => {
                                  const serviceId = value === "none" ? "" : value
                                  field.onChange(serviceId)
                                  handleServiceChange(index, serviceId)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Hizmet seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" disabled>
                                    Hizmet seçiniz
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
                        </div>

                        <div className="space-y-2">
                          <Label>Atanan Personel</Label>
                          <Controller
                            control={control}
                            name={`services.${index}.assignedEmployeeId`}
                            render={({ field }) => (
                              <Select
                                value={field.value || "none"}
                                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Personel seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Personel seçiniz</SelectItem>
                                  {employees?.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id}>
                                      {employee.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Miktar *</Label>
                          <Input
                            type="number"
                            step="1"
                            {...register(`services.${index}.quantity`, { valueAsNumber: true })}
                          />
                        </div>

                        <Controller
                          control={control}
                          name={`services.${index}.extraServiceId`}
                          render={({ field: serviceField }) => {
                            const selectedService = extraServices?.find(s => s.id === serviceField.value)
                            return (
                              <div className="space-y-2">
                                <Label>Birim Fiyat *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`services.${index}.unitPrice`, { valueAsNumber: true })}
                                />
                                {selectedService && (
                                  <p className="text-xs text-muted-foreground">
                                    {selectedService.currencyCode} cinsinden hesaplanacaktır
                                  </p>
                                )}
                              </div>
                            )
                          }}
                        />

                        <div className="space-y-2">
                          <Label>Fiyat Periyodu</Label>
                          <Controller
                            control={control}
                            name={`services.${index}.pricePeriodId`}
                            render={({ field }) => (
                              <Select
                                value={field.value ? String(field.value) : "none"}
                                onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Periyot seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Periyot seçiniz</SelectItem>
                                  {pricePeriods?.map((period) => (
                                    <SelectItem key={period.value} value={String(period.value)}>
                                      {period.text}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Özel Başlangıç Tarihi/Saati</Label>
                          <Input
                            type="datetime-local"
                            {...register(`services.${index}.startDateTime`)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Boş bırakılırsa kiralama tarihi kullanılır
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Özel Bitiş Tarihi/Saati</Label>
                          <Input
                            type="datetime-local"
                            {...register(`services.${index}.endDateTime`)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Boş bırakılırsa kiralama tarihi kullanılır
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>İndirim Tipi</Label>
                          <Controller
                            control={control}
                            name={`services.${index}.discountType`}
                            render={({ field }) => (
                              <Select
                                value={String(field.value)}
                                onValueChange={(value) => field.onChange(Number(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={String(DiscountType.Percent)}>Yüzde (%)</SelectItem>
                                  <SelectItem value={String(DiscountType.Amount)}>Tutar</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <Controller
                          control={control}
                          name={`services.${index}.discountType`}
                          render={({ field: typeField }) => (
                            <div className="space-y-2">
                              <Label>
                                İndirim {typeField.value === DiscountType.Percent ? "(%)" : "Tutarı"}
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                {...register(`services.${index}.discountValue`, { valueAsNumber: true })}
                              />
                            </div>
                          )}
                        />

                        <div className="col-span-3 flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <Label>Kiralama İndirimi Uygulansın</Label>
                            <p className="text-xs text-muted-foreground">
                              Kiralamaya uygulanan genel indirim oranı bu hizmete de uygulansın mı?
                            </p>
                          </div>
                          <Controller
                            control={control}
                            name={`services.${index}.applyRentalDiscount`}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </div>

                        <div className="col-span-3 space-y-2">
                          <Label>Notlar</Label>
                          <Input {...register(`services.${index}.notes`)} />
                        </div>

                        {/* Hesaplama Özeti */}
                        <div className="col-span-3 rounded-lg bg-muted/50 p-3 space-y-1">
                          {(() => {
                            const calc = calculateServiceTotal(index)
                            const service = watchedServices?.[index]
                            const currencyCode = extraServices?.find(s => s.id === service?.extraServiceId)?.currencyCode || ""
                            const formatCurrency = (val: number) => val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                            return (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Brüt Tutar:</span>
                                  <span>{formatCurrency(calc.grossTotal || 0)} {currencyCode}</span>
                                </div>
                                {(calc.discountAmount || 0) > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Hizmet İndirimi:</span>
                                    <span className="text-orange-600">-{formatCurrency(calc.discountAmount || 0)} {currencyCode}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-medium">
                                  <span className="text-muted-foreground">Satır Tutarı:</span>
                                  <span className="text-primary">{formatCurrency(calc.lineTotal || 0)} {currencyCode}</span>
                                </div>
                                {service?.applyRentalDiscount && rentalDiscountPercent > 0 && (
                                  <>
                                    <Separator className="my-1" />
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Kiralama İndirimi (%{rentalDiscountPercent}):</span>
                                      <span className="text-orange-600">-{formatCurrency((calc.lineTotal || 0) - (calc.afterRentalDiscount || 0))} {currencyCode}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                      <span className="text-muted-foreground">İndirimli Tutar:</span>
                                      <span className="text-green-600">{formatCurrency(calc.afterRentalDiscount || 0)} {currencyCode}</span>
                                    </div>
                                  </>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
