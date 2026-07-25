import { useForm, Controller } from "react-hook-form"
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
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { LimitWarningAlert } from "@/components/shared/limit-warning-alert"
import { DatePicker } from "@/components/shared/date-picker"
import { useCreateEmployee, useUpdateEmployee, useEmployeeForEdit } from "./hooks"
import { useWarehouseSelect } from "@/features/warehouses/hooks"
import { Gender, type Employee } from "@/types/api"

const employeeSchema = z.object({
  name: z.string().min(1, "Ad zorunludur").max(200, "Ad en fazla 200 karakter olabilir"),
  surname: z.string().min(1, "Soyad zorunludur").max(200, "Soyad en fazla 200 karakter olabilir"),
  gender: z.number(),
  birthDate: z.string().optional(),
  email: z.string().min(1, "E-posta adresi zorunludur").email("Geçerli bir e-posta adresi giriniz").max(256, "E-posta en fazla 256 karakter olabilir"),
  phone: z.string().min(1, "İletişim numarası zorunludur").max(20, "İletişim numarası en fazla 20 karakter olabilir"),
  isActive: z.boolean().optional().default(true),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").optional().default(""),
  warehouseId: z.string().nullable().optional(),
  emergencyContactName: z.string().max(200).optional().default(""),
  emergencyContactPhone: z.string().max(20).optional().default(""),
  emergencyContactRelation: z.string().max(100).optional().default(""),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface EmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

const defaultValues: EmployeeFormData = {
  name: "",
  surname: "",
  gender: Gender.Male,
  birthDate: "",
  email: "",
  phone: "",
  isActive: true,
  notes: "",
  warehouseId: null,
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeDialogProps) {
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const { data: warehouses } = useWarehouseSelect()

  const { data: employeeData } = useEmployeeForEdit(employee?.id || "")
  const editEmployee = employee ? employeeData : null

  const formValues = (open && employee) ? {
    name: editEmployee?.name ?? employee.name,
    surname: editEmployee?.surname ?? employee.surname,
    gender: editEmployee?.gender ?? employee.gender,
    birthDate: editEmployee?.birthDate ? editEmployee.birthDate.split("T")[0] : "",
    email: editEmployee?.email ?? employee.email ?? "",
    phone: editEmployee?.phone ?? employee.phone ?? "",
    isActive: editEmployee?.isActive ?? employee.isActive,
    notes: editEmployee?.notes ?? "",
    warehouseId: editEmployee?.warehouseId ?? null,
    emergencyContactName: editEmployee?.emergencyContactName ?? "",
    emergencyContactPhone: editEmployee?.emergencyContactPhone ?? "",
    emergencyContactRelation: editEmployee?.emergencyContactRelation ?? "",
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: formResolver<EmployeeFormData>(employeeSchema),
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (employee) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          data: { ...data, id: employee.id, isActive: data.isActive ?? true },
        })
      } else {
        await createEmployee.mutateAsync(data)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createEmployee.isPending || updateEmployee.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Çalışan Düzenle" : "Yeni Çalışan"}
          </DialogTitle>
          <DialogDescription>
            Çalışan bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        {!employee && <LimitWarningAlert limitType="Employee" className="mb-4" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Ad *"
              placeholder="Ad"
              {...register("name")}
              error={errors.name?.message}
            />

            <FormField
              label="Soyad *"
              placeholder="Soyad"
              {...register("surname")}
              error={errors.surname?.message}
            />

            <FormSelectField
              label="Cinsiyet"
              name="gender"
              control={control}
              valueType="number"
              options={[
                { value: "1", label: "Erkek" },
                { value: "2", label: "Kadın" },
              ]}
            />

            <div className="space-y-2">
              <Label>Doğum Tarihi</Label>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Doğum tarihi seçiniz"
                  />
                )}
              />
            </div>

            <FormField
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              {...register("email")}
              error={errors.email?.message}
            />

            <FormField
              label="Telefon *"
              placeholder="0532 123 45 67"
              {...register("phone")}
              error={errors.phone?.message}
            />

            <div className="col-span-2 space-y-2">
              <Label>Depo</Label>
              <Controller
                control={control}
                name="warehouseId"
                render={({ field }) => (
                  <Select
                    key={`employee-warehouse-${field.value || "none"}`}
                    value={field.value || "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Depo seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Depo Yok / Firma Geneli</SelectItem>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-muted-foreground">
                Bir depoya atanan personel, &quot;depodan gönderim&quot; sevkiyatlarında
                o deponun personeli olarak listelenir. Boş bırakılırsa tüm depolarda görünür.
              </p>
            </div>

            <div className="col-span-2 pt-2">
              <Separator className="mb-3" />
              <p className="text-sm font-medium mb-1">Acil Durum İletişim</p>
              <p className="text-xs text-muted-foreground mb-3">
                Acil bir durumda ulaşılacak kişi bilgileri (opsiyonel).
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Ad Soyad"
                  placeholder="Yakının adı"
                  {...register("emergencyContactName")}
                />
                <FormField
                  label="Telefon"
                  placeholder="0532 123 45 67"
                  {...register("emergencyContactPhone")}
                />
                <div className="col-span-2">
                  <FormField
                    label="Yakınlık"
                    placeholder="Eş, Anne, Kardeş..."
                    {...register("emergencyContactRelation")}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <FormField
                label="Notlar"
                placeholder="Ek notlar..."
                {...register("notes")}
                multiline
                rows={3}
              />
            </div>

            {employee && (
              <div className="col-span-2">
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <StatusSwitchField
                      value={field.value}
                      onChange={field.onChange}
                      description="Çalışanın aktif veya pasif durumu"
                      coloredLabel
                    />
                  )}
                />
              </div>
            )}
          </div>

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
              {employee ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
