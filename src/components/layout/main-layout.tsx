import { useEffect, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { ShieldAlert, LogOut } from "lucide-react"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { UserNav } from "./user-nav"
import { Breadcrumbs } from "./breadcrumbs"
import { NotificationBell } from "@/features/notifications/notification-bell"
import { useNotificationHub } from "@/features/notifications/use-notification-hub"
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard"
import { useOnboardingStatus } from "@/features/onboarding/hooks"
import { useAuthStore } from "@/stores/auth"

export default function MainLayout() {
  const { data: onboarding } = useOnboardingStatus()
  const [wizardOpen, setWizardOpen] = useState(false)
  const navigate = useNavigate()
  const impersonatedCompany = useAuthStore((s) => s.impersonatedCompany)
  const exitImpersonation = useAuthStore((s) => s.exitImpersonation)

  // Bildirimler için gerçek zamanlı SignalR bağlantısı (polling fallback olarak kalır)
  useNotificationHub()

  // Onboarding tamamlanmamışsa wizard'ı otomatik aç (login sonrası ilk render)
  // Sysadmin impersonation modundaysa müşteri için tamamlanmış olabilir — wizard görünür kalır,
  // sysadmin "Atla" diyebilir veya gerçekten o müşterinin onboarding'ini yapar.
  useEffect(() => {
    if (onboarding && !onboarding.completed) {
      setWizardOpen(true)
    }
  }, [onboarding])

  const handleExitImpersonation = () => {
    exitImpersonation()
    navigate("/admin/companies")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {impersonatedCompany && (
          <div className="flex items-center gap-2 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-medium text-amber-900 dark:text-amber-200">
              Yönetici Modu
            </span>
            <span className="text-amber-900/80 dark:text-amber-200/80">
              · <span className="font-semibold">{impersonatedCompany.name}</span> firmasını görüntülüyorsunuz
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7 px-2 text-amber-900 hover:bg-amber-500/20 dark:text-amber-200"
              onClick={handleExitImpersonation}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Çık
            </Button>
          </div>
        )}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <OnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </SidebarProvider>
  )
}
