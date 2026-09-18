import { useState } from 'react'
import { usePortal } from '@/lib/store'
import { WarehouseDrilldown } from '@/components/warehouse/WarehouseDrilldown'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ErrorFallback } from '@/components/ErrorFallback'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import type { PortalEvent } from '@/lib/types'

export function WarehouseHomePage() {
  const { events } = usePortal()
  const [activeModuleId, setActiveModuleId] = useState<WarehouseModuleId>('dashboard')
  const [viewingEvent, setViewingEvent] = useState<PortalEvent | null>(null)
  const [isLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const openEvent = (id: string) => {
    const event = events.find((item) => item.id === id)
    if (event) setViewingEvent(event)
  }

  if (viewingEvent) {
    return (
      <WarehouseEventDetailPage
        event={viewingEvent}
        onBack={() => setViewingEvent(null)}
        onOpenModule={(id) => {
          setActiveModuleId(id)
          setViewingEvent(null)
        }}
      />
    )
  }

  if (isError) {
    return <ErrorFallback title="Warehouse Portal Unavailable" message="Could not load warehouse schedule & inventory records." onRetry={() => setIsError(false)} />
  }

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />
  }

  return (
    <WarehouseDrilldown
      entry={{ kind: 'module', moduleId: activeModuleId }}
      onExit={() => setActiveModuleId('dashboard')}
      onOpenEventDetail={openEvent}
    />
  )
}

export default WarehouseHomePage
