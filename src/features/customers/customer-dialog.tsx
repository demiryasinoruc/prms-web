import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus, Trash2, MapPin, Check, X } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  name: z.string().min(2, "Müşteri adı en az 2 karakter olmalı"),
  customerType: z.number(),
  identityNumber: z.string().optional().default(""),
  taxNumber: z.string().optional().default(""),
  taxOffice: z.string().optional().default(""),
  contactNumber: z.string().optional().default(""),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")).default(""),
  notes: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  addresses: z.array(addressSchema),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
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

  const defaultValues: CustomerFormData = {
    name: "",
    customerType: CustomerType.Individual,
    identityNumber: "",
    taxNumber: "",
    taxOffice: "",
    contactNumber: "",
    email: "",
    notes: "",
    isActive: true,
    addresses: [],
  }

  const formValues: CustomerFormData = (open && editCustomer) ? {
    name: editCustomer.name,
    customerType: editCustomer.customerType,
    identityNumber: editCustomer.identityNumber || "",
    taxNumber: editCustomer.taxNumber || "",
    taxOffice: editCustomer.taxOffice || "",
    contactNumber: editCustomer.contactNumber || "",
    email: editCustomer.email || "",
    notes: editCustomer.notes || "",
    isActive: editCustomer.isActive ?? true,
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
    contactNumber: customer.contactNumber || "",
    email: customer.email || "",
    notes: customer.notes || "",
    isActive: customer.isActive ?? true,
    addresses: [],
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    values: open ? formValues : defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addresses",
  })

  const customerType = watch("customerType")

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Müşteri Düzenle" : "Yeni Müşteri"}
          </DialogTitle>
          <DialogDescription>
            Müşteri bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="addresses">
                Adresler ({fields.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Müşteri Adı *</Label>
                  <Input placeholder="Müşteri adı" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Müşteri Tipi *</Label>
                  <Controller
                    control={control}
                    name="customerType"
                    render={({ field }) => (
                      <Select
                        key={`customerType-${field.value}`}
                        value={field.value != null ? String(field.value) : "none"}
                        onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Bireysel</SelectItem>
                          <SelectItem value="2">Kurumsal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {customerType === CustomerType.Individual ? (
                  <div className="space-y-2">
                    <Label>TC Kimlik No</Label>
                    <Input placeholder="11 haneli TC no" {...register("identityNumber")} />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Vergi No</Label>
                      <Input placeholder="Vergi numarası" {...register("taxNumber")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vergi Dairesi</Label>
                      <Input placeholder="Vergi dairesi" {...register("taxOffice")} />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input placeholder="0555 555 55 55" {...register("contactNumber")} />
                </div>

                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input type="email" placeholder="ornek@firma.com" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Notlar</Label>
                  <Textarea placeholder="Ek notlar..." {...register("notes")} rows={3} />
                </div>

                {customer && (
                  <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label>Durum</Label>
                      <p className="text-sm text-muted-foreground">
                        Müşterinin aktif/pasif durumu
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
                        <div className="space-y-2">
                          <Label>Başlık *</Label>
                          <Input
                            placeholder="Ev, İş, Şantiye..."
                            {...register(`addresses.${index}.title`)}
                          />
                          {errors.addresses?.[index]?.title && (
                            <p className="text-sm text-destructive">
                              {errors.addresses[index]?.title?.message}
                            </p>
                          )}
                        </div>

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

                        <div className="col-span-2 space-y-2">
                          <Label>Adres *</Label>
                          <Input
                            placeholder="Mahalle, sokak, no..."
                            {...register(`addresses.${index}.addressLine1`)}
                          />
                          {errors.addresses?.[index]?.addressLine1 && (
                            <p className="text-sm text-destructive">
                              {errors.addresses[index]?.addressLine1?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Şehir *</Label>
                          <Input
                            placeholder="İstanbul"
                            {...register(`addresses.${index}.city`)}
                          />
                          {errors.addresses?.[index]?.city && (
                            <p className="text-sm text-destructive">
                              {errors.addresses[index]?.city?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>İlçe</Label>
                          <Input
                            placeholder="Kadıköy"
                            {...register(`addresses.${index}.state`)}
                          />
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
