import { useState } from 'react'
import { useNav } from '@/lib/nav'
import { usePortal } from '@/lib/store'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { CompanionPanel } from '@/components/warehouse/CompanionPanel'
import { WarehouseDashboardModule } from '@/components/warehouse/dashboard/WarehouseDashboardModule'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import { WarehouseNavContext } from '@/lib/warehouse-nav'

export function WarehouseDashboardPage() {
  const { events } = usePortal()
  const { navigate } = useNav()
  const [activeModuleId, setActiveModuleId] = useState<WarehouseModuleId>('dashboard')
  const [replenishmentFilter, setReplenishmentFilter] = useState<'critical' | 'po' | undefined>()
  const [detailEvent, setDetailEvent] = useState<PortalEvent | null>(null)

  const selectModule = (moduleId: WarehouseModuleId, filter?: 'critical' | 'po') => {
    if (moduleId === 'dashboard') {
      setActiveModuleId('dashboard')
      setReplenishmentFilter(undefined)
      return
    }
    setReplenishmentFilter(moduleId === 'replenishment' ? filter : undefined)
    setActiveModuleId(moduleId)
  }

  const openEventDetail = (eventId: string) => {
    const event = events.find((item) => item.id === eventId)
    if (event) setDetailEvent(event)
  }

  if (detailEvent) {
    return (
      <WarehouseEventDetailPage
        event={detailEvent}
        onBack={() => setDetailEvent(null)}
        onOpenModule={(moduleId) => {
          setDetailEvent(null)
          selectModule(moduleId)
        }}
      />
    )
  }

  return (
    <WarehouseNavContext.Provider value={{ activeModuleId, selectModule }}>
      <div className="fixed inset-0 flex overflow-hidden bg-background text-foreground max-md:static max-md:inset-auto max-md:h-auto max-md:min-h-[100dvh] max-md:overflow-visible">
        <WarehouseRail
          activeModuleId={activeModuleId}
          onSelectModule={selectModule}
        />
      {activeModuleId === 'dashboard' ? (
        <WarehouseDashboardModule
          onSelectModule={selectModule}
          onOpenEventDetail={openEventDetail}
        />
      ) : (
        <CompanionPanel
          moduleId={activeModuleId}
          replenishmentFilter={replenishmentFilter}
          onSelectModule={selectModule}
          onOpenEventDetail={openEventDetail}
          onClose={() => setActiveModuleId('dashboard')}
        />
        )}
      </div>
    </WarehouseNavContext.Provider>
  )
}

export default WarehouseDashboardPage

