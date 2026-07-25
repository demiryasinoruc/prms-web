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
  Building2,
  Car,
  Award,
  List,
  FolderTree,
  Tag,
  PlusCircle,
  GitBranch,
  Building,
  UsersRound,
  Shield,
  Boxes,
  Wrench,
  ClipboardCheck,
  Receipt,
  SquareStack,
  MailPlus,
  Gauge,
  Sparkles,
  Loader2,
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
import { useNavigation } from "@/features/navigation/hooks"
import { useAuthStore } from "@/stores/auth"
import type { FeatureKey } from "@/lib/entitlements"

// Route → gerektirdiği plan özelliği. Özellik kapalıysa nav öğesi gizlenir.
const ROUTE_FEATURE: Record<string, FeatureKey> = {
  "/maintenance-records": "Maintenance",
  "/maintenance-schedules": "Maintenance",
  "/calendar": "Calendar",
  "/product-rules": "ProductRules",
  "/category-attributes": "CategoryAttributes",
  "/extra-services": "ExtraServices",
  "/certificates": "Certificates",
  "/notifications": "Notifications",
}

// Icon mapping - backend'den gelen icon isimlerini Lucide componentlerine eşle
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  Warehouse,
  Truck,
  UserCog,
  Calendar,
  Settings,
  Building2,
  Car,
  Award,
  List,
  FolderTree,
  Tag,
  PlusCircle,
  GitBranch,
  Building,
  UsersRound,
  Shield,
  Boxes,
  Wrench,
  ClipboardCheck,
  Receipt,
  SquareStack,
  MailPlus,
  Gauge,
  Sparkles,
}

// Fallback icon
const DefaultIcon = Package

export function AppSidebar() {
  const location = useLocation()
  const { data: navigation, isLoading } = useNavigation()
  // Plan özelliği kapalı olan nav öğelerini gizle (re-render için features'a abone ol)
  const features = useAuthStore((s) => s.features)
  const isImpersonating = useAuthStore(
    (s) => s.isSystemAdmin() && !!s.impersonatedCompany,
  )
  const featureVisible = (to: string): boolean => {
    const required = ROUTE_FEATURE[to]
    if (!required) return true
    if (isImpersonating) return true
    return features.includes(required)
  }

  const isActive = (href: string, exact: boolean = false) => {
    if (href === "/") {
      return location.pathname === "/"
    }
    if (exact) {
      return location.pathname === href
    }
    return location.pathname === href || location.pathname.startsWith(href + "/")
  }

  const getIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || DefaultIcon
  }

  // Plan özelliğine göre nav öğelerini ele: alt menüsü olanlarda kapalı alt öğeleri
  // çıkar, hiç alt öğe kalmazsa üst öğeyi de gizle; tekil öğeyi doğrudan ele.
  const visibleNavigation = (navigation || [])
    .map((item) => {
      if (item.sub && item.sub.length > 0) {
        const sub = item.sub.filter((s) => featureVisible(s.to))
        return sub.length > 0 ? { ...item, sub } : null
      }
      return featureVisible(item.to) ? item : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  // Yönetim menüsü (Ayarlar) ayrı gösterilecek
  const mainNavigation = visibleNavigation.filter(item => item.name !== "Ayarlar")
  const adminNavigation = visibleNavigation.filter(item => item.name === "Ayarlar")

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
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SidebarMenu>
                {mainNavigation.map((item) => {
                  const Icon = getIcon(item.icon)

                  // Alt menüsü olan item
                  if (item.sub && item.sub.length > 0) {
                    return (
                      <Collapsible key={item.name} asChild defaultOpen>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.name}>
                              <Icon className="size-4" />
                              <span>{item.name}</span>
                              <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.sub.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.to}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive(subItem.to, true)}
                                  >
                                    <Link to={subItem.to}>{subItem.name}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  // Tekil item (alt menüsü yok)
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.name}
                        isActive={isActive(item.to)}
                      >
                        <Link to={item.to}>
                          <Icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNavigation.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => {
                  const Icon = getIcon(item.icon)

                  if (item.sub && item.sub.length > 0) {
                    return (
                      <Collapsible key={item.name} asChild defaultOpen>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.name}>
                              <Icon className="size-4" />
                              <span>{item.name}</span>
                              <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.sub.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.to}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive(subItem.to, true)}
                                  >
                                    <Link to={subItem.to}>{subItem.name}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.name}
                        isActive={isActive(item.to)}
                      >
                        <Link to={item.to}>
                          <Icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings/profile" className="text-muted-foreground">
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
