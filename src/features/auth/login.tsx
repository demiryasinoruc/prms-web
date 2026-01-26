import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useAuthStore } from "@/stores/auth"
import api from "@/lib/axios"

interface AuthResponse {
  token: string
  refreshToken: string
}

interface CompanyResponse {
  id: string
  name: string
}

interface ProfileResponse {
  name: string
  surname: string
  eMail: string
  roleId: string | null
  roleName: string | null
  permissions: string[]
}

const loginSchema = z.object({
  email: z.string().email("Gecerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Sifre en az 6 karakter olmalidir"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setCompany, setPermissions } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      // Step 1: Login and get tokens
      const authResponse = await api.post<AuthResponse>("/auth/login", {
        eMail: data.email,
        password: data.password,
      })
      const { token, refreshToken } = authResponse.data

      // Store tokens immediately for next request
      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)

      // Step 2: Fetch user's company first (needed for X-Company-ID header)
      const companyResponse = await api.get<CompanyResponse>("/company/get-company-by-user")
      const company = companyResponse.data
      localStorage.setItem("companyId", company.id)

      // Step 3: Fetch user profile (includes permissions)
      const profileResponse = await api.get<ProfileResponse>("/user/profile")
      const profile = profileResponse.data

      // Step 4: Set auth state with user info
      setAuth({
        id: "",
        name: profile.name,
        surname: profile.surname,
        email: profile.eMail,
        companyId: company.id,
        companyName: company.name,
        roleId: profile.roleId || "",
        roleName: profile.roleName || "",
      }, token, refreshToken)
      setCompany({
        id: company.id,
        name: company.name,
        email: "",
        isActive: true,
      })
      setPermissions(profile.permissions)

      navigate("/")
    } catch {
      setError("E-posta veya sifre hatali")
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Giris Yap</h1>
        <p className="text-sm text-muted-foreground">
          Hesabiniza giris yapmak icin bilgilerinizi girin
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
                <FormLabel>Sifre</FormLabel>
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
                Giris yapiliyor...
              </>
            ) : (
              "Giris Yap"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <a
          href="/forgot-password"
          className="text-primary underline-offset-4 hover:underline"
        >
          Sifremi unuttum
        </a>
      </div>
    </div>
  )
}
