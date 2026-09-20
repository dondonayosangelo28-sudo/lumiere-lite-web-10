import { useState } from 'react'
import { usePortal } from '@/lib/store'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { WarehouseKpiRow } from '@/components/warehouse/WarehouseKpiRow'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import type { PortalEvent } from '@/lib/types'

interface WarehouseDashboardModuleProps {
  onSelectModule: (id: WarehouseModuleId) => void
  onOpenEventDetail: (id: string) => void
}

export function WarehouseDashboardModule({ onSelectModule, onOpenEventDetail }: WarehouseDashboardModuleProps) {
  const { events } = usePortal()
  const [searchQuery, setSearchQuery] = useState('')
  const [summaryEvent, setSummaryEvent] = useState<PortalEvent | null>(null)

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} topBarOnly />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} searchInHeader hideTopBar />
        <div className="flex w-full flex-col gap-8 px-5 py-6 sm:gap-10 sm:px-8">
          <WarehouseKpiRow events={events} onOpenModule={onSelectModule} />
          <WarehouseCalendarEventsView events={events} onSelectEvent={setSummaryEvent} />
        </div>
      </div>

      {summaryEvent && (
        <WomInputSummaryModal
          event={summaryEvent}
          onClose={() => setSummaryEvent(null)}
          onOpenFullDetail={onOpenEventDetail}
        />
      )}
    </div>
  )
}

export default WarehouseDashboardModule
