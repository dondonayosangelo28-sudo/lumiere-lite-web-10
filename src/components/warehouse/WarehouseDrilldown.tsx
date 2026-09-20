import { useState } from 'react'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import { WarehouseShell } from '@/components/warehouse/WarehouseShell'
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
    <WarehouseShell
      activeId={activeModuleId}
      onSelect={(id) => {
        if (id === 'dashboard') {
          onExit()
          return
        }
        setActiveModuleId(id)
      }}
    >
      <CompanionPanel moduleId={activeModuleId} onClose={onExit} />
    </WarehouseShell>
  )
}
