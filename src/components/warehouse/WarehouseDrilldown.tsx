import { useEffect, useState } from 'react'
import { Bell, UserCircle2 } from 'lucide-react'
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
  onOpenEventDetail: (id: string) => void
}

export function WarehouseDrilldown({ entry, onExit, onOpenEventDetail }: WarehouseDrilldownProps) {
  const [activeModuleId, setActiveModuleId] = useState<WarehouseModuleId>(entry.moduleId)

  useEffect(() => {
    setActiveModuleId(entry.moduleId)
  }, [entry.moduleId])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-5 sm:px-7" aria-label="WOM account utility bar">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}
          <span className="mx-2 text-border">|</span>
          {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())}
        </p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button type="button" aria-label="Notifications" className="flex size-7 items-center justify-center rounded-full border border-border bg-background hover:bg-accent">
            <Bell className="size-3.5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="WOM account profile" className="flex size-7 items-center justify-center rounded-full bg-secondary text-primary hover:bg-accent">
            <UserCircle2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <WarehouseRail activeModuleId={activeModuleId} onSelectModule={setActiveModuleId} onExit={onExit} />
      <CompanionPanel
        moduleId={activeModuleId}
        onClose={onExit}
        onSelectModule={setActiveModuleId}
        onOpenEventDetail={onOpenEventDetail}
      />
      </div>
    </div>
  )
}
