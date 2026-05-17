import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrentPlanTab } from "./current-plan-tab"
import { PaymentMethodsTab } from "./payment-methods-tab"
import { InvoicesTab } from "./invoices-tab"
import { CreditCard, FileText, Receipt } from "lucide-react"

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonelik Yönetimi</h1>
        <p className="text-muted-foreground">
          Planınızı, kartlarınızı ve fatura geçmişinizi tek yerden yönetin.
        </p>
      </div>

      <Tabs defaultValue="plan" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="plan" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Mevcut Plan</span>
            <span className="sm:hidden">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Kart Yönetimi</span>
            <span className="sm:hidden">Kartlar</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Fatura Geçmişi</span>
            <span className="sm:hidden">Faturalar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan">
          <CurrentPlanTab />
        </TabsContent>
        <TabsContent value="cards">
          <PaymentMethodsTab />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
