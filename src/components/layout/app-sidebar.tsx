import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  Warehouse,
  Truck,
  UserCog,
  Calendar,
  Settings,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permission"
import { Permissions } from "@/lib/permissions"
import { useMemo } from "react"

interface NavSubItem {
  title: string
  href: string
  permission?: string
}

interface NavItem {
  title: string
  icon: LucideIcon
  href?: string
  permission?: string
  items?: NavSubItem[]
}

const navigation: NavItem[] = [
  {
    title: "Ana Sayfa",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Müşteriler",
    icon: Users,
    href: "/customers",
    permission: Permissions.Customer.View,
  },
  {
    title: "Ürünler",
    icon: Package,
    items: [
      { title: "Ürün Listesi", href: "/products", permission: Permissions.Product.View },
      { title: "Kategoriler", href: "/products/categories", permission: Permissions.Category.View },
      { title: "Kategori Özellikleri", href: "/products/category-attributes", permission: Permissions.CategoryAttribute.View },
      { title: "Markalar", href: "/products/brands", permission: Permissions.Brand.View },
      { title: "Ek Hizmetler", href: "/products/extra-services", permission: Permissions.ExtraServices.View },
      { title: "Ürün Kuralları", href: "/products/rules", permission: Permissions.Product.View },
    ],
  },
  {
    title: "Envanter",
    icon: Warehouse,
    href: "/inventory",
    permission: Permissions.Inventory.View,
  },
  {
    title: "Kiralama",
    icon: ClipboardList,
    href: "/rentals",
    permission: Permissions.Rental.View,
  },
  {
    title: "Takvim",
    icon: Calendar,
    href: "/calendar",
    permission: Permissions.Calendar.View,
  },
  {
    title: "Operasyon",
    icon: Truck,
    items: [
      { title: "Depolar", href: "/operations/warehouses", permission: Permissions.Warehouse.View },
      { title: "Araçlar", href: "/operations/vehicles", permission: Permissions.Vehicle.View },
      { title: "Çalışanlar", href: "/operations/employees", permission: Permissions.Employee.View },
      { title: "Sertifikalar", href: "/operations/certificates", permission: Permissions.Certificates.View },
      { title: "Bakım Planları", href: "/operations/maintenance-schedules", permission: Permissions.MaintenanceSchedule.View },
      { title: "Bakım Kayıtları", href: "/operations/maintenance-records", permission: Permissions.MaintenanceRecord.View },
    ],
  },
]

const adminNavigation: NavItem[] = [
  {
    title: "Ayarlar",
    icon: Settings,
    items: [
      { title: "Firma Bilgileri", href: "/settings/company", permission: Permissions.Settings.View },
      { title: "Kullanıcılar", href: "/settings/users", permission: Permissions.User.View },
      { title: "Roller", href: "/settings/roles", permission: Permissions.Role.View },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const userPermissions = usePermissions()

  const isActive = (href: string, exact: boolean = false) => {
    if (href === "/") {
      return location.pathname === "/"
    }
    if (exact) {
      return location.pathname === href
    }
    // For parent items, check if any child is active
    return location.pathname === href || location.pathname.startsWith(href + "/")
  }

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    return userPermissions.includes(permission)
  }

  // Filter navigation items based on permissions
  const filteredNavigation = useMemo(() => {
    return navigation
      .map((item) => {
        if (item.items) {
          const filteredItems = item.items.filter((subItem) =>
            hasPermission(subItem.permission)
          )
          if (filteredItems.length === 0) return null
          return { ...item, items: filteredItems }
        }
        if (!hasPermission(item.permission)) return null
        return item
      })
      .filter((item): item is NavItem => item !== null)
  }, [userPermissions])

  const filteredAdminNavigation = useMemo(() => {
    return adminNavigation
      .map((item) => {
        if (item.items) {
          const filteredItems = item.items.filter((subItem) =>
            hasPermission(subItem.permission)
          )
          if (filteredItems.length === 0) return null
          return { ...item, items: filteredItems }
        }
        if (!hasPermission(item.permission)) return null
        return item
      })
      .filter((item): item is NavItem => item !== null)
  }, [userPermissions])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Package className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">PRMS</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Kiralama Yönetimi
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) =>
                item.items ? (
                  <Collapsible key={item.title} asChild defaultOpen>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(subItem.href, true)}
                              >
                                <Link to={subItem.href}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : item.href ? (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive(item.href)}
                    >
                      <Link to={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminNavigation.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminNavigation.map((item) => (
                <Collapsible key={item.title} asChild defaultOpen>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(subItem.href, true)}
                            >
                              <Link to={subItem.href}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" className="text-muted-foreground">
                <UserCog className="size-4" />
                <span>Hesap Ayarları</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
