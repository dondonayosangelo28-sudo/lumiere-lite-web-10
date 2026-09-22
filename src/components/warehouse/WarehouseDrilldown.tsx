import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { WarehouseMobileMenu } from '@/components/warehouse/WarehouseMobileMenu'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { CompanionPanel } from '@/components/warehouse/CompanionPanel'
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
    <div className="fixed inset-0 z-40 flex bg-background max-md:static max-md:inset-auto max-md:h-auto max-md:min-h-[100dvh] max-md:overflow-visible">
      <WarehouseRail activeModuleId={activeModuleId} onSelectModule={selectModule} onExit={onExit} />
      <main className="min-w-0 flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+6rem)] max-md:h-auto max-md:overflow-visible">
        <WarehouseHeader topBarOnly mobileLeading={<WarehouseMobileMenu />} searchQuery="" onSearchChange={() => {}} />
        <CompanionPanel moduleId={activeModuleId} onClose={onExit} />
      </main>
    </div>
  )
}
