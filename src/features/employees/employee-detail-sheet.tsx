import { useState } from "react"
import {
  Pencil,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Award,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react"
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
import { useEmployee } from "./hooks"
import {
  useEmployeeCertificates,
  useRemoveEmployeeCertificate,
} from "@/features/employee-certificates/hooks"
import { EmployeeCertificateAddDialog } from "@/features/employee-certificates/employee-certificate-add-dialog"
import { usePermission } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { Gender, type Employee } from "@/types/api"
import { toast } from "sonner"

const genderLabels: Record<Gender, string> = {
  [Gender.Male]: "Erkek",
  [Gender.Female]: "Kadın",
}

interface EmployeeDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string | null
  onEdit: (employee: Employee) => void
}

export function EmployeeDetailSheet({
  open,
  onOpenChange,
  employeeId,
  onEdit,
}: EmployeeDetailSheetProps) {
  const { data: employee, isLoading } = useEmployee(employeeId || "")
  const canManage = usePermission(Permissions.Employee.Update)
  const [addCertOpen, setAddCertOpen] = useState(false)
  const { data: certificates, isLoading: isLoadingCerts } = useEmployeeCertificates(
    open ? employeeId : null,
  )
  const removeCert = useRemoveEmployeeCertificate(employeeId || "")

  const handleRemoveCert = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" sertifika atamasını kaldırmak istediğinize emin misiniz?`)) {
      return
    }
    try {
      await removeCert.mutateAsync(id)
      toast.success("Sertifika ataması kaldırıldı")
    } catch {
      // axios interceptor handles
    }
  }

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: "Süresiz", variant: "secondary" as const, isExpired: false }
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: "Süresi Dolmuş", variant: "destructive" as const, isExpired: true }
    if (diffDays <= 30)
      return {
        label: `${diffDays} gün kaldı`,
        variant: "default" as const,
        isExpired: false,
        isExpiring: true,
      }
    return { label: "Geçerli", variant: "default" as const, isExpired: false }
  }

  const handleEdit = () => {
    if (employee) {
      onEdit(employee)
      onOpenChange(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("tr-TR")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <DetailSheetSkeleton title="Çalışan Detayları" />
        ) : employee ? (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <SheetTitle className="text-left">
                      {employee.name} {employee.surname}
                    </SheetTitle>
                    <SheetDescription className="text-left">
                      Çalışan Detayları
                    </SheetDescription>
                  </div>
                </div>
                <Button size="sm" onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
              </div>
            </SheetHeader>

            <div className="flex gap-2">
              <Badge variant="outline">
                {genderLabels[employee.gender]}
              </Badge>
              <Badge variant={employee.isActive ? "default" : "secondary"}>
                {employee.isActive ? "Aktif" : "Pasif"}
              </Badge>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
                  <CardDescription>E-posta ve telefon</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">E-posta</p>
                        <p className="text-sm font-medium">{employee.email}</p>
                      </div>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefon</p>
                        <p className="text-sm font-medium">{employee.phone}</p>
                      </div>
                    </div>
                  )}
                  {!employee.email && !employee.phone && (
                    <p className="text-sm text-muted-foreground">İletişim bilgisi girilmemiş</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
                  <CardDescription>Doğum tarihi ve diğer bilgiler</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Doğum Tarihi</p>
                      <p className="text-sm font-medium">{formatDate(employee.birthDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      Sertifikalar
                    </CardTitle>
                    <CardDescription>
                      Çalışanın sahip olduğu sertifikalar ve geçerlilik durumları
                    </CardDescription>
                  </div>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => setAddCertOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" />
                      Ekle
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingCerts ? (
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  ) : !certificates || certificates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Atanmış sertifika bulunmuyor.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {certificates.map((cert) => {
                        const status = getExpiryStatus(cert.expiryDate)
                        return (
                          <div
                            key={cert.id}
                            className="flex items-start justify-between gap-3 rounded-md border p-3"
                          >
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{cert.certificateName}</p>
                                <Badge variant={status.variant}>
                                  {status.isExpired && <AlertTriangle className="mr-1 h-3 w-3" />}
                                  {status.label}
                                </Badge>
                              </div>
                              {cert.expiryDate && (
                                <p className="text-xs text-muted-foreground">
                                  Geçerlilik: {new Date(cert.expiryDate).toLocaleDateString("tr-TR")}
                                </p>
                              )}
                              {cert.notes && (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {cert.notes}
                                </p>
                              )}
                            </div>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                                title="Kaldır"
                                onClick={() => handleRemoveCert(cert.id, cert.certificateName)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {employee.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Notlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm whitespace-pre-wrap">{employee.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <DetailSheetEmptyState title="Çalışan Detayları" message="Çalışan bulunamadı" />
        )}
      </SheetContent>

      {employeeId && (
        <EmployeeCertificateAddDialog
          open={addCertOpen}
          onOpenChange={setAddCertOpen}
          employeeId={employeeId}
          excludeCertificateIds={(certificates || []).map((c) => c.certificateId)}
        />
      )}
    </Sheet>
  )
}
