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
import { useUserForEdit, useUpdateUser } from "./hooks"
import { useRoleSelect } from "@/features/roles/hooks"

const userSchema = z.object({
  name: z.string().min(1, "Ad zorunludur"),
  surname: z.string().min(1, "Soyad zorunludur"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  roleId: z.string().min(1, "Rol seçiniz"),
})

type UserFormData = z.infer<typeof userSchema>

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
}

const defaultValues: UserFormData = {
  name: "",
  surname: "",
  email: "",
  roleId: "",
}

export function UserDialog({ open, onOpenChange, userId }: UserDialogProps) {
  const { data: userForEdit, isLoading: isLoadingUser } = useUserForEdit(userId)
  const { data: roles } = useRoleSelect()
  const updateUser = useUpdateUser()

  const formValues: UserFormData = (open && userForEdit) ? {
    name: userForEdit.name,
    surname: userForEdit.surname,
    email: userForEdit.email,
    roleId: userForEdit.roleId || "",
  } : defaultValues

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: formResolver<UserFormData>(userSchema),
    defaultValues,
    values: open ? formValues : defaultValues,
  })

  const onSubmit = async (data: UserFormData) => {
    if (!userId) return

    try {
      await updateUser.mutateAsync({
        id: userId,
        data: {
          name: data.name,
          surname: data.surname,
          email: data.email,
          roleId: data.roleId,
        },
      })
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const isSubmitting = updateUser.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          <DialogDescription>Kullanıcı bilgilerini güncelleyin</DialogDescription>
        </DialogHeader>

        {isLoadingUser ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
            </div>

            <div className="space-y-2">
              <Label>E-posta *</Label>
              <Input type="email" placeholder="ornek@sirket.com" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Rol *</Label>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select
                    key={`roleId-${field.value}`}
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Rol seçiniz
                      </SelectItem>
                      {roles?.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.roleId && (
                <p className="text-sm text-destructive">{errors.roleId.message}</p>
              )}
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Güncelle
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
