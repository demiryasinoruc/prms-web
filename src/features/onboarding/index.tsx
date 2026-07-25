import { useState } from "react"
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OnboardingWizard } from "./onboarding-wizard"
import { useOnboardingStatus } from "./hooks"

export default function SectorTemplateSettingsPage() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const { data: onboarding, isLoading } = useOnboardingStatus()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sektör Şablonu</h1>
        <p className="text-sm text-muted-foreground">
          Sektörünüze uygun hazır kategori, öznitelik, ek hizmet ve ürünleri tek tıkla ekleyin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Hızlı Başlangıç Sihirbazı
          </CardTitle>
          <CardDescription>
            Sihirbazı istediğiniz zaman yeniden açıp şablon uygulayabilirsiniz. Aynı isimle
            önceden eklenmiş içerikler atlanır; mevcut verileriniz değişmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLoading && onboarding?.completed && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              Başlangıç adımı tamamlanmış olarak işaretlenmiş. İstediğiniz zaman tekrar şablon
              uygulayabilirsiniz.
            </div>
          )}
          <Button onClick={() => setWizardOpen(true)} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Şablon Sihirbazını Aç
          </Button>
        </CardContent>
      </Card>

      <OnboardingWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}
