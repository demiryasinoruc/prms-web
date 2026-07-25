import { useState } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2, Plus, Trash2, MapPin } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { useCreateCustomer, useUpdateCustomer, useCustomerForEdit } from "./hooks"
import { CustomerType, AddressType, type Customer } from "@/types/api"

const addressSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Başlık zorunlu"),
  addressType: z.number(),
  addressLine1: z.string().min(1, "Adres zorunlu"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "Şehir zorunlu"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("Türkiye"),
  isDefault: z.boolean().default(false),
})

const customerSchema = z.object({
  name: z.string().min(2, "Müşteri adı en az 2 karakter olmalı").max(200, "Müşteri adı en fazla 200 karakter olabilir"),
  customerType: z.number(),
  identityNumber: z.string().max(50, "Kimlik numarası en fazla 50 karakter olabilir").optional().default(""),
  taxNumber: z.string().max(50, "Vergi numarası en fazla 50 karakter olabilir").optional().default(""),
  taxOffice: z.string().max(200, "Vergi dairesi en fazla 200 karakter olabilir").optional().default(""),
  phone: z.string().min(1, "İletişim numarası zorunludur").max(20, "İletişim numarası en fazla 20 karakter olabilir"),
  email: z.string().min(1, "E-posta adresi zorunludur").email("Geçerli bir e-posta adresi giriniz").max(256, "E-posta en fazla 256 karakter olabilir"),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").optional().default(""),
  isActive: z.boolean().default(true),
  isForeigner: z.boolean().default(false),
  nationality: z.string().max(100, "Uyruk en fazla 100 karakter olabilir").optional().default(""),
  passportNumber: z.string().max(50, "Pasaport no en fazla 50 karakter olabilir").optional().default(""),
  customFields: z.array(
    z.object({
      key: z.string().max(100, "Alan adı en fazla 100 karakter olabilir"),
      value: z.string().max(500, "Değer en fazla 500 karakter olabilir"),
    })
  ).default([]),
  contacts: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Ad zorunlu").max(200, "Ad en fazla 200 karakter olabilir"),
      position: z.string().max(200).optional().default(""),
      phone: z.string().max(20).optional().default(""),
      email: z.string().max(256).optional().default(""),
      isDefault: z.boolean().default(false),
    })
  ).default([]),
  addresses: z.array(addressSchema),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
}

const defaultValues: CustomerFormData = {
  name: "",
  customerType: CustomerType.Individual,
  identityNumber: "",
  taxNumber: "",
  taxOffice: "",
  phone: "",
  email: "",
  notes: "",
  isActive: true,
  isForeigner: false,
  nationality: "",
  passportNumber: "",
  customFields: [],
  contacts: [],
  addresses: [],
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
}: CustomerDialogProps) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  // Fetch full customer data for editing (includes notes and all fields)
  const { data: customerData } = useCustomerForEdit(customer?.id || "")
  const editCustomer = customer ? customerData : null

  const formValues: CustomerFormData = (open && editCustomer) ? {
    name: editCustomer.name,
    customerType: editCustomer.customerType,
    identityNumber: editCustomer.identityNumber || "",
    taxNumber: editCustomer.taxNumber || "",
    taxOffice: editCustomer.taxOffice || "",
    phone: editCustomer.phone || "",
    email: editCustomer.email || "",
    notes: editCustomer.notes || "",
    isActive: editCustomer.isActive ?? true,
    isForeigner: editCustomer.isForeigner ?? false,
    nationality: editCustomer.nationality || "",
    passportNumber: editCustomer.passportNumber || "",
    customFields:
      editCustomer.customFields?.map((f) => ({ key: f.key, value: f.value })) || [],
    contacts:
      editCustomer.contacts?.map((c) => ({
        id: c.id,
        name: c.name,
        position: c.position || "",
        phone: c.phone || "",
        email: c.email || "",
        isDefault: c.isDefault,
      })) || [],
    addresses:
      editCustomer.addresses?.map((addr) => ({
        id: addr.id,
        title: addr.title,
        addressType: addr.addressType,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || "",
        city: addr.city,
        state: addr.state || "",
        postalCode: addr.postalCode || "",
        country: addr.country,
        isDefault: addr.isDefault,
      })) || [],
  } : (open && customer) ? {
    name: customer.name,
    customerType: customer.customerType,
    identityNumber: customer.identityNumber || "",
    taxNumber: customer.taxNumber || "",
    taxOffice: customer.taxOffice || "",
    phone: customer.phone || "",
    email: customer.email || "",
    notes: customer.notes || "",
    isActive: customer.isActive ?? true,
    isForeigner: customer.isForeigner ?? false,
    nationality: customer.nationality || "",
    passportNumber: customer.passportNumber || "",
    customFields: customer.customFields?.map((f) => ({ key: f.key, value: f.value })) || [],
    contacts: customer.contacts?.map((c) => ({
      id: c.id,
      name: c.name,
      position: c.position || "",
      phone: c.phone || "",
      email: c.email || "",
      isDefault: c.isDefault,
    })) || [],
    addresses: [],
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: formResolver<CustomerFormData>(customerSchema),
    values: open ? formValues : defaultValues,
  })

  // Sekme bazlı navigasyon — tab sırasına göre ilk hatalı sekmeye geç
  const [activeTab, setActiveTab] = useState("info")
  const tabsOrder = ["info", "contacts", "custom-fields", "addresses"]
  const fieldToTab: Record<string, string> = {
    name: "info",
    customerType: "info",
    identityNumber: "info",
    taxNumber: "info",
    taxOffice: "info",
    nationality: "info",
    passportNumber: "info",
    isForeigner: "info",
    phone: "info",
    email: "info",
    notes: "info",
    isActive: "info",
    customFields: "custom-fields",
    contacts: "contacts",
    addresses: "addresses",
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  })

  const {
    fields: customFieldsArr,
    append: appendCustomField,
    remove: removeCustomField,
  } = useFieldArray({
    control,
    name: "customFields",
  })

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: "contacts",
  })

  const customerType = watch("customerType")
  const isForeigner = watch("isForeigner")

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (customer) {
        await updateCustomer.mutateAsync({
          id: customer.id,
          data: { ...data, id: customer.id },
        })
      } else {
        await createCustomer.mutateAsync(data)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const addAddress = () => {
    append({
      title: "",
      addressType: AddressType.Delivery,
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Türkiye",
      isDefault: fields.length === 0,
    })
  }

  const isSubmitting = createCustomer.isPending || updateCustomer.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {customer ? "Müşteri Düzenle" : "Yeni Müşteri"}
          </DialogTitle>
          <DialogDescription>
            Müşteri bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="contacts">
                İletişim Kişileri ({contactFields.length})
              </TabsTrigger>
              <TabsTrigger value="custom-fields">
                Özel Alanlar ({customFieldsArr.length})
              </TabsTrigger>
              <TabsTrigger value="addresses">
                Adresler ({fields.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField
                    label="Müşteri Adı *"
                    placeholder="Müşteri adı"
                    {...register("name")}
                    error={errors.name?.message}
                  />
                </div>

                <FormSelectField
                  label="Müşteri Tipi *"
                  name="customerType"
                  control={control}
                  valueType="number"
                  options={[
                    { value: "1", label: "Bireysel" },
                    { value: "2", label: "Kurumsal" },
                  ]}
                />

                {customerType === CustomerType.Individual ? (
                  <>
                    <div className="col-span-2 flex items-center gap-3 rounded-md border p-3">
                      <Controller
                        control={control}
                        name="isForeigner"
                        render={({ field }) => (
                          <Switch
                            id="isForeigner"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor="isForeigner" className="cursor-pointer">
                        Yabancı uyruklu müşteri
                      </Label>
                    </div>
                    {isForeigner ? (
                      <>
                        <FormField
                          label="Uyruk"
                          placeholder="Örn. Almanya"
                          {...register("nationality")}
                          error={errors.nationality?.message}
                        />
                        <FormField
                          label="Pasaport No"
                          placeholder="Pasaport numarası"
                          {...register("passportNumber")}
                          error={errors.passportNumber?.message}
                        />
                      </>
                    ) : (
                      <FormField
                        label="TC Kimlik No"
                        placeholder="11 haneli TC no"
                        {...register("identityNumber")}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <FormField
                      label="Vergi No"
                      placeholder="Vergi numarası"
                      {...register("taxNumber")}
                    />
                    <FormField
                      label="Vergi Dairesi"
                      placeholder="Vergi dairesi"
                      {...register("taxOffice")}
                    />
                  </>
                )}

                <FormField
                  label="Telefon *"
                  placeholder="0555 555 55 55"
                  {...register("phone")}
                  error={errors.phone?.message}
                />

                <FormField
                  label="E-posta"
                  type="email"
                  placeholder="ornek@firma.com"
                  {...register("email")}
                  error={errors.email?.message}
                />

                <div className="col-span-2">
                  <FormField
                    label="Notlar"
                    placeholder="Ek notlar..."
                    {...register("notes")}
                    multiline
                    rows={3}
                  />
                </div>

                {customer && (
                  <div className="col-span-2">
                    <Controller
                      control={control}
                      name="isActive"
                      render={({ field }) => (
                        <StatusSwitchField
                          value={field.value}
                          onChange={field.onChange}
                          description="Müşterinin aktif/pasif durumu"
                          coloredLabel
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Müşteri firmasındaki yetkili/iletişim kişileri
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendContact({
                      name: "",
                      position: "",
                      phone: "",
                      email: "",
                      isDefault: contactFields.length === 0,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Kişi Ekle
                </Button>
              </div>

              {contactFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <p>Henüz iletişim kişisi eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contactFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Kişi {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeContact(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          label="Ad Soyad *"
                          placeholder="Yetkili adı"
                          {...register(`contacts.${index}.name`)}
                          error={errors.contacts?.[index]?.name?.message}
                        />
                        <FormField
                          label="Görev / Ünvan"
                          placeholder="Satın Alma Müdürü"
                          {...register(`contacts.${index}.position`)}
                        />
                        <FormField
                          label="Telefon"
                          placeholder="0555 555 55 55"
                          {...register(`contacts.${index}.phone`)}
                        />
                        <FormField
                          label="E-posta"
                          placeholder="kisi@firma.com"
                          {...register(`contacts.${index}.email`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom-fields" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Müşteriye özel serbest alanlar (ör. "Referans", "Sözleşme No")
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendCustomField({ key: "", value: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Alan Ekle
                </Button>
              </div>

              {customFieldsArr.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <p>Henüz özel alan eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customFieldsArr.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Alan adı (ör. Referans)"
                          {...register(`customFields.${index}.key`)}
                        />
                        {errors.customFields?.[index]?.key?.message && (
                          <p className="mt-1 text-xs text-destructive">
                            {errors.customFields[index]?.key?.message}
                          </p>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Değer"
                          {...register(`customFields.${index}.value`)}
                        />
                        {errors.customFields?.[index]?.value?.message && (
                          <p className="mt-1 text-xs text-destructive">
                            {errors.customFields[index]?.value?.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive shrink-0"
                        onClick={() => removeCustomField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Müşteri adreslerini yönetin
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addAddress}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adres Ekle
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Henüz adres eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Adres {index + 1}</span>
                          {watch(`addresses.${index}.isDefault`) && (
                            <Badge variant="secondary">Varsayılan</Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          label="Başlık *"
                          placeholder="Ev, İş, Şantiye..."
                          {...register(`addresses.${index}.title`)}
                          error={errors.addresses?.[index]?.title?.message}
                        />

                        <div className="space-y-2">
                          <Label>Adres Tipi</Label>
                          <Controller
                            control={control}
                            name={`addresses.${index}.addressType`}
                            render={({ field }) => (
                              <Select
                                key={`addressType-${index}-${field.value}`}
                                value={String(field.value)}
                                onValueChange={(value) => field.onChange(Number(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Fatura</SelectItem>
                                  <SelectItem value="2">Teslimat</SelectItem>
                                  <SelectItem value="3">Diğer</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="col-span-2">
                          <FormField
                            label="Adres *"
                            placeholder="Mahalle, sokak, no..."
                            {...register(`addresses.${index}.addressLine1`)}
                            error={errors.addresses?.[index]?.addressLine1?.message}
                          />
                        </div>

                        <FormField
                          label="Şehir *"
                          placeholder="İstanbul"
                          {...register(`addresses.${index}.city`)}
                          error={errors.addresses?.[index]?.city?.message}
                        />

                        <FormField
                          label="İlçe"
                          placeholder="Kadıköy"
                          {...register(`addresses.${index}.state`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
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
              {customer ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
