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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import {
  useCreateEmployeeLeave,
  useUpdateEmployeeLeave,
  useEmployeeLeaveForEdit,
  useEmployeeSelect,
} from "./hooks"
import { LeaveType, LeaveTypeLabels, type EmployeeLeave } from "./api"

const employeeLeaveSchema = z.object({
  employeeId: z.string().min(1, "Çalışan seçimi zorunludur"),
  leaveType: z.nativeEnum(LeaveType),
  startDate: z.string().min(1, "Başlangıç tarihi zorunludur"),
  endDate: z.string().min(1, "Bitiş tarihi zorunludur"),
  notes: z.string().max(2000, "Not en fazla 2000 karakter olabilir").optional().default(""),
})

type EmployeeLeaveFormData = z.infer<typeof employeeLeaveSchema>

interface EmployeeLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leave: EmployeeLeave | null
}

const defaultValues: EmployeeLeaveFormData = {
  employeeId: "",
  leaveType: LeaveType.Annual,
  startDate: "",
  endDate: "",
  notes: "",
}

export function EmployeeLeaveDialog({
  open,
  onOpenChange,
  leave,
}: EmployeeLeaveDialogProps) {
  const createLeave = useCreateEmployeeLeave()
  const updateLeave = useUpdateEmployeeLeave()

  const { data: leaveData } = useEmployeeLeaveForEdit(leave?.id || "")
  const editLeave = leave ? leaveData : null

  const { data: employees } = useEmployeeSelect()

  const formValues: EmployeeLeaveFormData = (open && leave) ? {
    employeeId: editLeave?.employeeId ?? leave.employeeId,
    leaveType: editLeave?.leaveType ?? leave.leaveType,
    startDate: editLeave?.startDate
      ? editLeave.startDate.split("T")[0]
      : leave.startDate
        ? leave.startDate.split("T")[0]
        : "",
    endDate: editLeave?.endDate
      ? editLeave.endDate.split("T")[0]
      : leave.endDate
        ? leave.endDate.split("T")[0]
        : "",
    notes: editLeave?.notes ?? leave.notes ?? "",
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeLeaveFormData>({
    resolver: formResolver<EmployeeLeaveFormData>(employeeLeaveSchema),
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: EmployeeLeaveFormData) => {
    try {
      // Backend DateTime bekliyor; date input yyyy-MM-dd üretir, ISO'ya çevir.
      const requestData = {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        notes: data.notes || null,
      }

      if (leave) {
        await updateLeave.mutateAsync({
          id: leave.id,
          data: { ...requestData, id: leave.id },
        })
      } else {
        await createLeave.mutateAsync(requestData)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = createLeave.isPending || updateLeave.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {leave ? "İzin Düzenle" : "Yeni İzin"}
          </DialogTitle>
          <DialogDescription>
            Çalışan izin bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Çalışan *</Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select
                  key={`employee-${field.value}`}
                  value={field.value || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Çalışan seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>
                      Çalışan seçiniz
                    </SelectItem>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toLowerCase()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId && (
              <p className="text-sm text-destructive">{errors.employeeId.message}</p>
            )}
          </div>

          <FormSelectField
            label="İzin Türü *"
            name="leaveType"
            control={control}
            valueType="number"
            options={Object.entries(LeaveTypeLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            placeholder="İzin türü seçiniz"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Başlangıç Tarihi *"
              type="date"
              {...register("startDate")}
              error={errors.startDate?.message}
            />

            <FormField
              label="Bitiş Tarihi *"
              type="date"
              {...register("endDate")}
              error={errors.endDate?.message}
            />
          </div>

          <FormField
            label="Notlar"
            placeholder="Ek notlar..."
            {...register("notes")}
            multiline
            rows={3}
            error={errors.notes?.message}
          />

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
              {leave ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
