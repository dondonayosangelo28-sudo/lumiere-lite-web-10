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
    <div className="h-full flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-6 py-8 sm:gap-10 sm:px-10 sm:py-12">
        <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <WarehouseKpiRow events={events} onOpenModule={onSelectModule} />
        <WarehouseCalendarEventsView events={events} onSelectEvent={setSummaryEvent} />
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
