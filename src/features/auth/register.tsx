import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { formResolver } from "@/lib/form-resolver"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/axios"

interface AuthResponse {
  token: string
  refreshToken: string
  userType: number
}

interface ProfileResponse {
  id: string
  name: string
  surname: string
  email: string
  roleId: string | null
  roleName: string | null
  permissions: string[]
}

const registerSchema = z.object({
  name: z.string().min(1, "Ad zorunludur").max(200),
  surname: z.string().min(1, "Soyad zorunludur").max(200),
  email: z.string().min(1, "E-posta adresi zorunludur").max(256).email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  passwordAgain: z.string().min(1, "Şifre tekrarı zorunludur"),
  terms: z.boolean().refine((v) => v, "Kullanım koşulları kabul edilmelidir"),
}).refine((data) => data.password === data.passwordAgain, {
  message: "Şifreler eşleşmiyor",
  path: ["passwordAgain"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth, setPermissions } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RegisterFormData>({
    resolver: formResolver<RegisterFormData>(registerSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      passwordAgain: "",
      terms: false,
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    try {
      // Adım 1: Kayıt ol ve token al
      let token: string
      let refreshToken: string
      let userType: number
      try {
        const response = await api.post<AuthResponse>("/auth/register", {
          Name: data.name,
          Surname: data.surname,
          Email: data.email,
          Password: data.password,
          PasswordAgain: data.passwordAgain,
          Terms: "accepted",
        })
        token = response.data.token
        refreshToken = response.data.refreshToken
        userType = response.data.userType
      } catch (err: unknown) {
        const data = (err as { response?: { data?: { code?: string; Code?: string } } })?.response?.data
        const code = data?.code || data?.Code
        if (code === "AlreadyExists") {
          setError("Bu e-posta adresiyle kayıtlı bir hesap zaten var.")
        } else {
          setError("Kayıt oluşturulamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.")
        }
        return
      }

      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)

      // Adım 2: Profili al (yeni kullanıcının henüz firması ve rolü yok)
      let profile: ProfileResponse
      try {
        const profileResponse = await api.get<ProfileResponse>("/user/profile")
        profile = profileResponse.data
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        setError("Profil bilgileri alınamadı. Lütfen giriş yaparak devam edin.")
        return
      }

      setAuth({
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
        email: profile.email,
        companyId: "",
        companyName: "",
        roleId: "",
        roleName: "",
      }, token, refreshToken, userType)
      setPermissions([])

      // Adım 3: Firma oluşturma adımına geç
      navigate("/create-company")
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Ücretsiz Hesap Oluştur</h1>
        <p className="text-sm text-muted-foreground">
          14 gün ücretsiz deneyin — kredi kartı gerekmez
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad</FormLabel>
                  <FormControl>
                    <Input placeholder="Adınız" autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soyad</FormLabel>
                  <FormControl>
                    <Input placeholder="Soyadınız" autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="ornek@firma.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="En az 6 karakter" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordAgain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şifre Tekrar</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Şifrenizi tekrar girin" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal leading-snug">
                    Kullanım koşullarını ve KVKK aydınlatma metnini okudum, kabul ediyorum.
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hesap Oluştur
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  )
}
