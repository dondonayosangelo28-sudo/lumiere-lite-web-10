import { useState } from 'react'
import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck } from 'lucide-react'
import { usePortal } from '@/lib/store'
import { useNav } from '@/lib/nav'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { WarehouseCalendarEventsView } from '@/components/warehouse/WarehouseCalendarEventsView'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { WomInputSummaryModal } from '@/components/warehouse/WomInputSummaryModal'
import { WarehouseDrilldown, type DrilldownEntry } from '@/components/warehouse/WarehouseDrilldown'
import { WarehouseEventDetailPage } from '@/pages/WarehouseEventDetailPage'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ErrorFallback } from '@/components/ErrorFallback'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import type { PortalEvent } from '@/lib/types'
import { cn } from '@/lib/utils'

const KPI_CARDS = [
  { label: 'Total Assets', value: '24', subtitle: 'Registered inventory', icon: Boxes, tone: 'bronze' },
  { label: 'Available Assets', value: '14', subtitle: 'Ready for allocation', icon: PackageCheck, tone: 'green' },
  { label: 'Critical Deficits', value: '1', subtitle: 'Requires attention', icon: AlertTriangle, tone: 'red' },
  { label: 'Pending Procurement', value: '28', subtitle: 'Open replenishment items', icon: CircleDollarSign, tone: 'amber' },
] as const

const toneClasses = {
  bronze: 'border-primary/60',
  green: 'border-emerald-600/40',
  red: 'border-destructive/40 bg-destructive/5',
  amber: 'border-amber-600/40',
} as const

const iconClasses = {
  bronze: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  red: 'bg-destructive/10 text-destructive',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
} as const

export function WarehouseHomePage() {
  const { events } = usePortal()
  const { navigate } = useNav()
  const [searchQuery, setSearchQuery] = useState('')
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
    <div className="flex min-h-screen bg-background text-foreground">
      <WarehouseRail
        activeModuleId="assets"
        onSelectModule={openModule}
        onExit={() => navigate('overview')}
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-7 px-6 py-7 sm:px-10 sm:py-8">
          <WarehouseHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <section aria-labelledby="warehouse-kpi-heading">
            <h2 id="warehouse-kpi-heading" className="sr-only">Warehouse dashboard summary</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {KPI_CARDS.map(({ label, value, subtitle, icon: Icon, tone }) => (
                <article key={label} className={cn('rounded-2xl border bg-card p-5 shadow-sm', toneClasses[tone])}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                    <span className={cn('flex size-9 items-center justify-center rounded-xl', iconClasses[tone])}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <p className={cn('mt-4 font-serif text-4xl font-medium', tone === 'red' && 'text-destructive')}>{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                </article>
              ))}
            </div>
          </section>

          <WarehouseCalendarEventsView events={events} onSelectEvent={(evt) => setSummaryEvent(evt)} />
        </div>
      </main>

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
