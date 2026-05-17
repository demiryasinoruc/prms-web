import { Plus, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { PaymentMethodCard } from "./payment-method-card"
import { useDeletePaymentMethod, usePaymentMethods, useSetDefaultPaymentMethod } from "./hooks"

export function PaymentMethodsTab() {
  const { data: methods, isLoading } = usePaymentMethods()
  const setDefault = useSetDefaultPaymentMethod()
  const deleteMethod = useDeletePaymentMethod()

  const handleSetDefault = async (id: string) => {
    await setDefault.mutateAsync(id)
    toast.success("Varsayılan kart güncellendi.")
  }

  const handleDelete = async (id: string) => {
    await deleteMethod.mutateAsync(id)
    toast.success("Kart kaldırıldı.")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Kart Yönetimi</CardTitle>
          <CardDescription>
            Otomatik yenilemede kullanılacak kartı seçin veya yeni kart ekleyin.
          </CardDescription>
        </div>
        <Button onClick={() => toast.info("Kart ekleme akışı Faz 2A.5 sonrası gelecek.")}>
          <Plus className="mr-1 h-4 w-4" />
          Yeni kart ekle
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !methods || methods.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Henüz kayıtlı kart yok</p>
              <p className="text-sm text-muted-foreground">
                Bir kart eklediğinizde otomatik yenileme aktifleşir.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                paymentMethod={method}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                isLoading={setDefault.isPending || deleteMethod.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
