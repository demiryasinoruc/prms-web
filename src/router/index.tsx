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
const ExtraServicesPage = lazy(() => import("@/features/extra-services"))
const CertificatesPage = lazy(() => import("@/features/certificates"))
const RolesPage = lazy(() => import("@/features/roles"))
const UsersPage = lazy(() => import("@/features/users"))
const CompanySettingsPage = lazy(() => import("@/features/company"))
const CalendarPage = lazy(() => import("@/features/calendar"))
const MaintenanceSchedulesPage = lazy(() => import("@/features/maintenance-schedules"))
const MaintenanceRecordsPage = lazy(() => import("@/features/maintenance-records"))

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
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "products",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductsPage />
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
      {
        path: "rentals",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RentalsPage />
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
        path: "calendar",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CalendarPage />
          </Suspense>
        ),
      },
      {
        path: "operations/vehicles",
        element: (
          <Suspense fallback={<PageLoader />}>
            <VehiclesPage />
          </Suspense>
        ),
      },
      {
        path: "operations/warehouses",
        element: (
          <Suspense fallback={<PageLoader />}>
            <WarehousesPage />
          </Suspense>
        ),
      },
      {
        path: "operations/employees",
        element: (
          <Suspense fallback={<PageLoader />}>
            <EmployeesPage />
          </Suspense>
        ),
      },
      {
        path: "operations/certificates",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CertificatesPage />
          </Suspense>
        ),
      },
      {
        path: "operations/maintenance-schedules",
        element: (
          <Suspense fallback={<PageLoader />}>
            <MaintenanceSchedulesPage />
          </Suspense>
        ),
      },
      {
        path: "operations/maintenance-records",
        element: (
          <Suspense fallback={<PageLoader />}>
            <MaintenanceRecordsPage />
          </Suspense>
        ),
      },
      {
        path: "products/brands",
        element: (
          <Suspense fallback={<PageLoader />}>
            <BrandsPage />
          </Suspense>
        ),
      },
      {
        path: "products/categories",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CategoriesPage />
          </Suspense>
        ),
      },
      {
        path: "products/category-attributes",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CategoryAttributesPage />
          </Suspense>
        ),
      },
      {
        path: "products/extra-services",
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExtraServicesPage />
          </Suspense>
        ),
      },
      {
        path: "settings/company",
        element: (
          <Suspense fallback={<PageLoader />}>
            <CompanySettingsPage />
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
        path: "settings/users",
        element: (
          <Suspense fallback={<PageLoader />}>
            <UsersPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
])
