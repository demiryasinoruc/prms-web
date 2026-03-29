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
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import { useCreateInvitation } from "./hooks"
import { useRoleSelect } from "@/features/roles/hooks"
import { toast } from "sonner"

const invitationSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta adresi zorunlu")
    .email("Geçerli bir e-posta adresi giriniz"),
  roleId: z.string().min(1, "Rol seçimi zorunlu"),
})

type InvitationFormData = z.infer<typeof invitationSchema>

interface InvitationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultValues: InvitationFormData = {
  email: "",
  roleId: "",
}

export function InvitationDialog({ open, onOpenChange }: InvitationDialogProps) {
  const createInvitation = useCreateInvitation()
  const { data: roles } = useRoleSelect()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InvitationFormData>({
    resolver: formResolver<InvitationFormData>(invitationSchema),
    values: open ? defaultValues : defaultValues,
  })

  const onSubmit = async (data: InvitationFormData) => {
    try {
      await createInvitation.mutateAsync({
        email: data.email,
        roleId: data.roleId,
      })
      toast.success("Davet başarıyla gönderildi")
      onOpenChange(false)
    } catch {
      // Error handled by axios interceptor
    }
  }

  const roleOptions = (roles || []).map((role) => ({
    value: role.id,
    label: role.name,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Davet</DialogTitle>
          <DialogDescription>
            Kullanıcıya e-posta ile davet gönderin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="E-posta Adresi"
            type="email"
            placeholder="ornek@firma.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <FormSelectField
            label="Rol"
            name="roleId"
            control={control}
            options={roleOptions}
            placeholder="Rol seçiniz"
            error={errors.roleId?.message}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Davet Gönder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
