import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { cn } from "@/lib/utils"
import { z } from "zod"
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight, Settings2, ChevronUp, Receipt, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/shared/date-picker"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useCreateRental, useUpdateRental, useRentalForEdit } from "./hooks"
import { RentalStatus, DiscountType } from "./api"
import { useCustomerSelect, useCustomerAddresses } from "@/features/customers/hooks"
import { WarehouseSelect } from "@/components/shared/warehouse-select"
import { useVehicleSelect } from "@/features/vehicles/hooks"
import { useEmployeeSelect } from "@/features/employees/hooks"
import { useProductSelectForRental, useCurrencySelect, usePricePeriodSelect } from "@/features/products/hooks"
import { ProductType } from "@/features/products/api"
import { useInventorySelectByProduct } from "@/features/inventory/hooks"
import { useProductVariantSelect } from "@/features/product-variants/hooks"
import { useExtraServiceSelectForRental } from "@/features/extra-services/hooks"
import { ServiceType } from "@/features/extra-services/api"
import { useCompanySettings } from "@/features/settings/hooks"
import { DeliveryType } from "@/features/company/api"
import { useAllProductRules } from "@/features/product-rules/hooks"
import { ProductRuleType, ProductRuleBehavior } from "@/features/product-rules/api"
import { useAvailabilityBatch } from "@/features/availability/hooks"
import { AvailabilityBadge } from "@/features/availability/availability-badge"
import type {
  BatchAvailabilityRequest,
  BatchAvailabilityItemResult,
} from "@/features/availability/api"
import { toast } from "sonner"

// Hizmet kalemi tarih aralıklarını karşılaştırmak için yardımcı fonksiyon.
// startDateTime/endDateTime "yyyy-MM-ddTHH:mm" formatında string olabilir.
// fallbackStart/fallbackEnd kiralamanın "yyyy-MM-dd" formatındaki planlanan tarihleridir.
function parseDateTimeOrFallback(
  value: string | null | undefined,
  fallback: string,
  fallbackIsEnd: boolean,
): Date | null {
  const raw = value && value.length > 0 ? value : fallback
  if (!raw) return null
  // Sadece tarih (yyyy-MM-dd) ise, fallback gibi davran: bitiş ise gün sonuna ayarla
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw)
  const iso = isDateOnly ? `${raw}T${fallbackIsEnd ? "23:59:59" : "00:00:00"}` : raw
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function periodsOverlap(
  s1: string | null | undefined,
  e1: string | null | undefined,
  s2: string | null | undefined,
  e2: string | null | undefined,
  fallbackStart: string,
  fallbackEnd: string,
): boolean {
  const start1 = parseDateTimeOrFallback(s1, fallbackStart, false)
  const end1 = parseDateTimeOrFallback(e1, fallbackEnd, true)
  const start2 = parseDateTimeOrFallback(s2, fallbackStart, false)
  const end2 = parseDateTimeOrFallback(e2, fallbackEnd, true)
  if (!start1 || !end1 || !start2 || !end2) return false
  return start1 < end2 && start2 < end1
}

const rentalItemSchema = z.object({
  productId: z.string().min(1, "Ürün seçiniz"),
  productVariantId: z.string().nullable().optional(),
  inventoryId: z.string().nullable().optional(),
  quantity: z.number().gt(0, "Miktar 0'dan büyük olmalıdır"),
  unitPrice: z.number().gt(0, "Birim fiyat 0'dan büyük olmalıdır"),
  pricePeriodId: z.number().nullable().optional(),
  startDateTime: z.string().nullable().optional(),
  endDateTime: z.string().nullable().optional(),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.Percent),
  discountValue: z.number().default(0),
})

const rentalServiceSchema = z.object({
  extraServiceId: z.string().min(1, "Hizmet seçiniz"),
  assignedEmployeeId: z.string().nullable().optional(),
  assignedVehicleId: z.string().nullable().optional(),
  quantity: z.number().gt(0, "Miktar 0'dan büyük olmalıdır"),
  unitPrice: z.number().gt(0, "Birim fiyat 0'dan büyük olmalıdır"),
  pricePeriodId: z.number().nullable().optional(),
  startDateTime: z.string().nullable().optional(),
  endDateTime: z.string().nullable().optional(),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.Percent),
  discountValue: z.number().default(0),
  notes: z.string().default(""),
})

const rentalSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçiniz"),
  deliveryAddressId: z.string().nullable().optional(),
  deliveryType: z.number().default(2),
  plannedStartDate: z.string().min(1, "Başlangıç tarihi zorunlu"),
  plannedEndDate: z.string().min(1, "Bitiş tarihi zorunlu"),
  sourceWarehouseId: z.string().nullable().optional(),
  deliveryVehicleId: z.string().nullable().optional(),
  deliveryEmployeeId: z.string().nullable().optional(),
  currencyId: z.number().nullable().optional(),
  exchangeRate: z.number().gt(0, "Döviz kuru 0'dan büyük olmalıdır").lte(999999, "Döviz kuru geçerli bir aralıkta olmalıdır").default(1),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.Percent),
  discountValue: z.number().min(0, "İndirim değeri 0 veya daha büyük olmalıdır").default(0),
  depositAmount: z.number().min(0, "Depozito tutarı 0 veya daha büyük olmalıdır").default(0),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").default(""),
  items: z.array(rentalItemSchema).default([]),
  services: z.array(rentalServiceSchema).default([]),
}).superRefine((data, ctx) => {
  // Backend RentalCreateValidator ile birebir aynı kontroller:

  // PlannedEndDate > PlannedStartDate
  if (data.plannedStartDate && data.plannedEndDate && data.plannedEndDate <= data.plannedStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["plannedEndDate"],
      message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır",
    })
  }

  // Items en az 1 zorunlu (en az bir kiralama kalemi)
  if (data.items.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["items"],
      message: "En az bir kiralama kalemi eklenmelidir",
    })
  }

  // Yüzde indirimi maksimum 100
  if (data.discountType === DiscountType.Percent && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["discountValue"],
      message: "Yüzde indirimi 100'den büyük olamaz",
    })
  }

  // Aynı personel veya aynı araç birden fazla hizmete atanmışsa ve
  // zaman aralıkları çakışıyorsa Zod hatası ekle (submit'i engeller).
  const services = data.services ?? []
  for (let i = 0; i < services.length; i++) {
    for (let j = i + 1; j < services.length; j++) {
      const a = services[i]
      const b = services[j]
      if (!a || !b) continue

      const overlap = periodsOverlap(
        a.startDateTime,
        a.endDateTime,
        b.startDateTime,
        b.endDateTime,
        data.plannedStartDate,
        data.plannedEndDate,
      )
      if (!overlap) continue

      if (a.assignedEmployeeId && a.assignedEmployeeId === b.assignedEmployeeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["services", i, "assignedEmployeeId"],
          message: `Aynı personel ${j + 1}. hizmet kaleminde de bu zaman aralığında atanmış`,
        })
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["services", j, "assignedEmployeeId"],
          message: `Aynı personel ${i + 1}. hizmet kaleminde de bu zaman aralığında atanmış`,
        })
      }

      if (a.assignedVehicleId && a.assignedVehicleId === b.assignedVehicleId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["services", i, "assignedVehicleId"],
          message: `Aynı araç ${j + 1}. hizmet kaleminde de bu zaman aralığında atanmış`,
        })
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["services", j, "assignedVehicleId"],
          message: `Aynı araç ${i + 1}. hizmet kaleminde de bu zaman aralığında atanmış`,
        })
      }
    }
  }
})

type RentalFormData = z.infer<typeof rentalSchema>

// Varyant select bileşeni - her item için ayrı hook kullanabilmesi için ayrı component
function RentalItemVariantSelect({
  productId,
  value,
  onChange,
}: {
  productId: string
  value: string | null | undefined
  onChange: (value: string | null) => void
}) {
  const { data: variants } = useProductVariantSelect(productId)

  if (!variants || variants.length === 0) return null

  return (
    <div className="space-y-2">
      <Label>Varyant</Label>
      <Select
        key={`variant-${value}`}
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Varyant seçiniz" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Varyant seçiniz</SelectItem>
          {variants.map((variant) => (
            <SelectItem key={variant.value} value={variant.value}>
              {variant.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Envanter select bileşeni - tracked ürünler için seri numarası seçimi
function RentalItemInventorySelect({
  productId,
  productVariantId,
  warehouseId,
  value,
  onChange,
}: {
  productId: string
  productVariantId: string | null | undefined
  warehouseId: string | null | undefined
  value: string | null | undefined
  onChange: (value: string | null) => void
}) {
  const { data: inventories } = useInventorySelectByProduct(
    productId,
    productVariantId,
    warehouseId,
  )

  return (
    <div className="space-y-2">
      <Label>Envanter (Seri No) *</Label>
      <Select
        key={`inventory-${value}`}
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Envanter seçiniz" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" disabled>Envanter seçiniz</SelectItem>
          {inventories?.map((inv) => (
            <SelectItem key={inv.id} value={inv.id}>
              {inv.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {inventories && inventories.length === 0 && (
        <p className="text-xs text-muted-foreground">Müsait envanter bulunamadı</p>
      )}
    </div>
  )
}

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
  const { data: vehicles, isLoading: isLoadingVehicles } = useVehicleSelect()
  const { data: employees, isLoading: isLoadingEmployees } = useEmployeeSelect()
  const { data: products, isLoading: isLoadingProducts } = useProductSelectForRental()
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencySelect()
  const { data: pricePeriods, isLoading: isLoadingPricePeriods } = usePricePeriodSelect()
  const { data: extraServices, isLoading: isLoadingExtraServices } = useExtraServiceSelectForRental()
  const { data: companySettings } = useCompanySettings()
  const { data: productRules } = useAllProductRules()

  // Lookup veriler yüklenene kadar loading göster
  const isLoadingLookups = isLoadingCustomers || isLoadingVehicles ||
    isLoadingEmployees || isLoadingProducts || isLoadingCurrencies ||
    isLoadingPricePeriods || isLoadingExtraServices

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

  // Collapsible state'leri - hangi kalemler açık
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const [openItemAdvanced, setOpenItemAdvanced] = useState<Set<number>>(new Set())
  const [openServices, setOpenServices] = useState<Set<number>>(new Set())
  const [openServiceAdvanced, setOpenServiceAdvanced] = useState<Set<number>>(new Set())

  // Fiyat özeti footer açık/kapalı
  const [isPriceSummaryOpen, setIsPriceSummaryOpen] = useState(true)

  // Nakliye banner state'i (CompanyDelivery + Transport hizmeti yoksa gösterilir)
  const [transportBannerDismissed, setTransportBannerDismissed] = useState(false)
  const [selectedTransportServiceId, setSelectedTransportServiceId] = useState("")

  // Hizmet toplu ekleme state'i
  const [bulkServiceId, setBulkServiceId] = useState("")
  const [bulkCount, setBulkCount] = useState(1)

  // Kural önerileri state'i
  interface RuleSuggestion {
    id: string
    sourceProductId: string
    sourceProductName: string
    targetProductId: string | null
    targetProductName: string | null
    targetCategoryId: string | null
    targetCategoryName: string | null
    quantity: number
    behavior: ProductRuleBehavior
    type: ProductRuleType
    ruleGroupId: string | null
  }
  const [ruleSuggestions, setRuleSuggestions] = useState<RuleSuggestion[]>([])
  // Kullanıcının "Geç" dediği öneri ID'leri (sadece Suggested tipi için)
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<Set<string>>(new Set())
  // Her öneri için kullanıcının seçtiği miktar
  const [suggestionQuantities, setSuggestionQuantities] = useState<Record<string, number>>({})

  // Müşteri ID'si: selectedCustomerId set edildiyse onu kullan,
  // yoksa edit modunda editData.customerId'yi fallback olarak kullan
  // Bu sayede hem ilk yüklemede hem de müşteri değiştiğinde doğru çalışır
  const effectiveCustomerId = selectedCustomerId ||
    (open && isEditMode && editData ? editData.customerId : "")

  const { data: customerAddresses, isLoading: isLoadingAddresses } = useCustomerAddresses(effectiveCustomerId)

  const defaultValues: RentalFormData = {
    customerId: "",
    deliveryAddressId: null,
    deliveryType: companySettings?.defaultDeliveryType === DeliveryType.PerRental
      ? DeliveryType.CompanyDelivery
      : (companySettings?.defaultDeliveryType || DeliveryType.CompanyDelivery),
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
    deliveryType: editData.deliveryType,
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
      productVariantId: item.productVariantId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      pricePeriodId: item.pricePeriodId,
      startDateTime: item.startDateTime ? item.startDateTime.slice(0, 16) : null,
      endDateTime: item.endDateTime ? item.endDateTime.slice(0, 16) : null,
      discountType: item.discountType || DiscountType.Percent,
      discountValue: item.discountValue || 0,
    })),
    services: editData.services.map((service) => ({
      extraServiceId: service.extraServiceId,
      assignedEmployeeId: service.assignedEmployeeId,
      assignedVehicleId: service.assignedVehicleId ?? null,
      quantity: service.quantity,
      unitPrice: service.unitPrice,
      pricePeriodId: service.pricePeriodId,
      startDateTime: service.startDateTime ? service.startDateTime.slice(0, 16) : null,
      endDateTime: service.endDateTime ? service.endDateTime.slice(0, 16) : null,
      discountType: service.discountType || DiscountType.Percent,
      discountValue: service.discountValue || 0,
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
    resolver: formResolver<RentalFormData>(rentalSchema),
    values: open ? formValues : defaultValues,
  })

  // Sekme bazlı navigasyon — submit hatası varsa tab SIRASINA göre ilk hatalı
  // sekmeye geç (önceki sekmedeki sorunlar çözülmeden bir sonrakine geçilmesin).
  const [activeTab, setActiveTab] = useState("general")
  const tabsOrder = ["general", "delivery", "items", "services", "summary"]
  const fieldToTab: Record<string, string> = {
    customerId: "general",
    plannedStartDate: "general",
    plannedEndDate: "general",
    currencyId: "general",
    exchangeRate: "general",
    discountType: "general",
    discountValue: "general",
    depositAmount: "general",
    notes: "general",
    deliveryType: "delivery",
    deliveryAddressId: "delivery",
    sourceWarehouseId: "delivery",
    deliveryVehicleId: "delivery",
    deliveryEmployeeId: "delivery",
    items: "items",
    services: "services",
  }
  const onInvalid = (formErrors: typeof errors) => {
    const errorKeys = Object.keys(formErrors)
    for (const tab of tabsOrder) {
      const hasErrorInTab = errorKeys.some((key) => fieldToTab[key] === tab)
      if (hasErrorInTab) {
        if (tab !== activeTab) setActiveTab(tab)
        return
      }
    }
  }

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
  // useWatch kullanarak items değişikliklerini reaktif olarak takip et
  const watchedItems = useWatch({ control, name: "items" })
  const watchedServices = useWatch({ control, name: "services" })
  const watchedPlannedStartDate = useWatch({ control, name: "plannedStartDate" })
  const watchedPlannedEndDate = useWatch({ control, name: "plannedEndDate" })
  const watchedRentalDiscountType = watch("discountType")
  const watchedRentalDiscountValue = watch("discountValue")
  const watchedDeliveryType = watch("deliveryType")
  const watchedSourceWarehouseId = watch("sourceWarehouseId")
  const watchedCurrencyId = watch("currencyId")
  const watchedExchangeRate = watch("exchangeRate")
  // Availability hook için reaktif izleme (useWatch — yeniden render tetikler)
  const watchedDeliveryVehicleId = useWatch({ control, name: "deliveryVehicleId" })
  const watchedDeliveryEmployeeId = useWatch({ control, name: "deliveryEmployeeId" })
  const watchedAvailabilityWarehouseId = useWatch({ control, name: "sourceWarehouseId" })

  // Hizmet kalemleri arası self-conflict tespiti.
  // Aynı personel veya aynı araç, çakışan zaman aralığında 2+ kaleme atanmışsa
  // ilgili index için { employee, vehicle } true olur. otherIndex çakışan ilk diğer satır.
  const serviceConflicts = useMemo(() => {
    const result: Record<
      number,
      {
        employee: boolean
        vehicle: boolean
        employeeOtherIndex: number | null
        vehicleOtherIndex: number | null
      }
    > = {}
    const services = watchedServices ?? []
    if (!watchedPlannedStartDate || !watchedPlannedEndDate) return result

    for (let i = 0; i < services.length; i++) {
      result[i] = {
        employee: false,
        vehicle: false,
        employeeOtherIndex: null,
        vehicleOtherIndex: null,
      }
    }

    for (let i = 0; i < services.length; i++) {
      for (let j = i + 1; j < services.length; j++) {
        const a = services[i]
        const b = services[j]
        if (!a || !b) continue

        const overlap = periodsOverlap(
          a.startDateTime,
          a.endDateTime,
          b.startDateTime,
          b.endDateTime,
          watchedPlannedStartDate,
          watchedPlannedEndDate,
        )
        if (!overlap) continue

        if (a.assignedEmployeeId && a.assignedEmployeeId === b.assignedEmployeeId) {
          result[i].employee = true
          if (result[i].employeeOtherIndex === null) result[i].employeeOtherIndex = j
          result[j].employee = true
          if (result[j].employeeOtherIndex === null) result[j].employeeOtherIndex = i
        }
        if (a.assignedVehicleId && a.assignedVehicleId === b.assignedVehicleId) {
          result[i].vehicle = true
          if (result[i].vehicleOtherIndex === null) result[i].vehicleOtherIndex = j
          result[j].vehicle = true
          if (result[j].vehicleOtherIndex === null) result[j].vehicleOtherIndex = i
        }
      }
    }

    return result
  }, [watchedServices, watchedPlannedStartDate, watchedPlannedEndDate])

  // Realtime availability batch isteği için form değerlerinden request oluştur.
  // plannedStart/EndDate "yyyy-MM-dd" formatında; backend'in DateTime parser'ı için
  // gün başlangıç/bitişine çeviriyoruz. Item ve servis tarih override'ları
  // datetime-local (yyyy-MM-ddTHH:mm) formatında — backend doğrudan parse eder.
  const availabilityRequest = useMemo<BatchAvailabilityRequest | null>(() => {
    if (!watchedPlannedStartDate || !watchedPlannedEndDate) return null

    const defaultStartDate = `${watchedPlannedStartDate}T00:00:00`
    const defaultEndDate = `${watchedPlannedEndDate}T23:59:59`

    const items = (watchedItems || [])
      .filter((item) => !!item?.productId)
      .map((item, idx) => ({
        itemKey: `item-${idx}`,
        productId: item.productId,
        productVariantId: item.productVariantId || undefined,
        inventoryId: item.inventoryId || undefined,
        quantity: item.quantity || 0,
        startDateTime: item.startDateTime || undefined,
        endDateTime: item.endDateTime || undefined,
      }))

    const vehicles = [
      ...(watchedDeliveryVehicleId
        ? [
            {
              itemKey: "delivery-vehicle",
              vehicleId: watchedDeliveryVehicleId,
              startDate: defaultStartDate,
              endDate: defaultStartDate, // teslimat tek gün slotu
            },
          ]
        : []),
      ...(watchedServices || [])
        .map((s, idx) =>
          s?.assignedVehicleId
            ? {
                itemKey: `service-vehicle-${idx}`,
                vehicleId: s.assignedVehicleId,
                startDate: s.startDateTime || defaultStartDate,
                endDate: s.endDateTime || defaultEndDate,
              }
            : null,
        )
        .filter((x): x is NonNullable<typeof x> => x !== null),
    ]

    const employees = [
      ...(watchedDeliveryEmployeeId
        ? [
            {
              itemKey: "delivery-employee",
              employeeId: watchedDeliveryEmployeeId,
              startDate: defaultStartDate,
              endDate: defaultStartDate, // teslimat tek gün slotu
            },
          ]
        : []),
      ...(watchedServices || [])
        .map((s, idx) =>
          s?.assignedEmployeeId
            ? {
                itemKey: `service-employee-${idx}`,
                employeeId: s.assignedEmployeeId,
                startDate: s.startDateTime || defaultStartDate,
                endDate: s.endDateTime || defaultEndDate,
              }
            : null,
        )
        .filter((x): x is NonNullable<typeof x> => x !== null),
    ]

    return {
      excludeRentalId: editId || undefined,
      defaultStartDate,
      defaultEndDate,
      warehouseId: watchedAvailabilityWarehouseId || undefined,
      items,
      vehicles,
      employees,
    }
  }, [
    watchedPlannedStartDate,
    watchedPlannedEndDate,
    watchedAvailabilityWarehouseId,
    watchedDeliveryVehicleId,
    watchedDeliveryEmployeeId,
    watchedItems,
    watchedServices,
    editId,
  ])

  const {
    data: availabilityData,
    isLoading: availabilityLoading,
    error: availabilityError,
  } = useAvailabilityBatch(availabilityRequest)

  // Müsaitlik isteği başarısız olduğunda kullanıcıya tek seferlik toast gösterilir.
  // Aynı error referansı için tekrar tetiklenmez; recovery durumunda ref sıfırlanır
  // ve sonraki bir hata yeniden gösterilebilir.
  const availabilityErrorReportedRef = useRef<unknown>(null)
  useEffect(() => {
    if (availabilityError && availabilityError !== availabilityErrorReportedRef.current) {
      toast.warning(
        "Müsaitlik bilgileri kontrol edilemedi. Form gönderildiğinde sunucu yeniden kontrol edecek.",
      )
      availabilityErrorReportedRef.current = availabilityError
    } else if (!availabilityError) {
      availabilityErrorReportedRef.current = null
    }
  }, [availabilityError])

  // UI'da hızlı erişim için itemKey -> result lookup map
  const availabilityMap = useMemo(() => {
    const map = new Map<string, BatchAvailabilityItemResult>()
    if (!availabilityData?.results) return map
    for (const r of availabilityData.results) {
      map.set(r.itemKey, r)
    }
    return map
  }, [availabilityData])

  // Seçili para birimi TL mi? (TL varsayılan olarak ID=1 kabul ediyoruz)
  // Eğer currencies'den TL'nin ID'sini bulmak istersek currencies listesini kontrol edebiliriz
  const selectedCurrency = currencies?.find(c => c.value === watchedCurrencyId)
  const isTRY = !watchedCurrencyId || selectedCurrency?.text?.includes("TL") || selectedCurrency?.text?.includes("TRY")

  // Ürün tutarı hesaplama fonksiyonu
  const calculateItemTotal = (index: number) => {
    const item = watchedItems?.[index]
    if (!item) return { lineTotal: 0 }

    const quantity = item.quantity || 0
    const unitPrice = item.unitPrice || 0
    const discountType = item.discountType || DiscountType.Percent
    const discountValue = item.discountValue || 0

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

    return { grossTotal, discountAmount, lineTotal }
  }

  // Hizmet tutarı hesaplama fonksiyonu
  const calculateServiceTotal = (index: number) => {
    const service = watchedServices?.[index]
    if (!service) return { lineTotal: 0 }

    const quantity = service.quantity || 0
    const unitPrice = service.unitPrice || 0
    const discountType = service.discountType || DiscountType.Percent
    const discountValue = service.discountValue || 0

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

    return { grossTotal, discountAmount, lineTotal }
  }

  // Tüm toplamları hesapla
  const calculateTotals = () => {
    // Ürün toplamları
    let itemsGrossTotal = 0
    let itemsDiscountTotal = 0
    let itemsLineTotal = 0

    watchedItems?.forEach((_, index) => {
      const calc = calculateItemTotal(index)
      itemsGrossTotal += calc.grossTotal || 0
      itemsDiscountTotal += calc.discountAmount || 0
      itemsLineTotal += calc.lineTotal || 0
    })

    // Hizmet toplamları
    let servicesGrossTotal = 0
    let servicesDiscountTotal = 0
    let servicesLineTotal = 0

    watchedServices?.forEach((_, index) => {
      const calc = calculateServiceTotal(index)
      servicesGrossTotal += calc.grossTotal || 0
      servicesDiscountTotal += calc.discountAmount || 0
      servicesLineTotal += calc.lineTotal || 0
    })

    // Ara toplam (ürün + hizmet indirimleri uygulanmış)
    const subtotal = itemsLineTotal + servicesLineTotal

    // Genel indirim SubTotal üzerinden hesaplanır
    let generalDiscountAmount = 0
    if (watchedRentalDiscountType === DiscountType.Percent) {
      generalDiscountAmount = subtotal * ((watchedRentalDiscountValue || 0) / 100)
    } else {
      generalDiscountAmount = watchedRentalDiscountValue || 0
    }

    // Genel toplam = Ara toplam - Genel indirim
    const grandTotal = subtotal - generalDiscountAmount

    // Depozito (ayrı gösterilir, toplama dahil değil - iade edilecek güvence bedeli)
    const depositAmount = watch("depositAmount") || 0

    return {
      itemsGrossTotal,
      itemsDiscountTotal,
      itemsLineTotal,
      servicesGrossTotal,
      servicesDiscountTotal,
      servicesLineTotal,
      subtotal,
      generalDiscountAmount,
      grandTotal,
      depositAmount,
    }
  }

  const totals = calculateTotals()

  useEffect(() => {
    setSelectedCustomerId(watchedCustomerId)
  }, [watchedCustomerId])

  // Müşterinin tek adresi varsa otomatik seç
  useEffect(() => {
    if (customerAddresses && customerAddresses.length === 1 && !isEditMode) {
      setValue("deliveryAddressId", customerAddresses[0].id)
    }
  }, [customerAddresses, setValue, isEditMode])

  // Tek araç veya personel varsa otomatik ata (sadece CompanyDelivery modunda)
  // Not: Depo otomatik ataması WarehouseSelect bileşeni tarafından yapılır
  useEffect(() => {
    if (!isEditMode && open && watchedDeliveryType === DeliveryType.CompanyDelivery) {
      if (vehicles && vehicles.length === 1) {
        setValue("deliveryVehicleId", vehicles[0].id)
      }
      if (employees && employees.length === 1) {
        setValue("deliveryEmployeeId", employees[0].id)
      }
    }
  }, [vehicles, employees, setValue, isEditMode, open, watchedDeliveryType])

  // Müşteri teslim alır seçildiğinde teslimat alanlarını temizle
  useEffect(() => {
    if (watchedDeliveryType === DeliveryType.CustomerPickup) {
      setValue("deliveryVehicleId", null)
      setValue("deliveryEmployeeId", null)
      setValue("deliveryAddressId", null)
    }
  }, [watchedDeliveryType, setValue])

  // Dialog yeniden açıldığında nakliye banner state'ini sıfırla
  useEffect(() => {
    if (open) {
      setTransportBannerDismissed(false)
      setSelectedTransportServiceId("")
      setBulkServiceId("")
      setBulkCount(1)
    }
  }, [open])

  // Depo değiştiğinde tracked ürünlerin inventoryId'sini temizle
  useEffect(() => {
    if (!watchedItems || !products) return
    watchedItems.forEach((item, index) => {
      if (!item.productId || !item.inventoryId) return
      const product = products.find((p) => p.id === item.productId)
      if (product?.type === ProductType.Tracked) {
        setValue(`items.${index}.inventoryId`, null)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSourceWarehouseId])

  // Ürün kuralına göre hedef ürün ekleme fonksiyonu
  const addProductByRule = (targetProductId: string, quantity: number) => {
    const targetProduct = products?.find((p) => p.id === targetProductId)
    if (!targetProduct) return

    // Zaten eklenmişse miktar güncelle
    const existingIndex = watchedItems?.findIndex((item) => item.productId === targetProductId)
    if (existingIndex !== undefined && existingIndex >= 0) {
      const currentQty = watchedItems?.[existingIndex]?.quantity || 0
      setValue(`items.${existingIndex}.quantity`, currentQty + quantity)
      return
    }

    // Yeni ürün olarak ekle
    const previousItems = watch("items")
    const lastItem = previousItems.length > 0 ? previousItems[previousItems.length - 1] : null
    const newIndex = previousItems.length

    appendItem({
      productId: targetProductId,
      productVariantId: null,
      inventoryId: null,
      quantity: quantity,
      unitPrice: targetProduct.basePrice,
      pricePeriodId: targetProduct.pricePeriodId || companySettings?.defaultPricePeriodId || null,
      startDateTime: null,
      endDateTime: null,
      discountType: lastItem?.discountType ?? DiscountType.Percent,
      discountValue: 0,
    })

    // Yeni eklenen kalemi otomatik aç
    setOpenItems((prev) => new Set(prev).add(newIndex))
  }

  // Ürün kurallarını işle (sadece Automatic davranış için)
  // Suggested ve Required öneriler useEffect tarafından yönetiliyor
  const processProductRules = (sourceProductId: string, sourceQuantity: number) => {
    if (!productRules || !sourceProductId) return

    // Bu ürün için otomatik kuralları bul
    const automaticRules = productRules.filter(
      (rule) =>
        rule.sourceProductId === sourceProductId &&
        rule.isActive &&
        rule.behavior === ProductRuleBehavior.Automatic &&
        rule.targetProductId
    )

    automaticRules.forEach((rule) => {
      // Miktar hesapla
      let quantityToAdd = rule.quantity
      if (rule.type === ProductRuleType.Ratio) {
        quantityToAdd = Math.ceil(rule.quantity * sourceQuantity)
      }

      // Hedef ürün zaten ekliyse miktar güncelle veya yeni ekle
      addProductByRule(rule.targetProductId!, quantityToAdd)
      toast.success(
        `"${rule.targetProductName}" otomatik olarak eklendi (${quantityToAdd} adet)`,
        { duration: 3000 }
      )
    })
  }

  // Öneriyi kabul et
  const acceptSuggestion = (suggestion: RuleSuggestion, customQuantity?: number) => {
    if (suggestion.targetProductId) {
      // Kullanıcının belirlediği miktar veya varsayılan miktar
      const quantityToAdd = customQuantity ?? suggestionQuantities[suggestion.id] ?? suggestion.quantity
      addProductByRule(suggestion.targetProductId, quantityToAdd)
    }
    // Öneriyi listeden kaldır
    setRuleSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
    // Miktar state'ini temizle
    setSuggestionQuantities((prev) => {
      const next = { ...prev }
      delete next[suggestion.id]
      return next
    })
  }

  // Öneri miktarını güncelle
  const updateSuggestionQuantity = (suggestionId: string, quantity: number) => {
    setSuggestionQuantities((prev) => ({
      ...prev,
      [suggestionId]: Math.max(1, quantity),
    }))
  }

  // Öneriyi reddet (sadece Suggested tipi için)
  const dismissSuggestion = (suggestionId: string) => {
    // ID'yi dismissed listesine ekle
    setDismissedSuggestionIds((prev) => new Set(prev).add(suggestionId))
    // Öneriyi listeden kaldır
    setRuleSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
  }

  // Ürün kaldırıldığında ilgili önerileri de temizle
  const handleRemoveItem = (index: number) => {
    const removedProductId = watchedItems?.[index]?.productId
    if (removedProductId) {
      // Bu ürünün tetiklediği önerileri kaldır
      setRuleSuggestions((prev) => prev.filter((s) => s.sourceProductId !== removedProductId))
    }
    removeItem(index)
  }

  // Ürün listesi değiştiğinde önerileri yeniden hesapla
  useEffect(() => {
    if (!productRules || !products) return

    const currentItems = watchedItems || []

    // Tüm ürünlerin miktarlarını topla
    const productQuantities = new Map<string, number>()
    currentItems.forEach((item) => {
      if (!item.productId) return
      const current = productQuantities.get(item.productId) || 0
      productQuantities.set(item.productId, current + (item.quantity || 1))
    })

    // VEYA gruplarını bul ve karşılanmış olanları belirle
    // NOT: Gruptaki TÜM ürünlerin TOPLAM miktarı >= gerekli miktar ise grup karşılanmış sayılır
    const satisfiedGroups = new Set<string>()

    // Önce grupları ve gerekli miktarları hesapla
    const groupInfo = new Map<string, { requiredQuantity: number; totalExisting: number }>()

    productRules.forEach((rule) => {
      if (!rule.ruleGroupId || !rule.isActive) return

      // Kaynak ürünün toplam miktarını hesapla
      const sourceQuantity = productQuantities.get(rule.sourceProductId) || 0
      if (sourceQuantity === 0) return // Kaynak ürün yoksa kontrol etme

      // Gerekli miktar (tüm kurallar aynı kaynak için aynı miktarı gerektirir)
      const requiredQuantity = Math.ceil(rule.quantity * sourceQuantity)

      // Hedef ürünün mevcut miktarı
      const existingQuantity = rule.targetProductId
        ? (productQuantities.get(rule.targetProductId) || 0)
        : 0

      // Grup bilgisini güncelle
      const existing = groupInfo.get(rule.ruleGroupId)
      if (existing) {
        // Gruptaki tüm hedef ürünlerin toplamını hesapla
        existing.totalExisting += existingQuantity
      } else {
        groupInfo.set(rule.ruleGroupId, {
          requiredQuantity,
          totalExisting: existingQuantity,
        })
      }
    })

    // Toplam miktar yeterliyse grubu karşılanmış say, değilse eksik miktarı kaydet
    const groupMissingQuantity = new Map<string, number>()
    groupInfo.forEach((info, groupId) => {
      if (info.totalExisting >= info.requiredQuantity) {
        satisfiedGroups.add(groupId)
      } else {
        // Grup bazında eksik miktar
        groupMissingQuantity.set(groupId, info.requiredQuantity - info.totalExisting)
      }
    })

    // Tüm önerileri yeniden hesapla
    const newSuggestions: RuleSuggestion[] = []

    productQuantities.forEach((totalQuantity, productId) => {
      const sourceProduct = products.find((p) => p.id === productId)
      if (!sourceProduct) return

      // Bu kaynak için aktif kuralları bul
      const applicableRules = productRules.filter(
        (rule) =>
          rule.sourceProductId === productId &&
          rule.isActive &&
          rule.behavior !== ProductRuleBehavior.Automatic
      )

      applicableRules.forEach((rule) => {
        // VEYA grubu karşılanmışsa atla
        if (rule.ruleGroupId && satisfiedGroups.has(rule.ruleGroupId)) return

        // Dismissed listesinde ve Required değilse atla
        if (dismissedSuggestionIds.has(rule.id) && rule.behavior !== ProductRuleBehavior.Required) return

        // Gerekli miktar hesapla (toplam kaynak miktarına göre)
        const requiredQuantity = Math.ceil(rule.quantity * totalQuantity)

        // VEYA grubu için: grup bazında eksik miktarı kullan
        if (rule.ruleGroupId) {
          const groupMissing = groupMissingQuantity.get(rule.ruleGroupId)
          if (!groupMissing || groupMissing <= 0) return // Grup karşılanmış

          newSuggestions.push({
            id: rule.id,
            sourceProductId: rule.sourceProductId,
            sourceProductName: sourceProduct.name,
            targetProductId: rule.targetProductId,
            targetProductName: rule.targetProductName,
            targetCategoryId: rule.targetCategoryId,
            targetCategoryName: rule.targetCategoryName,
            quantity: groupMissing, // Grup bazında eksik miktar
            behavior: rule.behavior,
            type: rule.type,
            ruleGroupId: rule.ruleGroupId,
          })
          return
        }

        // Bağımsız kural için: ürün bazında eksik miktarı hesapla
        const existingQuantity = rule.targetProductId
          ? (productQuantities.get(rule.targetProductId) || 0)
          : 0

        // Eksik miktar
        const missingQuantity = requiredQuantity - existingQuantity

        // Eksik yoksa öneri oluşturma
        if (missingQuantity <= 0) return

        newSuggestions.push({
          id: rule.id,
          sourceProductId: rule.sourceProductId,
          sourceProductName: sourceProduct.name,
          targetProductId: rule.targetProductId,
          targetProductName: rule.targetProductName,
          targetCategoryId: rule.targetCategoryId,
          targetCategoryName: rule.targetCategoryName,
          quantity: missingQuantity,
          behavior: rule.behavior,
          type: rule.type,
          ruleGroupId: rule.ruleGroupId,
        })
      })
    })

    // Önerileri tamamen yenile (miktar güncellemeleri için)
    setRuleSuggestions(newSuggestions)
  }, [watchedItems, productRules, products, dismissedSuggestionIds])

  // Ürün seçildiğinde fiyat ve periyodu otomatik doldur
  const handleProductChange = (index: number, productId: string) => {
    // Ürün değiştiğinde varyantı ve envanteri temizle
    setValue(`items.${index}.productVariantId`, null)
    setValue(`items.${index}.inventoryId`, null)
    const product = products?.find((p) => p.id === productId)
    if (product) {
      setValue(`items.${index}.unitPrice`, product.basePrice)
      setValue(`items.${index}.pricePeriodId`, product.pricePeriodId)

      // Tracked ürünlerde miktar 1'e kilitlenir
      if (product.type === ProductType.Tracked) {
        setValue(`items.${index}.quantity`, 1)
      }

      // Yeni ürün eklendiğinde kuralları kontrol et
      const currentQuantity = watchedItems?.[index]?.quantity || 1
      processProductRules(productId, currentQuantity)
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
      // Personel gerektirmiyorsa atanan personeli temizle
      if (!service.requiresEmployee) {
        setValue(`services.${index}.assignedEmployeeId`, null)
      }
      // Araç gerektirmiyorsa atanan aracı temizle
      if (!service.requiresVehicle) {
        setValue(`services.${index}.assignedVehicleId`, null)
      }
    } else {
      setValue(`services.${index}.unitPrice`, 0)
      setValue(`services.${index}.pricePeriodId`, null)
      setValue(`services.${index}.assignedEmployeeId`, null)
      setValue(`services.${index}.assignedVehicleId`, null)
    }
  }

  // Edit modunda müşteri adreslerini yüklemek için selectedCustomerId'yi güncelle
  useEffect(() => {
    if (open && isEditMode && editData) {
      setSelectedCustomerId(editData.customerId)
    } else if (!open) {
      setSelectedCustomerId("")
      // Dialog kapandığında state'leri sıfırla
      setOpenItems(new Set())
      setOpenItemAdvanced(new Set())
      setOpenServices(new Set())
      setOpenServiceAdvanced(new Set())
      setRuleSuggestions([])
      setDismissedSuggestionIds(new Set())
      setSuggestionQuantities({})
      setIsPriceSummaryOpen(true)
    }
  }, [open, isEditMode, editData])

  // Toggle fonksiyonları
  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleItemAdvanced = (index: number) => {
    setOpenItemAdvanced((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleService = (index: number) => {
    setOpenServices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleServiceAdvanced = (index: number) => {
    setOpenServiceAdvanced((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Ürün adını bul
  const getProductName = (productId: string) => {
    return products?.find((p) => p.id === productId)?.name || "Ürün seçiniz..."
  }

  // Hizmet adını bul
  const getServiceName = (serviceId: string) => {
    return extraServices?.find((s) => s.id === serviceId)?.name || "Hizmet seçiniz..."
  }

  // Periyot adını bul
  const getPeriodName = (periodId: number | null | undefined) => {
    if (!periodId) return ""
    return pricePeriods?.find((p) => p.value === periodId)?.text || ""
  }

  // Bekleyen zorunlu kuralları kontrol et
  const getRequiredSuggestions = () => {
    return ruleSuggestions.filter((s) => s.behavior === ProductRuleBehavior.Required)
  }

  const onSubmit = async (data: RentalFormData) => {
    // Bekleyen zorunlu kuralları kontrol et
    const requiredSuggestions = getRequiredSuggestions()
    if (requiredSuggestions.length > 0) {
      toast.error(
        `${requiredSuggestions.length} zorunlu ürün kuralı karşılanmadı. Lütfen ürünler sekmesindeki uyarıları kontrol edin.`,
        { duration: 5000 }
      )
      return
    }
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
          assignedVehicleId: service.assignedVehicleId || null,
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
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Kiralama Düzenle" : "Yeni Kiralama"}</DialogTitle>
          <DialogDescription>Kiralama bilgilerini girin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {availabilityError && (
            <div
              role="alert"
              className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Müsaitlik kontrolü şu an yapılamıyor. Kaydetme sırasında sunucu kontrolü yine yapılacak.
              </span>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="delivery">Teslimat</TabsTrigger>
              <TabsTrigger value="items">Ürünler</TabsTrigger>
              <TabsTrigger value="services">Hizmetler</TabsTrigger>
              <TabsTrigger value="summary">Özet</TabsTrigger>
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
                  <Label>Para Birimi</Label>
                  <Controller
                    control={control}
                    name="currencyId"
                    render={({ field }) => (
                      <Select
                        key={`currencyId-${field.value}`}
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

                <div className="space-y-2">
                  <Label>Başlangıç Tarihi *</Label>
                  <Controller
                    control={control}
                    name="plannedStartDate"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Başlangıç tarihi seçiniz"
                      />
                    )}
                  />
                  {errors.plannedStartDate && (
                    <p className="text-sm text-destructive">{errors.plannedStartDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Bitiş Tarihi *</Label>
                  <Controller
                    control={control}
                    name="plannedEndDate"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Bitiş tarihi seçiniz"
                        minDate={watchedPlannedStartDate || undefined}
                      />
                    )}
                  />
                  {errors.plannedEndDate && (
                    <p className="text-sm text-destructive">{errors.plannedEndDate.message}</p>
                  )}
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
                        key={`discountType-${field.value}`}
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
                {companySettings?.defaultDeliveryType === DeliveryType.PerRental && (
                  <div className="space-y-2">
                    <Label>Teslimat Tipi</Label>
                    <Controller
                      control={control}
                      name="deliveryType"
                      render={({ field }) => (
                        <Select
                          key={`deliveryType-${field.value}`}
                          value={String(field.value)}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Teslimat tipi seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={String(DeliveryType.CustomerPickup)}>Müşteri Teslim Alır</SelectItem>
                            <SelectItem value={String(DeliveryType.CompanyDelivery)}>Teslimatı Biz Yapıyoruz</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                <Controller
                  control={control}
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <WarehouseSelect
                      value={field.value}
                      onChange={field.onChange}
                      label="Kaynak Depo"
                    />
                  )}
                />

                {watchedDeliveryType === DeliveryType.CompanyDelivery && (
                  <>
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
                      <Label>Teslimat Aracı</Label>
                      <Controller
                        control={control}
                        name="deliveryVehicleId"
                        render={({ field }) => (
                          <Select
                            value={field.value || "none"}
                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                            disabled={vehicles?.length === 1}
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
                      {watchedDeliveryVehicleId && (
                        <AvailabilityBadge
                          isLoading={availabilityLoading}
                          result={availabilityMap.get("delivery-vehicle")}
                        />
                      )}
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
                            disabled={employees?.length === 1}
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
                      {watchedDeliveryEmployeeId && (
                        <AvailabilityBadge
                          isLoading={availabilityLoading}
                          result={availabilityMap.get("delivery-employee")}
                        />
                      )}
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
                    const newIndex = items.length

                    appendItem({
                      productId: "",
                      productVariantId: null,
                      inventoryId: null,
                      quantity: 1,
                      unitPrice: 0,
                      pricePeriodId: companySettings?.defaultPricePeriodId || null,
                      startDateTime: null,
                      endDateTime: null,
                      discountType: lastItem?.discountType ?? DiscountType.Percent,
                      discountValue: 0,
                    })

                    // Yeni eklenen kalemi otomatik aç
                    setOpenItems((prev) => new Set(prev).add(newIndex))
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ürün Ekle
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
                <div className="space-y-2">
                  {itemFields.map((field, index) => {
                    const item = watchedItems?.[index]
                    const calc = calculateItemTotal(index)
                    const productName = getProductName(item?.productId || "")
                    const periodName = getPeriodName(item?.pricePeriodId)
                    const isOpen = openItems.has(index)
                    const isAdvancedOpen = openItemAdvanced.has(index)
                    const formatCurrency = (val: number) => val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                    return (
                      <Collapsible
                        key={field.id}
                        open={isOpen}
                        onOpenChange={() => toggleItem(index)}
                        className="border rounded-lg"
                      >
                        {/* Başlık - Her Zaman Görünür */}
                        <div className="flex items-center gap-2 p-3 bg-muted/30">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <span className="font-medium truncate">
                              {productName}
                            </span>
                            {item?.productId && (
                              <>
                                <span className="text-muted-foreground text-sm">
                                  ×{item?.quantity || 0}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  @{formatCurrency(item?.unitPrice || 0)}
                                  {periodName && `/${periodName}`}
                                </span>
                                <span className="text-primary font-medium">
                                  = {formatCurrency(calc.lineTotal || 0)}
                                </span>
                                {(calc.discountAmount || 0) > 0 && (
                                  <span className="text-orange-600 text-xs">
                                    (-%{item?.discountValue})
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {item?.productId && (
                            <AvailabilityBadge
                              isLoading={availabilityLoading}
                              result={availabilityMap.get(`item-${index}`)}
                            />
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveItem(index)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Detay İçeriği */}
                        <CollapsibleContent>
                          <div className="p-4 pt-2 space-y-4 border-t">
                            {/* Temel Alanlar */}
                            <div className="grid grid-cols-4 gap-4">
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

                              <Controller
                                control={control}
                                name={`items.${index}.productVariantId`}
                                render={({ field: variantField }) => (
                                  <RentalItemVariantSelect
                                    productId={watchedItems?.[index]?.productId || ""}
                                    value={variantField.value}
                                    onChange={variantField.onChange}
                                  />
                                )}
                              />

                              {/* Tracked ürünlerde envanter seçimi */}
                              {(() => {
                                const selectedProduct = products?.find(p => p.id === watchedItems?.[index]?.productId)
                                if (selectedProduct?.type !== ProductType.Tracked) return null
                                return (
                                  <Controller
                                    control={control}
                                    name={`items.${index}.inventoryId`}
                                    render={({ field: inventoryField }) => (
                                      <RentalItemInventorySelect
                                        productId={watchedItems?.[index]?.productId || ""}
                                        productVariantId={watchedItems?.[index]?.productVariantId}
                                        warehouseId={watchedSourceWarehouseId}
                                        value={inventoryField.value}
                                        onChange={inventoryField.onChange}
                                      />
                                    )}
                                  />
                                )
                              })()}

                              <div className="space-y-2">
                                <Label>Miktar *</Label>
                                <Input
                                  type="number"
                                  step="1"
                                  disabled={products?.find(p => p.id === watchedItems?.[index]?.productId)?.type === ProductType.Tracked}
                                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Birim Fiyat *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Periyot</Label>
                                <Controller
                                  control={control}
                                  name={`items.${index}.pricePeriodId`}
                                  render={({ field }) => (
                                    <Select
                                      key={`item-pricePeriod-${index}-${field.value}`}
                                      value={field.value ? String(field.value) : "none"}
                                      onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Periyot" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Seçiniz</SelectItem>
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
                            </div>

                            {/* Gelişmiş Seçenekler */}
                            <Collapsible
                              open={isAdvancedOpen}
                              onOpenChange={() => toggleItemAdvanced(index)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Settings2 className="h-4 w-4" />
                                  Gelişmiş Seçenekler
                                  {isAdvancedOpen ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>

                              <CollapsibleContent className="pt-4 space-y-4">
                                {/* Özel Tarihler */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Özel Başlangıç</Label>
                                    <Input
                                      type="datetime-local"
                                      {...register(`items.${index}.startDateTime`)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Boş = kiralama tarihi
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Özel Bitiş</Label>
                                    <Input
                                      type="datetime-local"
                                      {...register(`items.${index}.endDateTime`)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Boş = kiralama tarihi
                                    </p>
                                  </div>
                                </div>

                                {/* İndirim Ayarları */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>İndirim Tipi</Label>
                                    <Controller
                                      control={control}
                                      name={`items.${index}.discountType`}
                                      render={({ field }) => (
                                        <Select
                                          key={`item-discountType-${index}-${field.value}`}
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

                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Hesaplama Özeti */}
                            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
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
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}
                </div>
              )}

              {/* Kural Önerileri */}
              {ruleSuggestions.length > 0 && (() => {
                // Önerileri grupla: VEYA grupları ve bağımsız kurallar
                const groupedSuggestions = ruleSuggestions.reduce((acc, suggestion) => {
                  const key = suggestion.ruleGroupId || `individual_${suggestion.id}`
                  if (!acc[key]) {
                    acc[key] = []
                  }
                  acc[key].push(suggestion)
                  return acc
                }, {} as Record<string, RuleSuggestion[]>)

                // Tek öneri bileşeni render fonksiyonu
                const renderSuggestion = (suggestion: RuleSuggestion, isInGroup: boolean = false) => {
                  const currentQuantity = suggestionQuantities[suggestion.id] ?? suggestion.quantity
                  return (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{suggestion.sourceProductName}</span>
                          {" için "}
                          {suggestion.type === ProductRuleType.FromGroup ? (
                            <>
                              <span className="font-medium">{suggestion.targetCategoryName}</span>
                              {" kategorisinden ürün"}
                            </>
                          ) : (
                            <span className="font-medium">{suggestion.targetProductName}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {suggestion.targetProductId && (
                          <>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={1}
                                value={currentQuantity}
                                onChange={(e) => updateSuggestionQuantity(suggestion.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-center text-sm"
                              />
                              <span className="text-xs text-muted-foreground">adet</span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => acceptSuggestion(suggestion)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Ekle
                            </Button>
                          </>
                        )}
                        {!isInGroup && suggestion.behavior !== ProductRuleBehavior.Required && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissSuggestion(suggestion.id)}
                          >
                            Geç
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm font-medium">Ürün Kuralları</Label>
                    <div className="space-y-3">
                      {Object.entries(groupedSuggestions).map(([groupKey, suggestions]) => {
                        // VEYA grubu (birden fazla öneri)
                        if (suggestions.length > 1 && suggestions[0].ruleGroupId) {
                          const isRequired = suggestions.some(s => s.behavior === ProductRuleBehavior.Required)
                          return (
                            <div
                              key={groupKey}
                              className={`rounded-lg border-2 border-dashed p-3 ${
                                isRequired
                                  ? "border-amber-500/50 bg-amber-500/5"
                                  : "border-blue-500/30 bg-blue-500/5"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  isRequired
                                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                    : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                }`}>
                                  VEYA
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Aşağıdakilerden birini ekleyin
                                  {isRequired && (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium"> (zorunlu)</span>
                                  )}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {suggestions.map((suggestion, idx) => (
                                  <div key={suggestion.id}>
                                    {renderSuggestion(suggestion, true)}
                                    {idx < suggestions.length - 1 && (
                                      <div className="flex items-center justify-center my-2">
                                        <span className="text-xs text-muted-foreground">veya</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        }

                        // Tekil öneri (bağımsız kural veya tek üyeli grup)
                        return renderSuggestion(suggestions[0])
                      })}
                    </div>
                  </div>
                )
              })()}
            </TabsContent>

            {/* Ek Hizmetler */}
            <TabsContent value="services" className="space-y-4 mt-4">
              {/* Nakliye eksik uyarı banner'ı */}
              {(() => {
                const transportOptions = extraServices?.filter(
                  (es) => es.serviceType === ServiceType.Transport
                ) || []
                const hasTransportService = watchedServices?.some((s) => {
                  const matched = extraServices?.find((es) => es.id === s.extraServiceId)
                  return matched?.serviceType === ServiceType.Transport
                }) ?? false
                const showTransportBanner =
                  watchedDeliveryType === DeliveryType.CompanyDelivery &&
                  !hasTransportService &&
                  !transportBannerDismissed &&
                  transportOptions.length > 0

                if (!showTransportBanner) return null

                return (
                  <div
                    role="alert"
                    className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-900"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-yellow-700" />
                      <div className="flex-1 space-y-2">
                        <div className="space-y-1">
                          <p className="font-semibold">Nakliye hizmeti eklenmedi</p>
                          <p className="text-sm">
                            Şirket teslimatı seçtiniz. Bir nakliye hizmeti eklemek ister misiniz?
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Select
                            value={selectedTransportServiceId || "none"}
                            onValueChange={(value) => {
                              if (value === "none") return
                              const transportSvc = extraServices?.find((es) => es.id === value)
                              if (!transportSvc) return

                              const services = watch("services")
                              const lastService = services.length > 0 ? services[services.length - 1] : null
                              const newIndex = services.length

                              appendService({
                                extraServiceId: transportSvc.id,
                                assignedEmployeeId:
                                  transportSvc.requiresEmployee && employees?.length === 1
                                    ? employees[0].id
                                    : null,
                                assignedVehicleId:
                                  transportSvc.requiresVehicle && vehicles?.length === 1
                                    ? vehicles[0].id
                                    : null,
                                quantity: 1,
                                unitPrice: transportSvc.price || 0,
                                pricePeriodId:
                                  transportSvc.pricePeriodId ||
                                  companySettings?.defaultPricePeriodId ||
                                  null,
                                startDateTime: null,
                                endDateTime: null,
                                discountType: lastService?.discountType ?? DiscountType.Percent,
                                discountValue: 0,
                                notes: "",
                              })

                              // Eklenen nakliye satırını otomatik aç
                              setOpenServices((prev) => new Set(prev).add(newIndex))
                              // Dropdown'ı sıfırla
                              setSelectedTransportServiceId("")
                            }}
                          >
                            <SelectTrigger className="w-[260px] bg-white">
                              <SelectValue placeholder="Nakliye türü seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>
                                Nakliye türü seçiniz
                              </SelectItem>
                              {transportOptions.map((es) => (
                                <SelectItem key={es.id} value={es.id}>
                                  {es.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-yellow-900 hover:bg-yellow-100"
                            onClick={() => setTransportBannerDismissed(true)}
                          >
                            Bu kiralamada gerekmiyor
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

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
                    const newIndex = services.length

                    appendService({
                      extraServiceId: singleService?.id || "",
                      assignedEmployeeId: (singleService?.requiresEmployee && employees?.length === 1) ? employees[0].id : null,
                      assignedVehicleId: (singleService?.requiresVehicle && vehicles?.length === 1) ? vehicles[0].id : null,
                      quantity: 1,
                      unitPrice: singleService?.price || 0,
                      pricePeriodId: singleService?.pricePeriodId || companySettings?.defaultPricePeriodId || null,
                      startDateTime: null,
                      endDateTime: null,
                      discountType: lastService?.discountType ?? DiscountType.Percent,
                      discountValue: 0,
                      notes: "",
                    })

                    // Yeni eklenen hizmeti otomatik aç
                    setOpenServices((prev) => new Set(prev).add(newIndex))
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Hizmet Ekle
                </Button>
              </div>

              {/* Toplu Ekle inline yardımcı: Seçilen hizmetten N adet satır oluşturur */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Toplu Ekle:</span>
                <Select
                  value={bulkServiceId || "none"}
                  onValueChange={(value) => setBulkServiceId(value === "none" ? "" : value)}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Hizmet seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Hizmet seçiniz
                    </SelectItem>
                    {extraServices?.map((es) => (
                      <SelectItem key={es.id} value={es.id}>
                        {es.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={bulkCount}
                  onChange={(e) => {
                    const raw = Number(e.target.value)
                    if (Number.isNaN(raw)) {
                      setBulkCount(1)
                      return
                    }
                    const clamped = Math.max(1, Math.min(50, Math.floor(raw)))
                    setBulkCount(clamped)
                  }}
                  className="w-[80px]"
                  placeholder="Adet"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !bulkServiceId ||
                    bulkCount < 1 ||
                    bulkCount > 50 ||
                    isLoadingExtraServices
                  }
                  onClick={() => {
                    const selectedSvc = extraServices?.find((es) => es.id === bulkServiceId)
                    if (!selectedSvc) return

                    const services = watch("services")
                    const lastService = services.length > 0 ? services[services.length - 1] : null
                    const startIndex = services.length
                    const safeCount = Math.max(1, Math.min(50, Math.floor(bulkCount)))

                    for (let i = 0; i < safeCount; i++) {
                      appendService({
                        extraServiceId: selectedSvc.id,
                        assignedEmployeeId:
                          selectedSvc.requiresEmployee && employees?.length === 1
                            ? employees[0].id
                            : null,
                        assignedVehicleId:
                          selectedSvc.requiresVehicle && vehicles?.length === 1
                            ? vehicles[0].id
                            : null,
                        quantity: 1,
                        unitPrice: selectedSvc.price || 0,
                        pricePeriodId:
                          selectedSvc.pricePeriodId ||
                          companySettings?.defaultPricePeriodId ||
                          null,
                        startDateTime: null,
                        endDateTime: null,
                        discountType: lastService?.discountType ?? DiscountType.Percent,
                        discountValue: 0,
                        notes: "",
                      })
                    }

                    // Yeni eklenen satırların hepsini otomatik aç
                    setOpenServices((prev) => {
                      const next = new Set(prev)
                      for (let i = 0; i < safeCount; i++) {
                        next.add(startIndex + i)
                      }
                      return next
                    })

                    // Formu sıfırla
                    setBulkServiceId("")
                    setBulkCount(1)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Toplu Ekle
                </Button>
              </div>

              {serviceFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Henüz ek hizmet eklenmemiş
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceFields.map((field, index) => {
                    const service = watchedServices?.[index]
                    const calc = calculateServiceTotal(index)
                    const serviceName = getServiceName(service?.extraServiceId || "")
                    const periodName = getPeriodName(service?.pricePeriodId)
                    const currencyCode = extraServices?.find(s => s.id === service?.extraServiceId)?.currencyCode || ""
                    const isOpen = openServices.has(index)
                    const isAdvancedOpen = openServiceAdvanced.has(index)
                    const formatCurrency = (val: number) => val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                    return (
                      <Collapsible
                        key={field.id}
                        open={isOpen}
                        onOpenChange={() => toggleService(index)}
                        className="border rounded-lg"
                      >
                        {/* Başlık - Her Zaman Görünür */}
                        <div className="flex items-center gap-2 p-3 bg-muted/30">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <div className="flex-1 flex items-center gap-3 min-w-0">
                            <span className="font-medium truncate">
                              {serviceName}
                            </span>
                            {service?.extraServiceId && (
                              <>
                                <span className="text-muted-foreground text-sm">
                                  ×{service?.quantity || 0}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                  @{formatCurrency(service?.unitPrice || 0)}
                                  {periodName && `/${periodName}`}
                                </span>
                                <span className="text-primary font-medium">
                                  = {formatCurrency(calc.lineTotal || 0)} {currencyCode}
                                </span>
                                {(calc.discountAmount || 0) > 0 && (
                                  <span className="text-orange-600 text-xs">
                                    (-%{service?.discountValue})
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeService(index)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Detay İçeriği */}
                        <CollapsibleContent>
                          <div className="p-4 pt-2 space-y-4 border-t">
                            {/* Temel Alanlar */}
                            <div className="grid grid-cols-4 gap-4">
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
                                        {extraServices?.map((svc) => (
                                          <SelectItem key={svc.id} value={svc.id}>
                                            {svc.name}
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

                              <div className="space-y-2">
                                <Label>Birim Fiyat *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`services.${index}.unitPrice`, { valueAsNumber: true })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Periyot</Label>
                                <Controller
                                  control={control}
                                  name={`services.${index}.pricePeriodId`}
                                  render={({ field }) => (
                                    <Select
                                      key={`service-pricePeriod-${index}-${field.value}`}
                                      value={field.value ? String(field.value) : "none"}
                                      onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Periyot" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Seçiniz</SelectItem>
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
                            </div>

                            {/* Personel, Araç ve Notlar */}
                            {(() => {
                              const selectedService = extraServices?.find(s => s.id === service?.extraServiceId)
                              const showEmployee = !!selectedService?.requiresEmployee
                              const showVehicle = !!selectedService?.requiresVehicle
                              const colCount = 1 + (showEmployee ? 1 : 0) + (showVehicle ? 1 : 0)
                              const gridClass =
                                colCount === 3 ? "grid-cols-3" : colCount === 2 ? "grid-cols-2" : "grid-cols-1"
                              const conflict = serviceConflicts[index]
                              const employeeConflict = !!conflict?.employee
                              const vehicleConflict = !!conflict?.vehicle
                              const employeeOtherIndex = conflict?.employeeOtherIndex ?? null
                              const vehicleOtherIndex = conflict?.vehicleOtherIndex ?? null
                              return (
                                <div className={`grid gap-4 ${gridClass}`}>
                                  {showEmployee && (
                                    <div className="space-y-2">
                                      <Label>Atanan Personel *</Label>
                                      <Controller
                                        control={control}
                                        name={`services.${index}.assignedEmployeeId`}
                                        render={({ field }) => (
                                          <Select
                                            key={`service-employee-${index}-${field.value ?? "none"}`}
                                            value={field.value || "none"}
                                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                                          >
                                            <SelectTrigger
                                              className={cn(
                                                employeeConflict && "border-red-500 focus:ring-red-500",
                                              )}
                                              title={
                                                employeeConflict && employeeOtherIndex !== null
                                                  ? `Bu personel ${employeeOtherIndex + 1}. hizmet kaleminde de bu zaman aralığında atanmış`
                                                  : undefined
                                              }
                                            >
                                              <SelectValue placeholder="Personel seçiniz" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none" disabled>Personel seçiniz</SelectItem>
                                              {employees?.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id}>
                                                  {employee.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      />
                                      {service?.assignedEmployeeId && (
                                        <AvailabilityBadge
                                          isLoading={availabilityLoading}
                                          result={availabilityMap.get(`service-employee-${index}`)}
                                        />
                                      )}
                                      {employeeConflict && employeeOtherIndex !== null && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          Bu personel {employeeOtherIndex + 1}. hizmet kaleminde de bu zaman aralığında atanmış
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {showVehicle && (
                                    <div className="space-y-2">
                                      <Label>Atanan Araç *</Label>
                                      <Controller
                                        control={control}
                                        name={`services.${index}.assignedVehicleId`}
                                        render={({ field }) => (
                                          <Select
                                            key={`service-vehicle-${index}-${field.value ?? "none"}`}
                                            value={field.value || "none"}
                                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                                          >
                                            <SelectTrigger
                                              className={cn(
                                                vehicleConflict && "border-red-500 focus:ring-red-500",
                                              )}
                                              title={
                                                vehicleConflict && vehicleOtherIndex !== null
                                                  ? `Bu araç ${vehicleOtherIndex + 1}. hizmet kaleminde de bu zaman aralığında atanmış`
                                                  : undefined
                                              }
                                            >
                                              <SelectValue placeholder="Araç seçiniz" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none" disabled>Araç seçiniz</SelectItem>
                                              {vehicles?.map((vehicle) => (
                                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                                  {vehicle.plate}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        )}
                                      />
                                      {service?.assignedVehicleId && (
                                        <AvailabilityBadge
                                          isLoading={availabilityLoading}
                                          result={availabilityMap.get(`service-vehicle-${index}`)}
                                        />
                                      )}
                                      {vehicleConflict && vehicleOtherIndex !== null && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          Bu araç {vehicleOtherIndex + 1}. hizmet kaleminde de bu zaman aralığında atanmış
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label>Notlar</Label>
                                    <Input {...register(`services.${index}.notes`)} />
                                  </div>
                                </div>
                              )
                            })()}

                            {/* Gelişmiş Seçenekler */}
                            <Collapsible
                              open={isAdvancedOpen}
                              onOpenChange={() => toggleServiceAdvanced(index)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Settings2 className="h-4 w-4" />
                                  Gelişmiş Seçenekler
                                  {isAdvancedOpen ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>

                              <CollapsibleContent className="pt-4 space-y-4">
                                {/* Özel Tarihler */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Özel Başlangıç</Label>
                                    <Input
                                      type="datetime-local"
                                      {...register(`services.${index}.startDateTime`)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Boş = kiralama tarihi
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Özel Bitiş</Label>
                                    <Input
                                      type="datetime-local"
                                      {...register(`services.${index}.endDateTime`)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Boş = kiralama tarihi
                                    </p>
                                  </div>
                                </div>

                                {/* İndirim Ayarları */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>İndirim Tipi</Label>
                                    <Controller
                                      control={control}
                                      name={`services.${index}.discountType`}
                                      render={({ field }) => (
                                        <Select
                                          key={`service-discountType-${index}-${field.value}`}
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

                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            {/* Hesaplama Özeti */}
                            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
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
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Özet */}
            <TabsContent value="summary" className="space-y-4 mt-4">
              {(() => {
                const summaryCurrencyCode = selectedCurrency?.text || "TL"
                const formatCurrency = (val: number) => val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

                return (
                  <div className="space-y-6">
                    {/* Ürünler Listesi */}
                    {watchedItems && watchedItems.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Ürünler
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2 font-medium">Ürün</th>
                                <th className="text-center p-2 font-medium w-16">Adet</th>
                                <th className="text-right p-2 font-medium w-24">B.Fiyat</th>
                                <th className="text-right p-2 font-medium w-24">Brüt</th>
                                <th className="text-right p-2 font-medium w-24">İndirim</th>
                                <th className="text-right p-2 font-medium w-24">Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {watchedItems.map((item, index) => {
                                const calc = calculateItemTotal(index)
                                const productName = getProductName(item?.productId || "")
                                const hasItemDiscount = (calc.discountAmount || 0) > 0

                                return (
                                  <tr key={index} className="border-t">
                                    <td className="p-2">
                                      <div className="font-medium">{productName}</div>
                                      {hasItemDiscount && (
                                        <div className="text-xs text-orange-600">
                                          Ürün ind.: %{item?.discountValue || 0}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2 text-center">{item?.quantity || 0}</td>
                                    <td className="p-2 text-right">{formatCurrency(item?.unitPrice || 0)}</td>
                                    <td className="p-2 text-right">{formatCurrency(calc.grossTotal || 0)}</td>
                                    <td className="p-2 text-right text-orange-600">
                                      {hasItemDiscount ? `-${formatCurrency(calc.discountAmount || 0)}` : "-"}
                                    </td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(calc.lineTotal || 0)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot className="bg-muted/30">
                              <tr className="border-t font-medium">
                                <td colSpan={3} className="p-2 text-right">Ürün Toplamı:</td>
                                <td className="p-2 text-right">{formatCurrency(totals.itemsGrossTotal)}</td>
                                <td className="p-2 text-right text-orange-600">
                                  {totals.itemsDiscountTotal > 0 ? `-${formatCurrency(totals.itemsDiscountTotal)}` : "-"}
                                </td>
                                <td className="p-2 text-right text-primary">{formatCurrency(totals.itemsLineTotal)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Hizmetler Listesi */}
                    {watchedServices && watchedServices.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Hizmetler
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2 font-medium">Hizmet</th>
                                <th className="text-center p-2 font-medium w-16">Adet</th>
                                <th className="text-right p-2 font-medium w-24">B.Fiyat</th>
                                <th className="text-right p-2 font-medium w-24">Brüt</th>
                                <th className="text-right p-2 font-medium w-24">İndirim</th>
                                <th className="text-right p-2 font-medium w-24">Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {watchedServices.map((service, index) => {
                                const calc = calculateServiceTotal(index)
                                const serviceName = getServiceName(service?.extraServiceId || "")
                                const hasServiceDiscount = (calc.discountAmount || 0) > 0

                                return (
                                  <tr key={index} className="border-t">
                                    <td className="p-2">
                                      <div className="font-medium">{serviceName}</div>
                                      {hasServiceDiscount && (
                                        <div className="text-xs text-orange-600">
                                          Hizmet ind.: %{service?.discountValue || 0}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2 text-center">{service?.quantity || 0}</td>
                                    <td className="p-2 text-right">{formatCurrency(service?.unitPrice || 0)}</td>
                                    <td className="p-2 text-right">{formatCurrency(calc.grossTotal || 0)}</td>
                                    <td className="p-2 text-right text-orange-600">
                                      {hasServiceDiscount ? `-${formatCurrency(calc.discountAmount || 0)}` : "-"}
                                    </td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(calc.lineTotal || 0)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot className="bg-muted/30">
                              <tr className="border-t font-medium">
                                <td colSpan={3} className="p-2 text-right">Hizmet Toplamı:</td>
                                <td className="p-2 text-right">{formatCurrency(totals.servicesGrossTotal)}</td>
                                <td className="p-2 text-right text-orange-600">
                                  {totals.servicesDiscountTotal > 0 ? `-${formatCurrency(totals.servicesDiscountTotal)}` : "-"}
                                </td>
                                <td className="p-2 text-right text-primary">{formatCurrency(totals.servicesLineTotal)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Genel Toplam */}
                    <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ürün Toplamı:</span>
                        <span>{formatCurrency(totals.itemsLineTotal)} {summaryCurrencyCode}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hizmet Toplamı:</span>
                        <span>{formatCurrency(totals.servicesLineTotal)} {summaryCurrencyCode}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">Ara Toplam:</span>
                        <span>{formatCurrency(totals.subtotal)} {summaryCurrencyCode}</span>
                      </div>
                      {totals.generalDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Genel İndirim {watchedRentalDiscountType === DiscountType.Percent ? `(%${watchedRentalDiscountValue})` : ""}:
                          </span>
                          <span className="text-orange-600">-{formatCurrency(totals.generalDiscountAmount)} {summaryCurrencyCode}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between text-base font-bold">
                        <span>Genel Toplam:</span>
                        <span className="text-primary">{formatCurrency(totals.grandTotal)} {summaryCurrencyCode}</span>
                      </div>
                      {totals.depositAmount > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t mt-2">
                          <span className="text-muted-foreground">Depozito (Güvence Bedeli):</span>
                          <span className="text-muted-foreground">{formatCurrency(totals.depositAmount)} {summaryCurrencyCode}</span>
                        </div>
                      )}
                    </div>

                    {/* Boş durum */}
                    {(!watchedItems || watchedItems.length === 0) && (!watchedServices || watchedServices.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        Henüz ürün veya hizmet eklenmemiş.
                      </div>
                    )}
                  </div>
                )
              })()}
            </TabsContent>
          </Tabs>

          {/* Fiyat Özeti Footer - Açılır/Kapanır */}
          <Collapsible open={isPriceSummaryOpen} onOpenChange={setIsPriceSummaryOpen}>
            <div className="border rounded-lg bg-muted/20">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    <span className="font-medium">Fiyat Özeti</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-primary">
                      {totals.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency?.text || "TL"}
                    </span>
                    {isPriceSummaryOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Ürünler</span>
                    <p className="font-medium">
                      {totals.itemsLineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency?.text || "TL"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Hizmetler</span>
                    <p className="font-medium">
                      {totals.servicesLineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency?.text || "TL"}
                    </p>
                  </div>
                  {totals.generalDiscountAmount > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">
                        Genel İndirim {watchedRentalDiscountType === DiscountType.Percent ? `(%${watchedRentalDiscountValue})` : ""}
                      </span>
                      <p className="font-medium text-orange-600">
                        -{totals.generalDiscountAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency?.text || "TL"}
                      </p>
                    </div>
                  )}
                  {totals.depositAmount > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Depozito</span>
                      <p className="font-medium">
                        {totals.depositAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency?.text || "TL"}
                      </p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

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
