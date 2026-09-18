import { useState } from 'react'
import { useNav } from '@/lib/nav'
import { usePortal } from '@/lib/store'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'

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
