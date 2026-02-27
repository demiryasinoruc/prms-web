import { createBrowserRouter, Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"
import { lazy, Suspense, type ReactNode } from "react"
import { useRefreshProfile } from "@/hooks/use-refresh-profile"

const MainLayout = lazy(() => import("@/components/layout/main-layout"))
const AuthLayout = lazy(() => import("@/components/layout/auth-layout"))

const LoginPage = lazy(() => import("@/features/auth/login"))
const DashboardPage = lazy(() => import("@/features/dashboard"))
const ProductsPage = lazy(() => import("@/features/products"))
const CustomersPage = lazy(() => import("@/features/customers"))
const VehiclesPage = lazy(() => import("@/features/vehicles"))
const EmployeesPage = lazy(() => import("@/features/employees"))
const WarehousesPage = lazy(() => import("@/features/warehouses"))
const RentalsPage = lazy(() => import("@/features/rentals"))
const InventoryPage = lazy(() => import("@/features/inventory"))
const BrandsPage = lazy(() => import("@/features/brands"))
const CategoriesPage = lazy(() => import("@/features/categories"))
const CategoryAttributesPage = lazy(() => import("@/features/category-attributes"))
const ProductRulesPage = lazy(() => import("@/features/product-rules"))
const ExtraServicesPage = lazy(() => import("@/features/extra-services"))
const CertificatesPage = lazy(() => import("@/features/certificates"))
const RolesPage = lazy(() => import("@/features/roles"))
const UsersPage = lazy(() => import("@/features/users"))
const CompanySettingsPage = lazy(() => import("@/features/company"))
const CalendarPage = lazy(() => import("@/features/calendar"))
const MaintenanceSchedulesPage = lazy(() => import("@/features/maintenance-schedules"))
const MaintenanceRecordsPage = lazy(() => import("@/features/maintenance-records"))
const ProfilePage = lazy(() => import("@/features/profile"))

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { isLoading } = useRefreshProfile()

  // Show loading while refreshing profile
  if (isLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: "/login",
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
    path: "/",
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
        path: "calendar",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CalendarPage />
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
        path: "brands",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BrandsPage />
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
        path: "settings/profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
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
      { path: "products/brands", element: <Navigate to="/brands" replace /> },
      { path: "products/categories", element: <Navigate to="/categories" replace /> },
      { path: "products/category-attributes", element: <Navigate to="/categories" replace /> },
      { path: "products/extra-services", element: <Navigate to="/extra-services" replace /> },
      { path: "products/rules", element: <Navigate to="/product-rules" replace /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])
