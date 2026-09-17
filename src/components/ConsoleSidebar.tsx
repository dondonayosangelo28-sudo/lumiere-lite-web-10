import {
  LayoutGrid,
  Boxes,
  PackageSearch,
  Truck,
  LogOut,
  PenTool,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNav } from '@/lib/nav'
import { useAuth } from '@/lib/auth'
import { useDarkMode } from '@/lib/theme'
import type { Route } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'

type NavItem = {
  label: string
  blurb: string
  icon: typeof LayoutGrid
  route: Route
  moduleId?: WarehouseModuleId
}

const warehouseNavItems: NavItem[] = [
  { label: 'Dashboard', blurb: 'Operations metrics & activity dashboard', icon: LayoutGrid, route: 'overview' },
  { label: 'Asset Catalog', blurb: 'Browse venue décor and asset catalog', icon: Boxes, route: 'inventory', moduleId: 'assets' },
  { label: 'Replenishment & Deficits', blurb: 'Deficit tracking and reorder requisitions', icon: PackageSearch, route: 'replenishment', moduleId: 'replenishment' },
  { label: 'Vendor Management', blurb: 'Manage supplier records and purchasing partners', icon: Boxes, route: 'warehouse-logs', moduleId: 'vendors' },
  { label: 'Dispatch & Logistics', blurb: 'Fleet manifests and transit checkpoints', icon: Truck, route: 'dispatch', moduleId: 'dispatch' },
]

const plannerNavItems: NavItem[] = [
  { label: 'Design Canvas', blurb: 'Visual 2D/3D event layout canvas hub', icon: PenTool, route: 'canvas' },
  { label: 'Overview & Events', blurb: 'Event scheduling & project overview', icon: LayoutGrid, route: 'overview' },
  { label: 'Inventory Catalog', blurb: 'Browse venue décor and asset catalog', icon: Boxes, route: 'inventory' },
]

/* Sub-routes highlight their parent nav entry. */
const routeParent: Partial<Record<Route, Route>> = {
  'event-detail': 'canvas',
  'canvas-workspace': 'canvas',
}

export interface ConsoleSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function ConsoleSidebar({
  mobileOpen,
  onCloseMobile,
}: ConsoleSidebarProps) {
  const { route, navigate } = useNav()
  const { adminName, adminRole, isPlanner, setConfirmLogout } = useAuth()
  const { dark, toggle } = useDarkMode()
  const navItems = isPlanner ? plannerNavItems : warehouseNavItems

  const go = (r: Route) => {
    if (route !== r && routeParent[route] !== r) navigate(r)
  }

  return (
    <>
      {/* ── Desktop Fixed Icon Rail (w-16) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-4 lg:flex">
        {/* Brand Mark */}
        <span
          className="flex size-8 items-center justify-center font-serif text-lg font-medium leading-none text-sidebar-primary"
          aria-hidden="true"
        >
          L
        </span>

        {/* Icon Navigation Rail */}
        <nav className="flex flex-1 flex-col items-center gap-2" aria-label="Console destinations">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = route === item.route || routeParent[route] === item.route
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => go(item.route)}
                aria-label={item.label}
                aria-current={active ? 'true' : undefined}
                title={item.label}
                className={cn(
                  'flex size-10 items-center justify-center rounded-lg transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </button>
            )
          })}
        </nav>

        {/* Bottom Actions: Theme + Logout */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-sidebar-border w-full">
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {dark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            aria-label="Sign out"
            title="Sign out"
            className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 overflow-x-auto border-t border-sidebar-border bg-sidebar/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden"
        aria-label="Console destinations"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = route === item.route || routeParent[route] === item.route
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                go(item.route)
                onCloseMobile()
              }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-[4.75rem] flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[0.58rem] font-semibold leading-tight transition-colors',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── Mobile Drawer ── */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={onCloseMobile}
          className={cn(
            'absolute inset-0 bg-neutral-900/60 transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-sidebar-border">
            <h1 className="font-serif text-xl font-medium tracking-[0.3em] text-sidebar-primary">
              LUMIÈRE
            </h1>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = route === item.route || routeParent[route] === item.route
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    navigate(item.route)
                    onCloseMobile()
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] transition-colors',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-sidebar-accent-foreground">{adminName}</p>
              <p className="text-[0.6rem] uppercase tracking-wider text-sidebar-foreground/60">{adminRole}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
