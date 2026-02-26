import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useCreateEmployee, useUpdateEmployee, useEmployeeForEdit } from "./hooks"
import { Gender, type Employee } from "@/types/api"

const employeeSchema = z.object({
  name: z.string().min(1, "Ad zorunlu"),
  surname: z.string().min(1, "Soyad zorunlu"),
  gender: z.number(),
  birthDate: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
  contactNumber: z.string().optional().default(""),
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
  contactNumber: "",
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
    contactNumber: editEmployee?.contactNumber ?? employee.contactNumber ?? "",
    isActive: editEmployee?.isActive ?? employee.isActive,
    notes: editEmployee?.notes ?? "",
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
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
            <div className="space-y-2">
              <Label>Ad *</Label>
              <Input placeholder="Ad" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Soyad *</Label>
              <Input placeholder="Soyad" {...register("surname")} />
              {errors.surname && (
                <p className="text-sm text-destructive">{errors.surname.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cinsiyet</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    key={`gender-${field.value}`}
                    value={field.value != null ? String(field.value) : "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Erkek</SelectItem>
                      <SelectItem value="2">Kadın</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Doğum Tarihi</Label>
              <Input
                type="date"
                {...register("birthDate")}
              />
            </div>

            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input
                type="email"
                placeholder="ornek@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                placeholder="0532 123 45 67"
                {...register("contactNumber")}
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

            {employee && (
              <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label>Durum</Label>
                  <p className="text-sm text-muted-foreground">
                    Çalışanın aktif veya pasif durumu
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
