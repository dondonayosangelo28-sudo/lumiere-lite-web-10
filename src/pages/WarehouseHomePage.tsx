import { useState } from 'react'
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
