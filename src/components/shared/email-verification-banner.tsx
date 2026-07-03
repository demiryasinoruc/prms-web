import { useState } from "react"
import { MailWarning } from "lucide-react"
import { toast } from "sonner"

import api from "@/lib/axios"
import { useAuthStore } from "@/stores/auth"

/**
 * Yumuşak e-posta doğrulama banner'ı: kullanıcının e-postası doğrulanmamışsa
 * ana layout'un üstünde görünür. Giriş engellenmez.
 */
export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // emailConfirmed undefined ise (eski oturum verisi) banner gösterme — yanlış alarm olmasın.
  if (!user || user.emailConfirmed !== false) return null

  const resend = async () => {
    setSending(true)
    try {
      await api.post("/user/resend-email-verification")
      setSent(true)
      toast.success("Doğrulama e-postası gönderildi. Gelen kutunuzu kontrol edin.")
    } catch {
      // axios interceptor hata toast'ını zaten gösterir
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <MailWarning className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        E-posta adresiniz henüz doğrulanmadı. <strong>{user.email}</strong> adresine gönderilen
        bağlantıya tıklayın.
      </span>
      <button
        type="button"
        onClick={resend}
        disabled={sending || sent}
        className="shrink-0 font-medium underline underline-offset-4 hover:no-underline disabled:opacity-50"
      >
        {sent ? "Gönderildi" : sending ? "Gönderiliyor..." : "Yeniden Gönder"}
      </button>
    </div>
  )
}
