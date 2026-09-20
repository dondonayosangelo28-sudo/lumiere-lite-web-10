import './App.css'
import { useEffect, useState } from 'react'
import type { Route } from '@/lib/types'
import { NavProvider, useNav } from '@/lib/nav'
import { PortalProvider } from '@/lib/store'
import { AuthProvider, useAuth } from '@/lib/auth'
import { LogoutModal } from '@/components/LogoutModal'
import { OfflineBanner } from '@/components/OfflineBanner'
import { loadRosterFromDatabase } from '@/lib/roster'
import { LoginPage } from '@/pages/LoginPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { AdminSystemDashboardPage } from '@/pages/AdminSystemDashboardPage'
import { AdminWorkforcePage } from '@/pages/AdminWorkforcePage'
import { AdminSecurityAuditPage } from '@/pages/AdminSecurityAuditPage'
import { AdminRolesPage } from '@/pages/AdminRolesPage'
import { WarehouseDashboardPage } from '@/pages/WarehouseDashboardPage'
import { EventDashboardPage } from '@/pages/EventDashboardPage'
import { EventRegistryPage } from '@/pages/EventRegistryPage'
import { ReplenishmentPage } from '@/pages/ReplenishmentPage'
import { ActivityLogsPage } from '@/pages/ActivityLogsPage'
import { InventoryStockPage } from '@/pages/InventoryStockPage'
import { WarehouseLogsPage } from '@/pages/WarehouseLogsPage'
import { CrewRosterPage } from '@/pages/CrewRosterPage'
import { TaskDeploymentsPage } from '@/pages/TaskDeploymentsPage'
import { DispatchManifestPage } from '@/pages/DispatchManifestPage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { DesignCanvasHubPage } from '@/pages/DesignCanvasHubPage'
import { CanvasWorkspacePage } from '@/pages/CanvasWorkspacePage'
import { AssetAllocationKioskPage } from '@/pages/AssetAllocationKioskPage'
import { TempPasswordResetScreen } from '@/pages/TempPasswordResetScreen'
import { PlannerProvider } from '@/lib/planner'
import { WarehouseProvider } from '@/lib/warehouse'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

function PortalAccessError({ portal }: { portal: 'web' | 'pwa' }) {
  const { logout } = useAuth()
  const isPwa = portal === 'pwa'
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <section className="paper-card w-full max-w-md text-center">
        <p className="eyebrow">Access boundary</p>
        <h1 className="mt-2 font-serif text-3xl">Wrong portal</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This account is registered for the {isPwa ? 'Lumière PWA' : 'Lumière web app'}. The {isPwa ? 'web app' : 'PWA'} cannot be opened with this account.
        </p>
        <button type="button" className="button-primary mt-6 w-full" onClick={logout}>Return to login</button>
      </section>
    </main>
  )
}

function Router() {
  const { route } = useNav()
  const { portal, isWarehouse, isAdmin } = useAuth()
  const pwaRoutes = new Set<string>()
  const isPwaRoute = pwaRoutes.has(route)
  if (portal && ((portal === 'pwa') !== isPwaRoute)) return <PortalAccessError portal={portal} />

  switch (route) {
    case 'dashboard':
      return <EventDashboardPage />
    case 'registry':
      return <EventRegistryPage />
    case 'replenishment':
      return <ReplenishmentPage />
    case 'logs':
      return <ActivityLogsPage />
    case 'inventory':
      return <InventoryStockPage />
    case 'warehouse-logs':
      return <WarehouseLogsPage />
    case 'crew':
      return <CrewRosterPage />
    case 'deployments':
      return <TaskDeploymentsPage />
    case 'dispatch':
      return <DispatchManifestPage />
    case 'event-detail':
      return <EventDetailPage />
    case 'canvas':
      return <DesignCanvasHubPage />
    case 'canvas-workspace':
      return <CanvasWorkspacePage />
    case 'assets':
      return <AssetAllocationKioskPage />
    case 'warehouse-dashboard':
      return <WarehouseDashboardPage />
    case 'workforce':
      return <AdminWorkforcePage />
    case 'security-audit':
      return <AdminSecurityAuditPage />
    case 'rbac':
      return <AdminRolesPage />
    case 'overview':
    default:
      // Role-aware home. Admins always land on the icon-rail System Dashboard —
      // never the legacy sidebar shell — even for unknown routes.
      return isAdmin ? (
        <AdminSystemDashboardPage />
      ) : isWarehouse ? (
      <WarehouseDashboardPage />

      ) : (
        <OverviewPage />
      )
  }
}

function Gate() {
  const { isAuthenticated, isTempPassword, isWarehouse, isPlanner, isExecutive } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (isTempPassword) {
    return <TempPasswordResetScreen />
  }

  // A deep-linked ?highlight=<staffId> (from the User Growth Summary modal)
  // should land straight on Workforce Management on a fresh load/refresh —
  // scoped to this one param, not a general URL-routing migration.
  const hasWorkforceHighlight =
    new URLSearchParams(window.location.search).has('highlight') || Boolean(window.history.state?.highlight)
  const urlParamRoute = (new URLSearchParams(window.location.search).get('route') || window.location.pathname.replace('/', '')) as Route | null
  const validRoutes = new Set(['dashboard', 'registry', 'replenishment', 'logs', 'inventory', 'warehouse-logs', 'crew', 'deployments', 'dispatch', 'event-detail', 'canvas', 'canvas-workspace', 'workforce', 'security-audit', 'rbac', 'overview', 'assets', 'warehouse-dashboard'])
  const targetUrlRoute = urlParamRoute && validRoutes.has(urlParamRoute) ? urlParamRoute : null

  const initialRoute = targetUrlRoute || (isPlanner
            ? 'canvas'
    : isWarehouse
      ? 'warehouse-dashboard'

              : hasWorkforceHighlight
                ? 'workforce'
                : isExecutive
                  ? 'dashboard'
                  : 'overview')

  return (
  <NavProvider initialRoute={initialRoute} initialExecutiveRailOpen={!isExecutive}>
  <AppErrorBoundary>
  <Router />
  </AppErrorBoundary>
  </NavProvider>
  )
}
function AppContent() {
  return (
    <PortalProvider>
      <PlannerProvider>
        <WarehouseProvider>
          <OfflineBanner />
          <Gate />
          <LogoutModal />
        </WarehouseProvider>
      </PlannerProvider>
    </PortalProvider>
  )
}

function AppWithAuth() {
  useEffect(() => {
    // Load the crew roster from the database on app initialization
    loadRosterFromDatabase()
  }, [])

  return <AppContent />
}

function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  )
}

export default App
