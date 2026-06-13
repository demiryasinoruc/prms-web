import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { formResolver } from "@/lib/form-resolver"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuthStore, SYSTEM_ADMIN_USER_TYPE } from "@/stores/auth"
import api from "@/lib/axios"

interface AuthResponse {
  token: string
  refreshToken: string
  userType: number
}

interface CompanyResponse {
  id: string
  name: string
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

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setCompany, setPermissions } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: formResolver<LoginFormData>(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const clearAuthState = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("companyId")
  }

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      // Adım 1: Giriş yap ve token al
      let token: string
      let refreshToken: string
      let userType: number
      try {
        const authResponse = await api.post<AuthResponse>("/auth/login", {
          email: data.email,
          password: data.password,
        })
        token = authResponse.data.token
        refreshToken = authResponse.data.refreshToken
        userType = authResponse.data.userType
      } catch {
        setError("E-posta veya şifre hatalı.")
        return
      }

      // Token'ları sakla (sonraki istekler için gerekli)
      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)

      // Sistem yöneticisi: firma ve rol-tabanlı izin akışını atla
      if (userType === SYSTEM_ADMIN_USER_TYPE) {
        let profile: ProfileResponse
        try {
          const profileResponse = await api.get<ProfileResponse>("/user/profile")
          profile = profileResponse.data
        } catch {
          clearAuthState()
          setError("Profil bilgileri alınamadı. Lütfen tekrar deneyin.")
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

        navigate("/admin")
        return
      }

      // Adım 2: Kullanıcının firmasını al
      let company: CompanyResponse
      try {
        const companyResponse = await api.get<CompanyResponse>("/company/get-company-by-user")
        company = companyResponse.data
      } catch {
        // Firma yoksa self-serve kayıt yarım kalmıştır — firma oluşturma adımına yönlendir.
        try {
          const hasCompanyResponse = await api.get<{ hasCompany: boolean }>("/company/user-has-company")
          if (!hasCompanyResponse.data.hasCompany) {
            const profileResponse = await api.get<ProfileResponse>("/user/profile")
            const profile = profileResponse.data
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
            navigate("/create-company")
            return
          }
        } catch {
          // user-has-company da başarısızsa aşağıdaki genel hataya düş
        }
        clearAuthState()
        setError("Hesabınıza bağlı bir firma bulunamadı. Lütfen yöneticinizle iletişime geçin.")
        return
      }
      localStorage.setItem("companyId", company.id)

      // Adım 3: Kullanıcı profilini al
      let profile: ProfileResponse
      try {
        const profileResponse = await api.get<ProfileResponse>("/user/profile")
        profile = profileResponse.data
      } catch {
        clearAuthState()
        setError("Profil bilgileri alınamadı. Lütfen tekrar deneyin.")
        return
      }

      // Adım 4: Auth state'i güncelle
      setAuth({
        id: profile.id,
        name: profile.name,
        surname: profile.surname,
        email: profile.email,
        companyId: company.id,
        companyName: company.name,
        roleId: profile.roleId || "",
        roleName: profile.roleName || "",
      }, token, refreshToken, userType)
      setCompany({
        id: company.id,
        name: company.name,
        email: "",
        isActive: true,
      })
      setPermissions(profile.permissions)

      navigate("/")
    } catch {
      clearAuthState()
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Giriş Yap</h1>
        <p className="text-sm text-muted-foreground">
          Hesabınıza giriş yapmak için bilgilerinizi girin
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="ornek@firma.com"
                    {...field}
                  />
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
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="text-sm text-destructive text-center">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giriş yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link
          to="/forgot-password"
          className="text-primary underline-offset-4 hover:underline"
        >
          Şifremi unuttum
        </Link>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Ücretsiz kayıt olun
        </Link>
      </p>
    </div>
  )
}
