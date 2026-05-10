import { useLocation, Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"

const routeLabels: Record<string, string> = {
  "": "Ana Sayfa",
  // Ana İşlemler
  rentals: "Kiralamalar",
  calendar: "Takvim",
  customers: "Müşteriler",
  // Ürün & Stok
  products: "Ürünler",
  inventory: "Envanter",
  "maintenance-schedules": "Bakım Planları",
  "maintenance-records": "Bakım Kayıtları",
  // Kaynaklar
  warehouses: "Depolar",
  vehicles: "Araçlar",
  employees: "Çalışanlar",
  certificates: "Sertifikalar",
  // Tanımlar
  categories: "Kategoriler",
  "extra-services": "Ek Hizmetler",
  "product-rules": "Ürün Kuralları",
  // Ayarlar
  settings: "Ayarlar",
  company: "Firma Bilgileri",
  users: "Kullanıcılar",
  roles: "Roller",
  invitations: "Davetler",
  profile: "Profil",
  usage: "Plan Kullanımı",
  // Geriye uyumluluk
  operations: "Operasyon",
  "category-attributes": "Kategori Özellikleri",
  rules: "Ürün Kuralları",
  // Sistem Yönetici Paneli
  admin: "Sistem Yönetimi",
  plans: "Planlar",
  companies: "Firmalar",
}

export function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter((x) => x)

  if (pathnames.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Ana Sayfa
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">Ana Sayfa</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathnames.map((segment, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`
          const isLast = index === pathnames.length - 1
          const label = routeLabels[segment] || segment

          return (
            <Fragment key={routeTo}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={routeTo}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
