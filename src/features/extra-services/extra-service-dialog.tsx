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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateExtraService,
  useUpdateExtraService,
  useExtraService,
  usePricePeriods,
  useCurrencies,
  useCertificates,
} from "./hooks"
import type { ExtraService } from "./api"
import { useCompanySettings } from "@/features/settings/hooks"

const extraServiceSchema = z.object({
  name: z.string().min(1, "Hizmet adı zorunlu"),
  description: z.string().min(1, "Açıklama zorunlu"),
  price: z.number().min(0, "Fiyat 0 veya daha büyük olmalı"),
  pricePeriodId: z.string().min(1, "Fiyat periyodu seçiniz"),
  currencyId: z.string().min(1, "Para birimi seçiniz"),
  requiredCertificateId: z.string().nullable(),
  requiresEmployee: z.boolean(),
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
    isActive: serviceDetail.isActive,
    notes: serviceDetail.notes || "",
  } : {
    ...defaultValues,
    currencyId: companySettings?.defaultCurrencyId ? String(companySettings.defaultCurrencyId) : "",
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExtraServiceFormData>({
    resolver: formResolver<ExtraServiceFormData>(extraServiceSchema),
    values: open ? formValues : defaultValues,
  })

  const isActive = watch("isActive")
  const requiresEmployee = watch("requiresEmployee")
  const pricePeriodId = watch("pricePeriodId")
  const currencyId = watch("currencyId")
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
            pricePeriodId: data.pricePeriodId,
            currencyId: data.currencyId,
            requiredCertificateId: data.requiredCertificateId || null,
            requiresEmployee: data.requiresEmployee,
            isActive: data.isActive,
            notes: data.notes || null,
          },
        })
      } else {
        await createService.mutateAsync({
          name: data.name,
          description: data.description,
          price: data.price,
          pricePeriodId: data.pricePeriodId,
          currencyId: data.currencyId,
          requiredCertificateId: data.requiredCertificateId || null,
          requiresEmployee: data.requiresEmployee,
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
          <div className="space-y-2">
            <Label>Hizmet Adı *</Label>
            <Input
              placeholder="Hizmet adı"
              {...register("name")}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Açıklama *</Label>
            <Textarea
              placeholder="Hizmet açıklaması"
              {...register("description")}
              rows={2}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fiyat *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Para Birimi *</Label>
              <Select
                key={`currencyId-${currencyId}`}
                value={currencyId != null ? String(currencyId) : "none"}
                onValueChange={(value) => setValue("currencyId", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {currencies?.map((currency) => (
                    <SelectItem key={currency.value} value={String(currency.value)}>
                      {currency.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currencyId && (
                <p className="text-sm text-destructive">{errors.currencyId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fiyat Periyodu *</Label>
            <Select
              key={`pricePeriodId-${pricePeriodId}`}
              value={pricePeriodId != null ? String(pricePeriodId) : "none"}
              onValueChange={(value) => setValue("pricePeriodId", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {pricePeriods?.map((period) => (
                  <SelectItem key={period.value} value={String(period.value)}>
                    {period.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pricePeriodId && (
              <p className="text-sm text-destructive">{errors.pricePeriodId.message}</p>
            )}
          </div>

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

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>Personel Gerekli</Label>
              <p className="text-sm text-muted-foreground">
                Bu hizmet kiralamaya eklendiğinde personel ataması zorunlu olsun
              </p>
            </div>
            <Switch
              checked={requiresEmployee}
              onCheckedChange={(checked) => setValue("requiresEmployee", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea
              placeholder="Ek notlar"
              {...register("notes")}
              rows={2}
            />
          </div>

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
