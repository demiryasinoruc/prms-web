import { useForm } from "react-hook-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { SwitchField } from "@/components/shared/switch-field"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import {
  useCreateExtraService,
  useUpdateExtraService,
  useExtraService,
  usePricePeriods,
  useCurrencies,
  useCertificates,
} from "./hooks"
import type { ExtraService } from "./api"
import { ServiceType, ServiceTypeLabels } from "./api"
import { useCompanySettings } from "@/features/settings/hooks"

const extraServiceSchema = z.object({
  name: z.string().min(1, "Hizmet adı zorunlu"),
  description: z.string().min(1, "Açıklama zorunlu"),
  price: z.number().gt(0, "Fiyat 0'dan büyük olmalıdır"),
  pricePeriodId: z.string().min(1, "Fiyat periyodu seçiniz"),
  currencyId: z.string().min(1, "Para birimi seçiniz"),
  requiredCertificateId: z.string().nullable(),
  requiresEmployee: z.boolean(),
  serviceType: z.nativeEnum(ServiceType).default(ServiceType.Other),
  requiresVehicle: z.boolean().default(false),
  isActive: z.boolean(),
  notes: z.string().nullable(),
})

type ExtraServiceFormData = {
  name: string
  description: string
  price: number
  pricePeriodId: string
  currencyId: string
  requiredCertificateId: string | null
  requiresEmployee: boolean
  serviceType: ServiceType
  requiresVehicle: boolean
  isActive: boolean
  notes: string | null
}

const defaultValues: ExtraServiceFormData = {
  name: "",
  description: "",
  price: 0,
  pricePeriodId: "",
  currencyId: "",
  requiredCertificateId: null,
  requiresEmployee: false,
  serviceType: ServiceType.Other,
  requiresVehicle: false,
  isActive: true,
  notes: "",
}

interface ExtraServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  extraService: ExtraService | null
}

export function ExtraServiceDialog({
  open,
  onOpenChange,
  extraService,
}: ExtraServiceDialogProps) {
  const createService = useCreateExtraService()
  const updateService = useUpdateExtraService()

  const { data: serviceDetail } = useExtraService(extraService?.id || null)
  const { data: pricePeriods } = usePricePeriods()
  const { data: currencies } = useCurrencies()
  const { data: certificates } = useCertificates()
  const { data: companySettings } = useCompanySettings()

  const formValues: ExtraServiceFormData = (open && serviceDetail && extraService) ? {
    name: serviceDetail.name,
    description: serviceDetail.description,
    price: serviceDetail.price,
    pricePeriodId: String(serviceDetail.pricePeriodId),
    currencyId: String(serviceDetail.currencyId),
    requiredCertificateId: serviceDetail.requiredCertificateId || null,
    requiresEmployee: serviceDetail.requiresEmployee,
    serviceType: serviceDetail.serviceType ?? ServiceType.Other,
    requiresVehicle: serviceDetail.requiresVehicle ?? false,
    isActive: serviceDetail.isActive,
    notes: serviceDetail.notes || "",
  } : {
    ...defaultValues,
    currencyId: companySettings?.defaultCurrencyId ? String(companySettings.defaultCurrencyId) : "",
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExtraServiceFormData>({
    resolver: formResolver<ExtraServiceFormData>(extraServiceSchema),
    values: open ? formValues : defaultValues,
  })

  const isActive = watch("isActive")
  const requiresEmployee = watch("requiresEmployee")
  const requiresVehicle = watch("requiresVehicle")
  const requiredCertificateId = watch("requiredCertificateId")

  const onSubmit = async (data: ExtraServiceFormData) => {
    try {
      if (extraService) {
        await updateService.mutateAsync({
          id: extraService.id,
          data: {
            name: data.name,
            description: data.description,
            price: data.price,
            pricePeriodId: Number(data.pricePeriodId),
            currencyId: Number(data.currencyId),
            requiredCertificateId: data.requiredCertificateId || null,
            requiresEmployee: data.requiresEmployee,
            serviceType: data.serviceType,
            requiresVehicle: data.requiresVehicle,
            isActive: data.isActive,
            notes: data.notes || null,
          },
        })
      } else {
        await createService.mutateAsync({
          name: data.name,
          description: data.description,
          price: data.price,
          pricePeriodId: Number(data.pricePeriodId),
          currencyId: Number(data.currencyId),
          requiredCertificateId: data.requiredCertificateId || null,
          requiresEmployee: data.requiresEmployee,
          serviceType: data.serviceType,
          requiresVehicle: data.requiresVehicle,
          notes: data.notes || null,
        })
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createService.isPending || updateService.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {extraService ? "Ek Hizmet Düzenle" : "Yeni Ek Hizmet"}
          </DialogTitle>
          <DialogDescription>
            Ek hizmet bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Hizmet Adı *"
            placeholder="Hizmet adı"
            {...register("name")}
            autoFocus
            error={errors.name?.message}
          />

          <FormField
            label="Açıklama *"
            placeholder="Hizmet açıklaması"
            {...register("description")}
            multiline
            rows={2}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Fiyat *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("price", { valueAsNumber: true })}
              error={errors.price?.message}
            />

            <FormSelectField
              label="Para Birimi *"
              name="currencyId"
              control={control}
              options={currencies?.map((c) => ({ value: String(c.value), label: c.text })) || []}
              placeholder="Seçiniz"
              error={errors.currencyId?.message}
            />
          </div>

          <FormSelectField
            label="Fiyat Periyodu *"
            name="pricePeriodId"
            control={control}
            options={pricePeriods?.map((p) => ({ value: String(p.value), label: p.text })) || []}
            placeholder="Seçiniz"
            error={errors.pricePeriodId?.message}
          />

          <FormSelectField
            label="Hizmet Tipi *"
            name="serviceType"
            control={control}
            options={Object.entries(ServiceTypeLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            placeholder="Tip seçiniz"
            valueType="number"
            error={errors.serviceType?.message}
          />

          <div className="space-y-2">
            <Label>Gerekli Sertifika (Opsiyonel)</Label>
            <Select
              key={`certificateId-${requiredCertificateId}`}
              value={requiredCertificateId || "none"}
              onValueChange={(value) => setValue("requiredCertificateId", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Gerekli değil</SelectItem>
                {certificates?.map((cert) => (
                  <SelectItem key={String(cert.value)} value={String(cert.value)}>
                    {cert.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SwitchField
            label="Personel Gerekli"
            description="Bu hizmet kiralamaya eklendiğinde personel ataması zorunlu olsun"
            checked={requiresEmployee}
            onCheckedChange={(checked) => setValue("requiresEmployee", checked)}
          />

          <SwitchField
            label="Araç Gerekli"
            description="Bu hizmet için bir araç ataması gerekiyor mu?"
            checked={requiresVehicle}
            onCheckedChange={(checked) => setValue("requiresVehicle", checked)}
          />

          <FormField
            label="Notlar"
            placeholder="Ek notlar"
            {...register("notes")}
            multiline
            rows={2}
          />

          {extraService && (
            <StatusSwitchField
              value={isActive}
              onChange={(checked) => setValue("isActive", checked)}
              description="Hizmetin aktif/pasif durumu"
              coloredLabel
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
              {extraService ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
