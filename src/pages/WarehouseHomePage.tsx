import { useState } from 'react'
import { usePortal } from '@/lib/store'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { ModuleEntryRow } from '@/components/warehouse/ModuleEntryRow'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'

export function WarehouseHomePage() {
  const { events } = usePortal()
  const [searchQuery, setSearchQuery] = useState('')
  const [summaryEvent, setSummaryEvent] = useState(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[90rem] w-full flex-col gap-8 px-6 py-8 sm:px-10 sm:py-12">
        <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ModuleEntryRow onOpenModule={() => undefined} />
        <WarehouseCalendarEventsView events={events} onSelectEvent={setSummaryEvent} />
      </div>
    </div>
  )
}

export default WarehouseHomePage
