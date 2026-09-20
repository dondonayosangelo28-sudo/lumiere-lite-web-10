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
  const [detailEvent, setDetailEvent] = useState<PortalEvent | null>(null)

  const selectModule = (moduleId: WarehouseModuleId) => {
    if (moduleId === 'dashboard') {
      setActiveModuleId('dashboard')
      return
    }
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
      <div className="fixed inset-0 flex overflow-hidden bg-background text-foreground">
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

