import { useState } from 'react'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { CompanionPanel } from '@/components/warehouse/CompanionPanel'

export type DrilldownEntry =
  | { kind: 'module'; moduleId: WarehouseModuleId }
  | { kind: 'event'; event: PortalEvent }

interface WarehouseDrilldownProps {
  entry: { kind: 'module'; moduleId: WarehouseModuleId }
  onExit: () => void
}

export function WarehouseDrilldown({ entry, onExit }: WarehouseDrilldownProps) {
  const [activeModuleId, setActiveModuleId] = useState<WarehouseModuleId>(entry.moduleId)

  return (
    <div className="fixed inset-0 z-40 flex bg-background">
      <WarehouseRail
        activeModuleId={activeModuleId}
        onSelectModule={(id) => {
          if (id === 'dashboard') {
            onExit()
            return
          }
          setActiveModuleId(id)
        }}
        onDashboard={onExit}
        onExit={onExit}
        defaultOpen={false}
      />
      <CompanionPanel moduleId={activeModuleId} onClose={onExit} />
    </div>
  )
}
