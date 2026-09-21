import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Route } from '@/lib/types'

// A cross-page instruction: navigating from a dashboard "Open" button can
// carry an intent that the destination page consumes to auto-trigger an action
// (e.g. open a confirmation dialog or a detail modal).
export interface NavIntent {
  kind:
    | 'unlock-user'
    | 'view-event'
    | 'reorder-asset'
    | 'configure-subrole'
  payload?: any
}

interface NavContextValue {
  route: Route
  navigate: (route: Route, intent?: NavIntent | null) => void
  intent: NavIntent | null
  clearIntent: () => void
  executiveRailOpen: boolean
  toggleExecutiveRail: () => void
}

const NavContext = createContext<NavContextValue | null>(null)

export function NavProvider({
  children,
  initialRoute = 'overview',
  initialExecutiveRailOpen = true,
}: {
  children: ReactNode
  initialRoute?: Route
  initialExecutiveRailOpen?: boolean
}) {
  const [route, setRoute] = useState<Route>(initialRoute)
  const [intent, setIntent] = useState<NavIntent | null>(null)
  const [executiveRailOpen, setExecutiveRailOpen] = useState(initialExecutiveRailOpen)

  useEffect(() => {
    const handleLocationChange = () => {
      const param = new URLSearchParams(window.location.search).get('route')
      const path = window.location.pathname.replace('/', '')
      const r = (param || path) as Route
      const valid = ['dashboard', 'registry', 'replenishment', 'logs', 'inventory', 'assets', 'warehouse-logs', 'crew', 'deployments', 'dispatch', 'event-detail', 'canvas', 'canvas-workspace', 'workforce', 'security-audit', 'overview', 'warehouse-dashboard']
      if (r && valid.includes(r)) {
        setRoute(r)
      }
    }
    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('nav-change', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('nav-change', handleLocationChange)
    }
  }, [])

  const navigate = useCallback((next: Route, nextIntent: NavIntent | null = null) => {
    setIntent(nextIntent)
    setRoute(next)
  }, [])

  const clearIntent = useCallback(() => setIntent(null), [])
  const toggleExecutiveRail = useCallback(() => setExecutiveRailOpen((open) => !open), [])

  const value = useMemo(
    () => ({ route, navigate, intent, clearIntent, executiveRailOpen, toggleExecutiveRail }),
    [route, navigate, intent, clearIntent, executiveRailOpen, toggleExecutiveRail],
  )
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used within a NavProvider')
  return ctx
}
