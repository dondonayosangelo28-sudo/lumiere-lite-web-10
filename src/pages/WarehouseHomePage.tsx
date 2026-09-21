import { useState } from 'react'
import { usePortal } from '@/lib/store'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { WarehouseMobileMenu } from '@/components/warehouse/WarehouseMobileMenu'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { WarehouseKpiRow } from '@/components/warehouse/WarehouseKpiRow'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseDrilldown, type DrilldownEntry } from '@/components/warehouse/WarehouseDrilldown'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ErrorFallback } from '@/components/ErrorFallback'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import type { PortalEvent } from '@/lib/types'
import { WarehouseNavContext } from '@/lib/warehouse-nav'

export function WarehouseHomePage() {
  const { events } = usePortal()
  const [searchQuery, setSearchQuery] = useState('')
  const [drilldown, setDrilldown] = useState<DrilldownEntry | null>(null)
  const [summaryEvent, setSummaryEvent] = useState<PortalEvent | null>(null)
  const [isLoading] = useState<boolean>(false)
  const [isError, setIsError] = useState(false)

  const openModule = (id: WarehouseModuleId) => setDrilldown({ kind: 'module', moduleId: id })
  const activeModuleId = drilldown?.kind === 'module' ? drilldown.moduleId : 'dashboard'
  const selectModule = (id: WarehouseModuleId) => id === 'dashboard' ? setDrilldown(null) : openModule(id)
  const openEvent = (id: string) => {
    const event = events.find((item) => item.id === id)
    if (event) setDrilldown({ kind: 'event', event })
  }

  if (drilldown?.kind === 'event') {
    return (
      <WarehouseNavContext.Provider value={{ activeModuleId, selectModule }}>
        <WarehouseEventDetailPage
          event={drilldown.event}
          onBack={() => setDrilldown(null)}
          onOpenModule={openModule}
        />
      </WarehouseNavContext.Provider>
    )
  }

  if (drilldown?.kind === 'module') {
    return (
      <WarehouseNavContext.Provider value={{ activeModuleId, selectModule }}>
        <WarehouseDrilldown entry={drilldown} onExit={() => setDrilldown(null)} />
      </WarehouseNavContext.Provider>
    )
  }

  if (isError) {
    return (
      <WarehouseNavContext.Provider value={{ activeModuleId, selectModule }}>
        <ErrorFallback title="Warehouse Portal Unavailable" message="Could not load warehouse schedule & inventory records." onRetry={() => setIsError(false)} />
      </WarehouseNavContext.Provider>
    )
  }

  if (isLoading) {
    return (
      <WarehouseNavContext.Provider value={{ activeModuleId, selectModule }}>
        <LoadingSkeleton variant="dashboard" />
      </WarehouseNavContext.Provider>
    )
  }

  return (
    <WarehouseNavContext.Provider value={{ activeModuleId, selectModule }}>
      <div className="flex min-h-screen bg-background text-foreground max-md:static max-md:inset-auto max-md:h-auto max-md:min-h-[100dvh] max-md:overflow-visible">
      <WarehouseRail activeModuleId="dashboard" onSelectModule={openModule} onExit={() => setDrilldown(null)} />
      <main className="min-w-0 flex-1">
        <WarehouseHeader topBarOnly mobileLeading={<WarehouseMobileMenu />} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-6 px-5 py-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:gap-7 sm:px-10 sm:py-7">
          <WarehouseHeader desktopOnly mobileLeading={<WarehouseMobileMenu />} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <WarehouseKpiRow events={events} onOpenModule={openModule} />
          <WarehouseCalendarEventsView events={events} onSelectEvent={(evt) => setSummaryEvent(evt)} />
        </div>
      </main>

        {/* Warehouse Input Summary Modal */}
        {summaryEvent && (
          <WomInputSummaryModal
            event={summaryEvent}
            onClose={() => setSummaryEvent(null)}
            onOpenFullDetail={(id) => openEvent(id)}
          />
        )}
      </div>
    </WarehouseNavContext.Provider>
  )
}

export default WarehouseHomePage
