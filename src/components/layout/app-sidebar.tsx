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
}

// Fallback icon
const DefaultIcon = Package

export function AppSidebar() {
  const location = useLocation()
  const { data: navigation, isLoading } = useNavigation()

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

  // Yönetim menüsü (Ayarlar) ayrı gösterilecek
  const mainNavigation = navigation?.filter(item => item.name !== "Ayarlar") || []
  const adminNavigation = navigation?.filter(item => item.name === "Ayarlar") || []

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
