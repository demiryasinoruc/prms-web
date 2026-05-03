import { useState } from "react"
import { Building2, CalendarClock, CalendarPlus, Repeat, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSubscriptionHistory } from "./hooks"
import { ExtendSubscriptionDialog } from "./extend-subscription-dialog"
import { ChangePlanDialog } from "./change-plan-dialog"
import { CreateSubscriptionDialog } from "./create-subscription-dialog"
import type { AdminCompanyListItem } from "./api"

interface CompanyDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: AdminCompanyListItem | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function CompanyDetailSheet({
  open,
  onOpenChange,
  company,
}: CompanyDetailSheetProps) {
  const { data: history, isLoading } = useSubscriptionHistory(company?.id ?? null)

  const [extendOpen, setExtendOpen] = useState(false)
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {!company ? (
            <>
              <SheetHeader>
                <SheetTitle>Firma Bulunamadı</SheetTitle>
                <SheetDescription>Seçilen firma kaydı bulunamadı.</SheetDescription>
              </SheetHeader>
            </>
          ) : (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <SheetTitle className="text-left">{company.name}</SheetTitle>
                    <SheetDescription className="text-left">
                      {company.email} · {company.phone}
                    </SheetDescription>
                    {company.activeSubscription ? (
                      <Badge variant={company.activeSubscription.isDemo ? "secondary" : "default"} className="mt-1">
                        {company.activeSubscription.planName} · {company.activeSubscription.daysRemaining} gün kaldı
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-1">Aktif abonelik yok</Badge>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Abonelik Aksiyonları</CardTitle>
                  <CardDescription>Bu firma için abonelik düzenlemeleri</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExtendOpen(true)}
                    disabled={!company.activeSubscription}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Uzat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChangePlanOpen(true)}
                  >
                    <Repeat className="mr-2 h-4 w-4" />
                    Plan Değiştir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Yeni Abonelik
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Abonelik Geçmişi</CardTitle>
                  <CardDescription>
                    {history?.length ?? 0} kayıt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !history || history.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Henüz abonelik kaydı yok
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.planName}</span>
                              {item.isDemo && (
                                <Badge variant="secondary" className="text-xs">Deneme</Badge>
                              )}
                              {item.isActive && (
                                <Badge variant="default" className="text-xs">Aktif</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(item.startDate)} → {formatDate(item.endDate)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {company && (
        <>
          <ExtendSubscriptionDialog
            open={extendOpen}
            onOpenChange={setExtendOpen}
            companyId={company.id}
            companyName={company.name}
            currentEndDate={company.activeSubscription?.endDate ?? null}
          />
          <ChangePlanDialog
            open={changePlanOpen}
            onOpenChange={setChangePlanOpen}
            companyId={company.id}
            companyName={company.name}
          />
          <CreateSubscriptionDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            companyId={company.id}
            companyName={company.name}
          />
        </>
      )}
    </>
  )
}
