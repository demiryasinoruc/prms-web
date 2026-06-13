import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Building2 } from "lucide-react"

import { formResolver } from "@/lib/form-resolver"
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
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/axios"

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

const createCompanySchema = z.object({
  name: z.string().min(1, "Firma adı zorunludur").max(200),
  email: z.string().min(1, "E-posta adresi zorunludur").max(256).email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(1, "Telefon zorunludur").max(50),
})

type CreateCompanyFormData = z.infer<typeof createCompanySchema>

export default function CreateCompanyPage() {
  const navigate = useNavigate()
  const { user, userType, token, refreshToken, setAuth, setCompany, setPermissions, logout } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateCompanyFormData>({
    resolver: formResolver<CreateCompanyFormData>(createCompanySchema),
    defaultValues: {
      name: "",
      email: user?.email ?? "",
      phone: "",
    },
  })

  const onSubmit = async (data: CreateCompanyFormData) => {
    setError(null)
    try {
      // Adım 1: Firmayı oluştur (backend Demo aboneliği + varsayılan depo/kategori/rol kurar)
      try {
        await api.post("/company", {
          Name: data.name,
          Email: data.email,
          Phone: data.phone,
        })
      } catch (err: unknown) {
        const errData = (err as { response?: { data?: { code?: string; Code?: string } } })?.response?.data
        const code = errData?.code || errData?.Code
        if (code === "AlreadyExists") {
          // Firma zaten var (yarım kalmış akış) — devam edip mevcut firmayı yükle
        } else {
          setError("Firma oluşturulamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.")
          return
        }
      }

      // Adım 2: Firma bilgisini al ve state'i tamamla
      const companyResponse = await api.get<CompanyResponse>("/company/get-company-by-user")
      const company = companyResponse.data
      localStorage.setItem("companyId", company.id)

      // Adım 3: Profili yenile (firma kurulurken rol + izinler atandı)
      const profileResponse = await api.get<ProfileResponse>("/user/profile")
      const profile = profileResponse.data

      if (token && refreshToken && userType !== null) {
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
      }
      setCompany({
        id: company.id,
        name: company.name,
        email: "",
        isActive: true,
      })
      setPermissions(profile.permissions)

      // Ana panele geç — onboarding wizard'ı (sektör şablonu) otomatik açılır
      navigate("/")
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Firmanızı Oluşturun</h1>
        <p className="text-sm text-muted-foreground">
          Son adım: firma bilgilerinizi girin, 14 günlük deneme hesabınız hazır olsun
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Örn. Yıldız Kiralama" autoComplete="organization" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma E-postası</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="info@firma.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="0(5xx) xxx xx xx" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Firmayı Oluştur ve Başla
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Farklı bir hesapla devam etmek için{" "}
        <button
          type="button"
          onClick={() => {
            logout()
            navigate("/login")
          }}
          className="font-medium text-primary hover:underline"
        >
          çıkış yapın
        </button>
      </p>
    </div>
  )
}
