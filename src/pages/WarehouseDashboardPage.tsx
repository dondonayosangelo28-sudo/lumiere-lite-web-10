import { useState } from 'react'
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck } from 'lucide-react'
import { useNav } from '@/lib/nav'
import { usePortal } from '@/lib/store'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import { cn } from '@/lib/utils'

const KPI_CARDS = [
  { label: 'Total Assets', value: '24', subtitle: 'Registered inventory', icon: Boxes, moduleId: 'assets' as WarehouseModuleId },
  { label: 'Available Assets', value: '14', subtitle: 'Ready for allocation', icon: PackageCheck, moduleId: 'assets' as WarehouseModuleId },
  { label: 'Critical Deficits', value: '11', subtitle: 'Requires attention', icon: AlertTriangle, moduleId: 'replenishment' as WarehouseModuleId, critical: true },
  { label: 'Pending Procurement', value: '7', subtitle: 'Open replenishment items', icon: CircleDollarSign, moduleId: 'replenishment' as WarehouseModuleId },
] as const

export function WarehouseDashboardPage() {
  const { events } = usePortal()
  const { navigate } = useNav()
  const [summaryEvent, setSummaryEvent] = useState<PortalEvent | null>(null)
  const [detailEvent, setDetailEvent] = useState<PortalEvent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  if (detailEvent) {
    return <WarehouseEventDetailPage event={detailEvent} onBack={() => setDetailEvent(null)} onOpenModule={() => setDetailEvent(null)} />
  }

  const selectModule = (id: WarehouseModuleId) => {
    const routes = { assets: 'assets', replenishment: 'replenishment', vendors: 'overview', dispatch: 'dispatch' } as const
    navigate(routes[id])
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background text-foreground">
      <WarehouseRail
        activeModuleId="assets"
        activeDashboard
        defaultOpen
        onSelectModule={selectModule}
        onDashboard={() => navigate('warehouse-dashboard')}
        onExit={() => navigate('overview')}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} searchInHeader />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-7 px-6 py-7 sm:px-10 sm:py-8">

          <section aria-labelledby="warehouse-kpi-heading">
            <h2 id="warehouse-kpi-heading" className="sr-only">Warehouse dashboard summary</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {KPI_CARDS.map(({ label, value, subtitle, icon: Icon, moduleId, critical }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => selectModule(moduleId)}
                  className={cn(
                    'group rounded-xl border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    critical && 'border-destructive/30 bg-destructive/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                    <Icon className={cn('size-4 text-primary transition-transform duration-200 group-hover:scale-110', critical && 'text-destructive')} aria-hidden="true" />
                  </div>
                  <p className={cn('mt-4 font-serif text-4xl font-medium text-foreground', critical && 'text-destructive')}>{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                </button>
              ))}
            </div>
          </section>

          <WarehouseCalendarEventsView events={events} onSelectEvent={setSummaryEvent} />
          </div>
        </main>
      </div>

      {summaryEvent && (
        <WomInputSummaryModal
          event={summaryEvent}
          onClose={() => setSummaryEvent(null)}
          onOpenFullDetail={(id) => {
            const event = events.find((item) => item.id === id)
            if (event) {
              setSummaryEvent(null)
              setDetailEvent(event)
            }
          }}
        />
      )}
    </div>
  )
}

export default WarehouseDashboardPage
