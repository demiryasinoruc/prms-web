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
import { Separator } from "@/components/ui/separator"
import { StatusSwitchField } from "@/components/shared/status-switch-field"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { useCreateEmployee, useUpdateEmployee, useEmployeeForEdit } from "./hooks"
import { Gender, type Employee } from "@/types/api"

const employeeSchema = z.object({
  name: z.string().min(1, "Ad zorunlu"),
  surname: z.string().min(1, "Soyad zorunlu"),
  gender: z.number(),
  birthDate: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional().default(""),
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
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeDialogProps) {
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()

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

            <FormField
              label="Doğum Tarihi"
              type="date"
              {...register("birthDate")}
            />

            <FormField
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              {...register("email")}
              error={errors.email?.message}
            />

            <FormField
              label="Telefon"
              placeholder="0532 123 45 67"
              {...register("phone")}
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
