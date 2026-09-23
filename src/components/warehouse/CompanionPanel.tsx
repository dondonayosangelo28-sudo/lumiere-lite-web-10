import { getWarehouseModule, type WarehouseModuleId } from '@/lib/warehouse-modules'
import type { DeficitFilter } from '@/lib/warehouse-replenishment'
import { AssetCatalogModule } from '@/components/warehouse/asset-catalog/AssetCatalogModule'
import { ReplenishmentModule } from '@/components/warehouse/replenishment/ReplenishmentModule'
import { VendorManagementModule } from '@/components/warehouse/vendors/VendorManagementModule'
import { DispatchModule } from '@/components/warehouse/dispatch/DispatchModule'
import { WarehouseTopBar } from '@/components/warehouse/WarehouseTopBar'
import { WarehouseDashboardModule } from '@/components/warehouse/dashboard/WarehouseDashboardModule'

interface CompanionPanelProps {
  moduleId: WarehouseModuleId
  replenishmentFilter?: DeficitFilter
  onClose: () => void
  onSelectModule?: (id: WarehouseModuleId) => void
  onOpenEventDetail?: (id: string) => void
}

export function CompanionPanel({ moduleId, replenishmentFilter, onClose, onSelectModule, onOpenEventDetail }: CompanionPanelProps) {
  const module = getWarehouseModule(moduleId)
  if (!module) return null

  if (moduleId === 'dashboard') {
    return <WarehouseDashboardModule onSelectModule={onSelectModule ?? (() => {})} onOpenEventDetail={onOpenEventDetail ?? (() => {})} />
  }

  if (moduleId === 'assets') {
    return <AssetCatalogModule onClose={onClose} />
  }

  if (moduleId === 'replenishment') {
    return <ReplenishmentModule onClose={onClose} initialFilter={replenishmentFilter} />
  }

  if (moduleId === 'dispatch') {
    return <DispatchModule onClose={onClose} />
  }

  if (moduleId === 'vendors') {
    return (
      <div className="flex h-full flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <WarehouseTopBar />
<div className="flex items-start justify-between gap-4 border-b border-border px-6 pb-5 pt-7 sm:px-10">
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-primary">Warehouse module</p>
            <h1 className="mt-1 pb-1 font-serif text-4xl font-medium leading-tight text-foreground">{module.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{module.blurb}</p>
          </div>
        </div>
        <div className="flex-1 px-6 py-6 sm:px-10">
          <VendorManagementModule />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto">
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-10">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-primary">Warehouse module</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-foreground">{module.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{module.blurb}</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 sm:px-10">
        <div className="max-w-xl">
          <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <module.icon className="size-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-semibold text-card-foreground">Coming in a later phase</p>
            <p className="mt-1 text-sm text-muted-foreground">{module.blurb}</p>
          </div>

          <ul className="mt-6 space-y-2.5">
            {module.previewPoints.map((point) => (
              <li
                key={point}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-card-foreground"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
