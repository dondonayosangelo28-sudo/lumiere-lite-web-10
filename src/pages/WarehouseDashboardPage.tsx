import { useState } from 'react'
import { usePortal } from '@/lib/store'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import type { PortalEvent } from '@/lib/types'

export function WarehouseDashboardPage() {
  const { events } = usePortal()
  const [summaryEvent, setSummaryEvent] = useState<PortalEvent | null>(null)
  const [detailEvent, setDetailEvent] = useState<PortalEvent | null>(null)

  if (detailEvent) {
    return (
      <WarehouseEventDetailPage
        event={detailEvent}
        onBack={() => setDetailEvent(null)}
        onOpenModule={() => setDetailEvent(null)}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
        <header className="border-b border-border pb-5">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-primary">WOM account</p>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight">Warehouse Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Warehouse schedule and upcoming event operations at a glance.</p>
        </header>

        <WarehouseCalendarEventsView
          events={events}
          onSelectEvent={(event) => setSummaryEvent(event)}
        />
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
    </main>
  )
}

export default WarehouseDashboardPage
