import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, ArrowLeft } from "lucide-react"

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
import api from "@/lib/axios"

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır").regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, "Şifre en az bir harf içermelidir").regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
    passwordConfirmation: z.string().min(1, "Şifre tekrarı zorunludur"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Şifreler eşleşmiyor",
    path: ["passwordConfirmation"],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: formResolver<ResetPasswordFormData>(resetPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirmation: "",
    },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null)
    try {
      await api.post("/auth/reset-password", {
        Token: token,
        Password: data.password,
        PasswordConfirmation: data.passwordConfirmation,
      })
      setIsSubmitted(true)
    } catch {
      setError(
        "Şifre sıfırlanamadı. Bağlantının süresi dolmuş veya daha önce kullanılmış olabilir."
      )
    }
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Geçersiz Bağlantı</h1>
          <p className="text-sm text-muted-foreground">
            Şifre sıfırlama bağlantısı eksik veya hatalı. Lütfen e-postanızdaki
            bağlantıyı kullanın ya da yeni bir sıfırlama talebi oluşturun.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/forgot-password">Yeni Sıfırlama Talebi</Link>
        </Button>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Şifre Güncellendi</h1>
          <p className="text-sm text-muted-foreground">
            Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/login">Giriş Yap</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Yeni Şifre Belirle</h1>
        <p className="text-sm text-muted-foreground">
          Hesabınız için yeni bir şifre girin
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yeni Şifre</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
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
                Kaydediliyor...
              </>
            ) : (
              "Şifreyi Güncelle"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Giriş Sayfasına Dön
        </Link>
      </div>
    </div>
  )
}
