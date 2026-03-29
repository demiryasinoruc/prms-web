import { useState } from "react"
import { Link } from "react-router-dom"
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Gecerli bir e-posta adresi giriniz"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: formResolver<ForgotPasswordFormData>(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    try {
      await api.post("/auth/forgot-password", {
        email: data.email,
      })
      setIsSubmitted(true)
    } catch {
      setError("Sifre sifirlama istegi gonderilemedi")
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">E-posta Gonderildi</h1>
          <p className="text-sm text-muted-foreground">
            Sifre sifirlama talebiniz alindi. E-posta adresinizi kontrol edin.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link to="/login">Giris Sayfasina Don</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sifremi Unuttum</h1>
        <p className="text-sm text-muted-foreground">
          Hesabinizla iliskili e-posta adresini girin
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
                Gonderiliyor...
              </>
            ) : (
              "Sifre Sifirlama Linki Gonder"
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
          Giris Sayfasina Don
        </Link>
      </div>
    </div>
  )
}
