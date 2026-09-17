import { useState } from 'react'
import { Bell, UserRound } from 'lucide-react'
import { usePortal } from '@/lib/store'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { ModuleEntryRow } from '@/components/warehouse/ModuleEntryRow'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseDrilldown, type DrilldownEntry } from '@/components/warehouse/WarehouseDrilldown'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ErrorFallback } from '@/components/ErrorFallback'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import type { PortalEvent } from '@/lib/types'

export function WarehouseHomePage() {
  const { events } = usePortal()
  const [searchQuery, setSearchQuery] = useState('')
  const [drilldown, setDrilldown] = useState<DrilldownEntry | null>(null)
  const [summaryEvent, setSummaryEvent] = useState<PortalEvent | null>(null)
  const [isLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const openModule = (id: WarehouseModuleId) => setDrilldown({ kind: 'module', moduleId: id })
  const openEvent = (id: string) => {
    const event = events.find((item) => item.id === id)
    if (event) setDrilldown({ kind: 'event', event })
  }

  if (drilldown?.kind === 'event') {
    return (
      <WarehouseEventDetailPage
        event={drilldown.event}
        onBack={() => setDrilldown(null)}
        onOpenModule={openModule}
      />
    )
  }

  if (drilldown?.kind === 'module') {
    return <WarehouseDrilldown entry={drilldown} onExit={() => setDrilldown(null)} />
  }

  if (isError) {
    return <ErrorFallback title="Warehouse Portal Unavailable" message="Could not load warehouse schedule & inventory records." onRetry={() => setIsError(false)} />
  }

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[68px] items-center justify-between border-y border-border/70 bg-card px-6 sm:px-10">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Friday, September 18, 2026 <span className="mx-2 text-border">|</span> 7:20 AM
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Bell className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Account"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          >
            <UserRound className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="mx-auto flex max-w-[90rem] w-full flex-col gap-8 sm:gap-10 px-6 py-8 sm:px-10 sm:py-12">
        {/* Header section — untouched */}
        <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* 4-per-row Restructured Module Grid */}
        <ModuleEntryRow onOpenModule={openModule} />

        {/* Month Calendar + Upcoming Events Side Panel */}
        <WarehouseCalendarEventsView
          events={events}
          onSelectEvent={(evt) => setSummaryEvent(evt)}
        />
      </div>

      {/* WOM Input Summary Modal */}
      {summaryEvent && (
        <WomInputSummaryModal
          event={summaryEvent}
          onClose={() => setSummaryEvent(null)}
          onOpenFullDetail={(id) => openEvent(id)}
        />
      )}
    </div>
  )
}

export default WarehouseHomePage
