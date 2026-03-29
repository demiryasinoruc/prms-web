import { Pencil, Building2, User, Phone, Mail, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DetailSheetSkeleton, DetailSheetEmptyState } from "@/components/shared/detail-sheet-skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCustomer } from "./hooks"
import { CustomerType, type Customer } from "@/types/api"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"

interface CustomerDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string | null
  onEdit: (customer: Customer) => void
}

export function CustomerDetailSheet({
  open,
  onOpenChange,
  customerId,
  onEdit,
}: CustomerDetailSheetProps) {
  const { data: customer, isLoading } = useCustomer(customerId || "")
  const canUpdate = usePermission(Permissions.Customer.Update)

  const isIndividual = customer?.customerType === CustomerType.Individual

  const handleEdit = () => {
    if (customer) {
      onEdit(customer)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <DetailSheetSkeleton title="Müşteri Detayları" />
        ) : customer ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    {isIndividual ? (
                      <User className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <SheetTitle className="text-left">{customer.name}</SheetTitle>
                    <SheetDescription className="sr-only">Müşteri detay bilgileri</SheetDescription>
                    <Badge variant="outline" className="mt-1">
                      {isIndividual ? "Bireysel" : "Kurumsal"}
                    </Badge>
                  </div>
                </div>
                {canUpdate && (
                  <Button size="sm" onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Düzenle
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
                  <CardDescription>Müşteri iletişim detayları</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}
                  {!customer.phone && !customer.email && (
                    <p className="text-sm text-muted-foreground">İletişim bilgisi girilmemiş</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {isIndividual ? "Kimlik Bilgileri" : "Vergi Bilgileri"}
                  </CardTitle>
                  <CardDescription>
                    {isIndividual ? "TC kimlik bilgileri" : "Kurumsal vergi bilgileri"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isIndividual ? (
                    customer.identityNumber ? (
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">TC Kimlik No</p>
                          <p className="text-sm font-medium">{customer.identityNumber}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">TC kimlik bilgisi girilmemiş</p>
                    )
                  ) : (
                    <>
                      {customer.taxNumber && (
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Vergi No</p>
                            <p className="text-sm font-medium">{customer.taxNumber}</p>
                          </div>
                        </div>
                      )}
                      {customer.taxOffice && (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Vergi Dairesi</p>
                            <p className="text-sm font-medium">{customer.taxOffice}</p>
                          </div>
                        </div>
                      )}
                      {!customer.taxNumber && !customer.taxOffice && (
                        <p className="text-sm text-muted-foreground">Vergi bilgisi girilmemiş</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {customer.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Notlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                  </CardContent>
                </Card>
              )}

              {customer.addresses && customer.addresses.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Adresler</CardTitle>
                    <CardDescription>{customer.addresses.length} adres kayıtlı</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {customer.addresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{address.title}</span>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">Varsayılan</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.addressLine1}
                          {address.addressLine2 && `, ${address.addressLine2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}{address.state && `, ${address.state}`} - {address.country}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <DetailSheetEmptyState title="Müşteri Detayları" message="Müşteri bulunamadı" />
        )}
      </SheetContent>
    </Sheet>
  )
}
