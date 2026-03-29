import { Pencil, User, Mail, Phone, Calendar, FileText } from "lucide-react"
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
import { Gender, type Employee } from "@/types/api"

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
    </Sheet>
  )
}
