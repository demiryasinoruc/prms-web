import { useForm, Controller } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2, Building2, Save, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCompanyByUser, useCompanyForEdit, useUpdateCompany } from "./hooks"
import { DeliveryType, DeliveryTypeLabels } from "./api"
import { useCurrencySelect, usePricePeriodSelect } from "@/features/products/hooks"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { toast } from "sonner"

const companySchema = z.object({
  name: z.string().min(1, "Firma adı zorunludur"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(1, "Telefon numarası zorunludur"),
  requireDeliveryAddressForRental: z.boolean(),
  defaultDeliveryType: z.nativeEnum(DeliveryType),
  defaultCurrencyId: z.number().nullable(),
  defaultPricePeriodId: z.number().nullable(),
  availabilityCheckMode: z.string().default("warn"),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompanySettingsPage() {
  const canManage = usePermission(Permissions.Settings.Manage)
  const { data: company, isLoading: isLoadingCompany } = useCompanyByUser()
  const { data: companyForEdit, isLoading: isLoadingEdit } = useCompanyForEdit(company?.id || null)
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencySelect()
  const { data: pricePeriods, isLoading: isLoadingPricePeriods } = usePricePeriodSelect()
  const updateCompany = useUpdateCompany()

  const defaultValues: CompanyFormData = {
    name: "",
    email: "",
    phone: "",
    requireDeliveryAddressForRental: true,
    defaultDeliveryType: DeliveryType.CompanyDelivery,
    defaultCurrencyId: null,
    defaultPricePeriodId: null,
    availabilityCheckMode: "warn",
  }

  const formValues: CompanyFormData = companyForEdit ? {
    name: companyForEdit.name,
    email: companyForEdit.email,
    phone: companyForEdit.phone,
    requireDeliveryAddressForRental: companyForEdit.requireDeliveryAddressForRental,
    defaultDeliveryType: companyForEdit.defaultDeliveryType,
    defaultCurrencyId: companyForEdit.defaultCurrencyId,
    defaultPricePeriodId: companyForEdit.defaultPricePeriodId,
    availabilityCheckMode: companyForEdit.availabilityCheckMode,
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<CompanyFormData>({
    resolver: formResolver<CompanyFormData>(companySchema),
    values: formValues,
  })

  const onSubmit = async (data: CompanyFormData) => {
    if (!company?.id) return

    try {
      await updateCompany.mutateAsync({
        id: company.id,
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          requireDeliveryAddressForRental: data.requireDeliveryAddressForRental,
          defaultDeliveryType: data.defaultDeliveryType,
          defaultCurrencyId: data.defaultCurrencyId,
          defaultPricePeriodId: data.defaultPricePeriodId,
          availabilityCheckMode: data.availabilityCheckMode,
        },
      })
      toast.success("Firma bilgileri güncellendi")
    } catch {
      // Error handled by mutation
    }
  }

  const isLoading = isLoadingCompany || isLoadingEdit || isLoadingCurrencies || isLoadingPricePeriods
  const isSubmitting = updateCompany.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Firma Bilgileri</h1>
          <p className="text-muted-foreground">
            Şirket bilgilerinizi görüntüleyin ve düzenleyin
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Şirket Profili</CardTitle>
              <CardDescription>
                Firma iletişim ve temel bilgileri
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Firma Adı *</Label>
                <Input
                  placeholder="Firma adı"
                  {...register("name")}
                  disabled={!canManage}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>E-posta *</Label>
                <Input
                  type="email"
                  placeholder="info@firma.com"
                  {...register("email")}
                  disabled={!canManage}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Telefon *</Label>
                <Input
                  placeholder="+90 5XX XXX XX XX"
                  {...register("phone")}
                  disabled={!canManage}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              {/* Ayarlar Bölümü */}
              <div className="pt-6 mt-6 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">Kiralama Ayarları</h3>
                    <p className="text-sm text-muted-foreground">
                      Varsayılan değerler ve iş kuralları
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Teslimat Adresi Zorunluluğu</Label>
                      <p className="text-sm text-muted-foreground">
                        Kiralama aktif edilirken teslimat adresi zorunlu olsun
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name="requireDeliveryAddressForRental"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canManage}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label>Müsaitlik Kontrolü</Label>
                      <p className="text-sm text-muted-foreground">
                        Kiralama oluşturulurken ürün müsait değilse ne yapılacağını belirler
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name="availabilityCheckMode"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!canManage}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warn">Uyar</SelectItem>
                            <SelectItem value="block">Engelle</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Teslimat Politikası</Label>
                    <Controller
                      control={control}
                      name="defaultDeliveryType"
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={!canManage}
                        >
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue placeholder="Seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(DeliveryTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      &quot;Teslimat Var&quot; seçilirse her kiralama teslimatlı olur. &quot;Teslimat Yok&quot; seçilirse müşteri kendisi alır. &quot;Kiralamaya Göre Değişir&quot; seçilirse her kiralamada ayrı seçim yapılır.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Varsayılan Para Birimi</Label>
                    <Controller
                      control={control}
                      name="defaultCurrencyId"
                      render={({ field }) => (
                        <Select
                          key={`currency-${field.value}`}
                          value={field.value != null ? String(field.value) : "none"}
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? null : Number(value))
                          }
                          disabled={!canManage}
                        >
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue placeholder="Seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Seçilmedi</SelectItem>
                            {currencies?.map((currency) => (
                              <SelectItem key={currency.value} value={String(currency.value)}>
                                {currency.text}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      Yeni ürün ve kiralamalarda varsayılan olarak seçilecek
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Varsayılan Fiyat Periyodu</Label>
                    <Controller
                      control={control}
                      name="defaultPricePeriodId"
                      render={({ field }) => (
                        <Select
                          key={`period-${field.value}`}
                          value={field.value != null ? String(field.value) : "none"}
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? null : Number(value))
                          }
                          disabled={!canManage}
                        >
                          <SelectTrigger className="w-full max-w-xs">
                            <SelectValue placeholder="Seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Seçilmedi</SelectItem>
                            {pricePeriods?.map((period) => (
                              <SelectItem key={period.value} value={String(period.value)}>
                                {period.text}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      Yeni ürünlerde varsayılan olarak seçilecek
                    </p>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="pt-4">
                  <Button type="submit" disabled={isSubmitting || !isDirty}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Kaydet
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
