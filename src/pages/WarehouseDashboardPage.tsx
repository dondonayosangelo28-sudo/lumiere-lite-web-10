import { useState } from 'react'
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck } from 'lucide-react'
import { useNav } from '@/lib/nav'
import { usePortal } from '@/lib/store'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'

const metrics = [
  { label: 'Total Assets', value: '24', subtitle: 'Registered inventory', icon: Boxes },
  { label: 'Available Assets', value: '14', subtitle: 'Ready for allocation', icon: PackageCheck },
  { label: 'Critical Deficits', value: '11', subtitle: 'Requires attention', icon: AlertTriangle, critical: true },
  { label: 'Pending Procurement', value: '7', subtitle: 'Open replenishment items', icon: CircleDollarSign },
]

export function WarehouseDashboardPage() {
  const { events } = usePortal()
  const { navigate } = useNav()
  const [summaryEvent, setSummaryEvent] = useState<PortalEvent | null>(null)
  const [detailEvent, setDetailEvent] = useState<PortalEvent | null>(null)

  if (detailEvent) {
    return <WarehouseEventDetailPage event={detailEvent} onBack={() => setDetailEvent(null)} onOpenModule={() => setDetailEvent(null)} />
  }

  const selectModule = (id: WarehouseModuleId) => {
    const routes = { assets: 'assets', replenishment: 'replenishment', vendors: 'overview', dispatch: 'dispatch' } as const
    navigate(routes[id])
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <WarehouseRail activeModuleId="assets" onSelectModule={selectModule} onExit={() => navigate('warehouse-dashboard')} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-7 px-6 py-7 sm:px-10 sm:py-8">
          <header className="border-b border-border pb-5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-primary">Warehouse module</p>
            <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">Warehouse Dashboard</h1>
          </header>

          <section aria-labelledby="kpi-heading">
            <h2 id="kpi-heading" className="sr-only">Warehouse dashboard summary</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, subtitle, icon: Icon, critical }) => (
                <article key={label} className={`rounded-xl border p-5 ${critical ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                    <Icon className={`size-4 ${critical ? 'text-destructive' : 'text-primary'}`} aria-hidden="true" />
                  </div>
                  <p className={`mt-4 font-serif text-4xl font-medium ${critical ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                </article>
              ))}
            </div>
          </section>

          <WarehouseCalendarEventsView events={events} onSelectEvent={setSummaryEvent} />
        </div>
      </main>

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
