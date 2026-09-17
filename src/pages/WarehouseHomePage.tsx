import { useMemo, useState } from 'react'
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck } from 'lucide-react'
import { usePortal } from '@/lib/store'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { getCatalogAssets } from '@/lib/warehouse-catalog'
import { getDeficitLines } from '@/lib/warehouse-replenishment'
import { cn } from '@/lib/utils'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseDrilldown, type DrilldownEntry } from '@/components/warehouse/WarehouseDrilldown'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ErrorFallback } from '@/components/ErrorFallback'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import type { PortalEvent } from '@/lib/types'

export function WarehouseHomePage() {
  const { events, procurement } = usePortal()
  const [searchQuery, setSearchQuery] = useState('')
  const assetStats = useMemo(() => {
    const assets = getCatalogAssets()
    const deficits = getDeficitLines(events)
    return [
      { label: 'Total Assets', value: assets.length, detail: 'Registered inventory', icon: Boxes },
      { label: 'Available Assets', value: assets.filter((asset) => asset.status === 'Available').length, detail: 'Ready for allocation', icon: PackageCheck },
      { label: 'Critical Deficits', value: deficits.filter((line) => line.priority === 'Critical' && line.status !== 'Received').length, detail: 'Requires attention', icon: AlertTriangle, warning: true },
      { label: 'Pending Procurement', value: procurement.filter((item) => item.status === 'Not Purchased' || item.status === 'In Procurement').length, detail: 'Open replenishment items', icon: CircleDollarSign },
    ]
  }, [events, procurement])
  const [drilldown, setDrilldown] = useState<DrilldownEntry | null>(null)
  const [summaryEvent, setSummaryEvent] = useState<PortalEvent | null>(null)
  const [isLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const openModule = (id: WarehouseModuleId) => setDrilldown({ kind: 'module', moduleId: id })
  const openEvent = (id: string) => {
    const event = events.find((item) => item.id === id)
    if (event) setDrilldown({ kind: 'event', event })
  }

  if (drilldown?.kind === 'event') {
    return (
      <WarehouseEventDetailPage
        event={drilldown.event}
        onBack={() => setDrilldown(null)}
        onOpenModule={openModule}
      />
    )
  }

  if (drilldown?.kind === 'module') {
    return <WarehouseDrilldown entry={drilldown} onExit={() => setDrilldown(null)} />
  }

  if (isError) {
    return <ErrorFallback title="Warehouse Portal Unavailable" message="Could not load warehouse schedule & inventory records." onRetry={() => setIsError(false)} />
  }

  if (isLoading) {
    return <LoadingSkeleton variant="dashboard" />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[90rem] w-full flex-col gap-8 sm:gap-10 px-6 py-8 sm:px-10 sm:py-12">
        {/* Header section — untouched */}
        <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Asset health snapshot */}
        <section aria-labelledby="asset-health-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.24em] text-primary">Operations snapshot</p>
              <h2 id="asset-health-heading" className="mt-1 font-serif text-xl font-medium text-foreground">Asset health</h2>
            </div>
            <p className="hidden text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground sm:block">Live inventory signals</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {assetStats.map(({ label, value, detail, icon: Icon, warning }) => (
              <article key={label} className={cn('rounded-xl border border-border/80 bg-card/95 p-4 shadow-xs', warning && value > 0 && 'border-destructive/40 bg-destructive/5')}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  <Icon className={cn('size-4 text-primary', warning && value > 0 && 'text-destructive')} aria-hidden="true" />
                </div>
                <p className={cn('mt-3 font-serif text-3xl font-medium text-foreground', warning && value > 0 && 'text-destructive')}>{value}</p>
                <p className="mt-1 text-[0.62rem] text-muted-foreground">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Month Calendar + Upcoming Events Side Panel */}
        <WarehouseCalendarEventsView events={events} onSelectEvent={(evt) => setSummaryEvent(evt)} />
      </div>

      {/* WOM Input Summary Modal */}
      {summaryEvent && (
        <WomInputSummaryModal
          event={summaryEvent}
          onClose={() => setSummaryEvent(null)}
          onOpenFullDetail={(id) => openEvent(id)}
        />
      )}
    </div>
  )
}

export default WarehouseHomePage
