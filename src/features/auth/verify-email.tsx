import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import api from "@/lib/axios"
import { useAuthStore } from "@/stores/auth"

type VerifyState = "loading" | "success" | "error"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [state, setState] = useState<VerifyState>(token ? "loading" : "error")
  const startedRef = useRef(false)
  const updateUser = useAuthStore((s) => s.updateUser)

  useEffect(() => {
    if (!token || startedRef.current) return
    startedRef.current = true
    api
      .post("/auth/verify-email", { Token: token })
      .then(() => {
        setState("success")
        // Oturum açıksa banner'ın anında kaybolması için store'u güncelle
        updateUser({ emailConfirmed: true })
      })
      .catch(() => setState("error"))
  }, [token, updateUser])

  if (state === "loading") {
    return (
      <div className="space-y-6 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">E-posta adresiniz doğrulanıyor...</p>
      </div>
    )
  }

  if (state === "success") {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">E-posta Doğrulandı</h1>
          <p className="text-sm text-muted-foreground">
            E-posta adresiniz başarıyla doğrulandı. Uygulamayı kullanmaya devam edebilirsiniz.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/">Uygulamaya Git</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Doğrulama Başarısız</h1>
        <p className="text-sm text-muted-foreground">
          Doğrulama bağlantısı geçersiz, kullanılmış veya süresi dolmuş olabilir.
          Uygulamaya giriş yapıp üst şeritteki "Yeniden Gönder" ile yeni bir doğrulama
          e-postası isteyebilirsiniz.
        </p>
      </div>
      <Button asChild className="w-full">
        <Link to="/login">Giriş Yap</Link>
      </Button>
    </div>
  )
}
