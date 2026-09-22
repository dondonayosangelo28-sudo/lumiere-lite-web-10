import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import { CompanionPanel } from '@/components/warehouse/CompanionPanel'
import { ConsoleLayout } from '@/components/ConsoleLayout'
import { useWarehouseNav } from '@/lib/warehouse-nav'

export type DrilldownEntry =
  | { kind: 'module'; moduleId: WarehouseModuleId }
  | { kind: 'event'; event: PortalEvent }

interface WarehouseDrilldownProps {
  entry: { kind: 'module'; moduleId: WarehouseModuleId }
  onExit: () => void
}

export function WarehouseDrilldown({ entry, onExit }: WarehouseDrilldownProps) {
  const { activeModuleId, selectModule } = useWarehouseNav()

  return (
    <ConsoleLayout mobileDocumentFlow>
      <CompanionPanel
        moduleId={activeModuleId}
        onSelectModule={selectModule}
        onClose={onExit}
      />
    </ConsoleLayout>
  )
}
