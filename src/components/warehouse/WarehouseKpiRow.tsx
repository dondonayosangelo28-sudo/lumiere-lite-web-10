import { AlertTriangle, Boxes, CheckCircle2, PackageSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCatalogAssets } from '@/lib/warehouse-catalog'
import { getDeficitLines } from '@/lib/warehouse-replenishment'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'

interface WarehouseKpiRowProps {
  events: PortalEvent[]
  onOpenModule: (id: WarehouseModuleId) => void
}

export function WarehouseKpiRow({ events, onOpenModule }: WarehouseKpiRowProps) {
  const assets = useCatalogAssets()
  const deficitLines = getDeficitLines(events)

  const stats = [
    { label: 'Total Assets', value: assets.length, subtitle: 'Registered inventory', icon: Boxes, border: 'border-l-primary', moduleId: 'assets' as WarehouseModuleId },
    { label: 'Available Assets', value: assets.filter((asset) => asset.status === 'Available').length, subtitle: 'Ready for allocation', icon: CheckCircle2, border: 'border-l-emerald-500', moduleId: 'assets' as WarehouseModuleId },
    { label: 'Critical Deficits', value: assets.filter((asset) => asset.status === 'Critical Deficit').length, subtitle: 'Requires attention', icon: AlertTriangle, border: 'border-l-destructive', moduleId: 'replenishment' as WarehouseModuleId, critical: true },
    { label: 'Pending Procurement', value: deficitLines.filter((line) => line.status !== 'Received').length, subtitle: 'Open replenishment items', icon: PackageSearch, border: 'border-l-amber-500', moduleId: 'replenishment' as WarehouseModuleId },
  ]

  return (
    <section aria-label="Warehouse inventory summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, subtitle, icon: Icon, border, moduleId, critical }) => (
        <button
          key={label}
          type="button"
          onClick={() => onOpenModule(moduleId)}
          className={cn(
            'rounded-lg border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-accent',
            'border-l-4',
            border,
            critical && 'border-destructive/25 border-l-destructive bg-destructive/5',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className={cn('font-serif text-3xl font-medium leading-none text-card-foreground', critical && 'text-destructive')}>
              {value}
            </p>
            <Icon className={cn('size-4 text-muted-foreground', critical && 'text-destructive')} aria-hidden="true" />
          </div>
          <p className="mt-3 text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.1em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </button>
      ))}
    </section>
  )
}
