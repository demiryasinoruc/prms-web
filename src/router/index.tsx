import { createBrowserRouter, Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"
import { lazy, Suspense, type ReactNode } from "react"
import { useRefreshProfile } from "@/hooks/use-refresh-profile"
import { RouteError } from "@/components/shared/route-error"

const MainLayout = lazy(() => import("@/components/layout/main-layout"))
const AdminLayout = lazy(() => import("@/components/layout/admin-layout"))
const AuthLayout = lazy(() => import("@/components/layout/auth-layout"))

const LoginPage = lazy(() => import("@/features/auth/login"))
const RegisterPage = lazy(() => import("@/features/auth/register"))
const CreateCompanyPage = lazy(() => import("@/features/auth/create-company"))
const ForgotPasswordPage = lazy(() => import("@/features/auth/forgot-password"))
const ResetPasswordPage = lazy(() => import("@/features/auth/reset-password"))
const NotFoundPage = lazy(() => import("@/features/not-found"))
const DashboardPage = lazy(() => import("@/features/dashboard"))
const ProductsPage = lazy(() => import("@/features/products"))
const CustomersPage = lazy(() => import("@/features/customers"))
const VehiclesPage = lazy(() => import("@/features/vehicles"))
const EmployeesPage = lazy(() => import("@/features/employees"))
const EmployeeLeavesPage = lazy(() => import("@/features/employee-leaves"))
const WarehousesPage = lazy(() => import("@/features/warehouses"))
const RentalsPage = lazy(() => import("@/features/rentals"))
const ShipmentsPage = lazy(() => import("@/features/shipments"))
const InventoryPage = lazy(() => import("@/features/inventory"))
const WarehouseTransfersPage = lazy(() => import("@/features/warehouse-transfers"))
const CategoriesPage = lazy(() => import("@/features/categories"))
const CategoryAttributesPage = lazy(() => import("@/features/category-attributes"))
const ProductRulesPage = lazy(() => import("@/features/product-rules"))
const ExtraServicesPage = lazy(() => import("@/features/extra-services"))
const CertificatesPage = lazy(() => import("@/features/certificates"))
const RolesPage = lazy(() => import("@/features/roles"))
const UsersPage = lazy(() => import("@/features/users"))
const CompanySettingsPage = lazy(() => import("@/features/company"))
const UsagePage = lazy(() => import("@/features/usage"))
const SubscriptionPage = lazy(() => import("@/features/subscription"))
const SubscriptionUpgradePage = lazy(() => import("@/features/subscription/upgrade"))
const CalendarPage = lazy(() => import("@/features/calendar"))
const MaintenanceSchedulesPage = lazy(() => import("@/features/maintenance-schedules"))
const MaintenanceRecordsPage = lazy(() => import("@/features/maintenance-records"))
const InvitationsPage = lazy(() => import("@/features/invitations"))
const ProfilePage = lazy(() => import("@/features/profile"))
const NotificationsPage = lazy(() => import("@/features/notifications"))
const AdminPlansPage = lazy(() => import("@/features/admin-plans"))
const AdminCompaniesPage = lazy(() => import("@/features/admin-companies"))

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSystemAdmin = useAuthStore((state) => state.isSystemAdmin())
  const impersonatedCompany = useAuthStore((state) => state.impersonatedCompany)
  const { isLoading } = useRefreshProfile()

  // Show loading while refreshing profile
  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Sistem admin normalde firma akışına giremez — admin paneline yönlenir.
  // İSTİSNA: impersonation modunda ("Olarak Gör"), seçili firmanın akışına izin verilir.
  if (isSystemAdmin && !impersonatedCompany) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}

function SystemAdminRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSystemAdmin = useAuthStore((state) => state.isSystemAdmin())
  const { isLoading } = useRefreshProfile()

  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Firma kullanıcısı admin paneline giremez, ana akışa yönlenir
  if (!isSystemAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSystemAdmin = useAuthStore((state) => state.isSystemAdmin())

  if (isAuthenticated) {
    return <Navigate to={isSystemAdmin ? "/admin" : "/"} replace />
  }

  return <>{children}</>
}

/**
 * Self-serve kayıt funnel'ının ara adımı: giriş yapılmış ama henüz firma yok.
 * Firması olan kullanıcı buraya gelirse ana akışa yönlenir.
 */
function CompanySetupRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSystemAdmin = useAuthStore((state) => state.isSystemAdmin())
  const company = useAuthStore((state) => state.company)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (isSystemAdmin) {
    return <Navigate to="/admin" replace />
  }
  if (company?.id) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: "/login",
    errorElement: <RouteError />,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    errorElement: <RouteError />,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/create-company",
    errorElement: <RouteError />,
    element: (
      <CompanySetupRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthLayout>
            <CreateCompanyPage />
          </AuthLayout>
        </Suspense>
      </CompanySetupRoute>
    ),
  },
  {
    path: "/forgot-password",
    errorElement: <RouteError />,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/reset-password",
    errorElement: <RouteError />,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <AuthLayout>
            <ResetPasswordPage />
          </AuthLayout>
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/",
    errorElement: <RouteError />,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <MainLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      // === ANA İŞLEMLER ===
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "rentals",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RentalsPage />
          </Suspense>
        ),
      },
      {
        path: "shipments",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ShipmentsPage />
          </Suspense>
        ),
      },
      {
        path: "calendar",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CalendarPage />
          </Suspense>
        ),
      },
      {
        path: "notifications",
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: "customers",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustomersPage />
          </Suspense>
        ),
      },

      // === ÜRÜN & STOK ===
      {
        path: "products",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductsPage />
          </Suspense>
        ),
      },
      {
        path: "inventory",
        element: (
          <Suspense fallback={<PageLoader />}>
            <InventoryPage />
          </Suspense>
        ),
      },
      {
        path: "warehouse-transfers",
        element: (
          <Suspense fallback={<PageLoader />}>
            <WarehouseTransfersPage />
          </Suspense>
        ),
      },
      {
        path: "maintenance-schedules",
        element: (
          <Suspense fallback={<PageLoader />}>
            <MaintenanceSchedulesPage />
          </Suspense>
        ),
      },
      {
        path: "maintenance-records",
        element: (
          <Suspense fallback={<PageLoader />}>
            <MaintenanceRecordsPage />
          </Suspense>
        ),
      },

      // === KAYNAKLAR ===
      {
        path: "warehouses",
        element: (
          <Suspense fallback={<PageLoader />}>
            <WarehousesPage />
          </Suspense>
        ),
      },
      {
        path: "vehicles",
        element: (
          <Suspense fallback={<PageLoader />}>
            <VehiclesPage />
          </Suspense>
        ),
      },
      {
        path: "employees",
        element: (
          <Suspense fallback={<PageLoader />}>
            <EmployeesPage />
          </Suspense>
        ),
      },
      {
        path: "employee-leaves",
        element: (
          <Suspense fallback={<PageLoader />}>
            <EmployeeLeavesPage />
          </Suspense>
        ),
      },
      {
        path: "certificates",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CertificatesPage />
          </Suspense>
        ),
      },

      // === TANIMLAR ===
      {
        path: "categories",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CategoriesPage />
          </Suspense>
        ),
      },
      {
        path: "category-attributes",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CategoryAttributesPage />
          </Suspense>
        ),
      },
      {
        path: "extra-services",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExtraServicesPage />
          </Suspense>
        ),
      },
      {
        path: "product-rules",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductRulesPage />
          </Suspense>
        ),
      },

      // === AYARLAR ===
      {
        path: "settings/company",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CompanySettingsPage />
          </Suspense>
        ),
      },
      {
        path: "settings/users",
        element: (
          <Suspense fallback={<PageLoader />}>
            <UsersPage />
          </Suspense>
        ),
      },
      {
        path: "settings/roles",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RolesPage />
          </Suspense>
        ),
      },
      {
        path: "settings/invitations",
        element: (
          <Suspense fallback={<PageLoader />}>
            <InvitationsPage />
          </Suspense>
        ),
      },
      {
        path: "settings/profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "settings/usage",
        element: (
          <Suspense fallback={<PageLoader />}>
            <UsagePage />
          </Suspense>
        ),
      },
      {
        path: "settings/subscription",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SubscriptionPage />
          </Suspense>
        ),
      },
      {
        path: "settings/subscription/upgrade",
        element: (
          <Suspense fallback={<PageLoader />}>
            <SubscriptionUpgradePage />
          </Suspense>
        ),
      },

      // === GERİYE UYUMLULUK (eski URL'ler) ===
      { path: "operations/vehicles", element: <Navigate to="/vehicles" replace /> },
      { path: "operations/warehouses", element: <Navigate to="/warehouses" replace /> },
      { path: "operations/employees", element: <Navigate to="/employees" replace /> },
      { path: "operations/certificates", element: <Navigate to="/certificates" replace /> },
      { path: "operations/maintenance-schedules", element: <Navigate to="/maintenance-schedules" replace /> },
      { path: "operations/maintenance-records", element: <Navigate to="/maintenance-records" replace /> },
      { path: "products/categories", element: <Navigate to="/categories" replace /> },
      { path: "products/category-attributes", element: <Navigate to="/categories" replace /> },
      { path: "products/extra-services", element: <Navigate to="/extra-services" replace /> },
      { path: "products/rules", element: <Navigate to="/product-rules" replace /> },
    ],
  },
  {
    path: "/admin",
    errorElement: <RouteError />,
    element: (
      <SystemAdminRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminLayout />
        </Suspense>
      </SystemAdminRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/plans" replace />,
      },
      {
        path: "plans",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPlansPage />
          </Suspense>
        ),
      },
      {
        path: "companies",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminCompaniesPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])
