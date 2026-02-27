import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Lock, Save } from "lucide-react"
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
import { useProfile, useUpdateProfile, useChangePassword } from "./hooks"
import { useAuthStore } from "@/stores/auth"
import { toast } from "sonner"

const profileSchema = z.object({
  name: z.string().min(1, "Ad zorunludur"),
  surname: z.string().min(1, "Soyad zorunludur"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  passwordConfirmation: z.string().min(6, "Şifre tekrar en az 6 karakter olmalıdır"),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Şifreler eşleşmiyor",
  path: ["passwordConfirmation"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  // Profile form
  const profileDefaultValues: ProfileFormData = {
    name: "",
    surname: "",
    email: "",
  }

  const profileFormValues: ProfileFormData = profile ? {
    name: profile.name,
    surname: profile.surname,
    email: profile.email,
  } : profileDefaultValues

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profileFormValues,
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user?.id || !user?.roleId) return

    try {
      await updateProfile.mutateAsync({
        id: user.id,
        data: {
          name: data.name,
          surname: data.surname,
          email: data.email,
        },
        roleId: user.roleId,
      })
      toast.success("Profil bilgileri güncellendi")
    } catch {
      // Error handled by axios interceptor
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync({
        password: data.password,
        passwordConfirmation: data.passwordConfirmation,
      })
      toast.success("Şifre başarıyla değiştirildi")
      resetPassword()
    } catch {
      // Error handled by axios interceptor
    }
  }

  const isProfileSubmitting = updateProfile.isPending
  const isPasswordSubmitting = changePassword.isPending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Kişisel bilgilerinizi ve şifrenizi yönetin
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Kişisel Bilgiler</CardTitle>
              <CardDescription>
                Ad, soyad ve iletişim bilgileriniz
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
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Ad *</Label>
                <Input
                  placeholder="Adınız"
                  {...registerProfile("name")}
                />
                {profileErrors.name && (
                  <p className="text-sm text-destructive">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Soyad *</Label>
                <Input
                  placeholder="Soyadınız"
                  {...registerProfile("surname")}
                />
                {profileErrors.surname && (
                  <p className="text-sm text-destructive">{profileErrors.surname.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>E-posta *</Label>
                <Input
                  type="email"
                  placeholder="ornek@firma.com"
                  {...registerProfile("email")}
                />
                {profileErrors.email && (
                  <p className="text-sm text-destructive">{profileErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <p className="text-sm text-muted-foreground">
                  {profile?.roleName || "Rol atanmamış"}
                </p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isProfileSubmitting || !isProfileDirty}>
                  {isProfileSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Kaydet
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesap güvenliğiniz için şifrenizi güncelleyin
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>Yeni Şifre *</Label>
              <Input
                type="password"
                placeholder="Yeni şifreniz"
                {...registerPassword("password")}
              />
              {passwordErrors.password && (
                <p className="text-sm text-destructive">{passwordErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Şifre Tekrar *</Label>
              <Input
                type="password"
                placeholder="Yeni şifrenizi tekrar giriniz"
                {...registerPassword("passwordConfirmation")}
              />
              {passwordErrors.passwordConfirmation && (
                <p className="text-sm text-destructive">{passwordErrors.passwordConfirmation.message}</p>
              )}
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isPasswordSubmitting}>
                {isPasswordSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Şifreyi Değiştir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
