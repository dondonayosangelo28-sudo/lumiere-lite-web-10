import { Fragment, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Archive, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Download, Package, Search, SlidersHorizontal, Truck, User, X } from 'lucide-react'
import { WarehouseTopBar } from '@/components/warehouse/WarehouseTopBar'
import { usePortal } from '@/lib/store'
import {
  addNewCustomBatch,
  advanceBatchStage,
  createReturnBatchFromDelivered,
  deleteBatch,
  exportBatchPdf,
  getArchivedBatches,
  getEventDispatchSummaries,
  markBatchStalled,
  resolveBatchStall,
  updateBatchHandoffNote,
  updateBatchInfo,
  updateReconciliationRow,
  useDispatchStore,
  type BatchDirection,
  type DispatchBatch,
  type EventDispatchSummary,
} from '@/lib/warehouse-dispatch'
import { getEventDetailSnapshot } from '@/lib/event-detail'
import { DispatchStepper } from '@/components/warehouse/event-detail/DispatchStepper'
import { exportDispatchConsolidatedPdf, exportDispatchEventPdf } from '@/lib/pdf-exporter'
import { BatchDetailView } from '@/components/warehouse/event-detail/BatchDetailView'
import { ConfirmArchiveBatchModal } from '@/components/warehouse/dispatch/ConfirmArchiveBatchModal'
import { Pill } from '@/components/warehouse/shared/Pill'
import { cn } from '@/lib/utils'

type ViewMode = 'grouped' | 'consolidated' | 'completed'
type EventTab = 'overview' | 'items'

interface EventItemRow {
  id: string
  itemName: string
  required: number
  prepared: number | null
  dispatched: number | null
  remaining: number | null
  status: string
  batchLabel: string
  batchId?: string
  reconciliationStatus?: string
  assetId?: string
}

  function displayReconciliationStatus(status: string) {
  return status === 'Pahabol' || status === 'Short' ? 'Additional Delivery' : status
  }

function deriveEventItems(summary: EventDispatchSummary): EventItemRow[] {
  const rows = new Map<string, EventItemRow>()
  summary.batches.forEach((batch) => {
    batch.reconciliation.forEach((row) => {
      const key = row.itemName.toLowerCase()
      const existing = rows.get(key)
      const dispatched = batch.stage === 'In Transit' || batch.stage === 'Delivered' || batch.stage === 'Returned' ? row.actual : 0
      const status = batch.stalled
        ? 'Needs Attention'
        : row.status === 'Pahabol'
          ? 'Additional Delivery'
          : batch.stage === 'Delivered' || batch.stage === 'Returned'
            ? 'On Site'
            : batch.stage === 'In Transit'
              ? 'In Transit'
              : batch.stage === 'Loaded'
                ? 'Ready for Dispatch'
                : 'Preparing'
      rows.set(key, {
        id: row.id,
        itemName: row.itemName,
        required: (existing?.required ?? 0) + row.planned,
        prepared: (existing?.prepared ?? 0) + row.actual,
        dispatched: (existing?.dispatched ?? 0) + dispatched,
        remaining: Math.max(0, (existing?.remaining ?? 0) + row.planned - dispatched),
        status,
        batchLabel: batch.vehicleType,
        batchId: batch.id,
        reconciliationStatus: displayReconciliationStatus(row.status),
        assetId: batch.assetId,
      })
    })
  })
  return Array.from(rows.values())
}

interface DispatchModuleProps {
  onClose: () => void
}

// A flattened, navigable batch reference — used so Level 3 (batch detail)
// can page Previous/Next across whichever list it was opened from, be that
// a single event's batches (Event-Grouped) or every batch fleet-wide
// (Consolidated).
interface NavigableBatch {
  eventId: string
  eventTitle: string
  batch: DispatchBatch
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
  return (
    <span
      title={name}
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.58rem] font-bold uppercase tracking-wide text-primary ring-1 ring-border"
    >
      {initials}
    </span>
  )
}

import { useAuth } from '@/lib/auth'

export function DispatchModule({ onClose }: DispatchModuleProps) {
  const { events, staff, procurement } = usePortal()
  const { adminEmail, adminName } = useAuth()
  // The store snapshot has to be part of the memo key — without it a stage
  // advance or a newly staged batch mutates the store but never re-derives
  // the summaries the UI renders from.
  const batchStore = useDispatchStore(events, staff, procurement)
  const summaries = useMemo(
    () => getEventDispatchSummaries(events, staff, procurement),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, staff, procurement, batchStore],
  )

  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [completedSearch, setCompletedSearch] = useState('')
  const [completedDateFilter, setCompletedDateFilter] = useState('all')
  const [activeBatchIndex, setActiveBatchIndex] = useState<number | null>(null)
  const [pendingBatchId, setPendingBatchId] = useState<string | null>(null)
  const [newBatchModal, setNewBatchModal] = useState<{ eventId: string; direction: BatchDirection } | null>(null)
  const [archiveBatchTarget, setArchiveBatchTarget] = useState<{ eventId: string; batch: DispatchBatch } | null>(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [reconciliationFilter, setReconciliationFilter] = useState('all')
  const [eventTab, setEventTab] = useState<EventTab>('overview')
  const [itemSearch, setItemSearch] = useState('')
  const [itemStatusFilter, setItemStatusFilter] = useState('all')
  const [itemBatchFilter, setItemBatchFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState<EventItemRow | null>(null)

  useEffect(() => {
    if (!selectedEventId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedEventId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEventId])

  const filteredSummaries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return summaries
      .map((summary) => ({
        ...summary,
        batches: summary.batches.filter((batch) => {
          const matchesQuery = !query || `${summary.eventTitle} ${summary.venue} ${batch.id} ${batch.vehicleType} ${batch.plateNumber} ${batch.driverName}`.toLowerCase().includes(query)
          const matchesStage = stageFilter === 'all' || batch.stage === stageFilter
          const matchesDirection = directionFilter === 'all' || batch.direction === directionFilter
          const hasIssue = batch.reconciliation.some((row) => row.status === 'Pahabol' || row.status === 'Short')
          const matchesReconciliation = reconciliationFilter === 'all' || (reconciliationFilter === 'issues' ? hasIssue : !hasIssue)
          return matchesQuery && matchesStage && matchesDirection && matchesReconciliation
        }),
      }))
      .filter((summary) => summary.batches.length > 0)
  }, [directionFilter, reconciliationFilter, search, stageFilter, summaries])

  const completedSummaries = useMemo(() => {
    const query = completedSearch.trim().toLowerCase()
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const startOfWeek = startOfToday - ((now.getDay() + 6) % 7) * 86400000
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    return summaries
      .map((summary) => ({ summary, event: events.find((event) => event.id === summary.eventId) }))
      .filter(({ summary, event }) => {
        if (!event || summary.batches.length === 0 || summary.hasStalled || summary.handshakePercent < 100) return false
        const allWorkComplete = summary.batches.every((batch) =>
          (batch.direction === 'outbound' && batch.stage === 'Delivered')
          || (batch.direction === 'return' && batch.stage === 'Returned'),
        )
        if (!allWorkComplete) return false
        const matchesSearch = !query || `${summary.eventTitle} ${event.client} ${summary.venue}`.toLowerCase().includes(query)
        const dateValue = new Date(summary.targetDate).getTime()
        const matchesDate = completedDateFilter === 'all'
          || (completedDateFilter === 'today' && dateValue >= startOfToday)
          || (completedDateFilter === 'week' && dateValue >= startOfWeek)
          || (completedDateFilter === 'month' && dateValue >= startOfMonth)
        return matchesSearch && matchesDate
      })
      .map(({ summary, event }) => ({ ...summary, client: event?.client ?? '' }))
  }, [completedDateFilter, completedSearch, events, summaries])

  const selectedEvent = filteredSummaries.find((s) => s.eventId === selectedEventId) ?? null
  const selectedCompletedEvent = completedSummaries.find((s) => s.eventId === selectedEventId) ?? null
  const eventItems = useMemo(() => {
    if (!selectedEvent) return []
    const query = itemSearch.trim().toLowerCase()
    return deriveEventItems(selectedEvent).filter((item) => {
      const matchesSearch = !query || item.itemName.toLowerCase().includes(query)
      const matchesStatus = itemStatusFilter === 'all' || item.status === itemStatusFilter
      const matchesBatch = itemBatchFilter === 'all' || (itemBatchFilter === 'unassigned' ? !item.batchId : item.batchId === itemBatchFilter)
      return matchesSearch && matchesStatus && matchesBatch
    })
  }, [itemBatchFilter, itemSearch, itemStatusFilter, selectedEvent])

  // The list currently being navigated in the Level 3 overlay.
  const navList: NavigableBatch[] = useMemo(() => {
    if (viewMode === 'consolidated') {
      return summaries.flatMap((summary) =>
        summary.batches.map((batch) => ({ eventId: summary.eventId, eventTitle: summary.eventTitle, batch })),
      )
    }
    const eventForNavigation = selectedEvent ?? selectedCompletedEvent
    if (eventForNavigation) {
      return eventForNavigation.batches.map((batch) => ({
        eventId: eventForNavigation.eventId,
        eventTitle: eventForNavigation.eventTitle,
        batch,
      }))
    }
    return []
  }, [viewMode, summaries, selectedEvent])

  const activeNav = activeBatchIndex !== null ? navList[activeBatchIndex] : undefined

  const openBatch = (eventId: string, batchId: string) => {
    const list =
      viewMode === 'consolidated'
        ? summaries.flatMap((summary) =>
            summary.batches.map((batch) => ({ eventId: summary.eventId, eventTitle: summary.eventTitle, batch })),
          )
        : (summaries.find((s) => s.eventId === eventId)?.batches ?? []).map((batch) => ({
            eventId,
            eventTitle: summaries.find((s) => s.eventId === eventId)?.eventTitle ?? '',
            batch,
          }))
    const index = list.findIndex((entry) => entry.batch.id === batchId)
    setActiveBatchIndex(index === -1 ? null : index)
  }


  useEffect(() => {
    if (!pendingBatchId) return
    const index = navList.findIndex((entry) => entry.batch.id === pendingBatchId)
    if (index === -1) return
    setActiveBatchIndex(index)
    setPendingBatchId(null)
  }, [pendingBatchId, navList])

  const exportEventManifest = (summary: EventDispatchSummary) => {
    exportDispatchEventPdf(summary)
  }

  const exportConsolidatedManifest = () => {
    exportDispatchConsolidatedPdf(summaries)
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <WarehouseTopBar />
<div className="flex flex-col gap-4 border-b border-border px-6 pb-5 pt-6 sm:px-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-1 pb-1 font-serif text-4xl font-medium leading-tight text-foreground">Dispatch &amp; Logistics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dispatch manifests, vehicle assignments, and transit checkpoints.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-md border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => {
                setViewMode('grouped')
              }}
              aria-pressed={viewMode === 'grouped'}
              className={cn(
                'rounded-sm px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] transition',
                viewMode === 'grouped' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              Event-Grouped
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('consolidated')
                setSelectedEventId(null)
              }}
              aria-pressed={viewMode === 'consolidated'}
              className={cn(
                'rounded-sm px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] transition',
                viewMode === 'consolidated' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              Dispatch Overview
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('completed')
                setSelectedEventId(null)
              }}
              aria-pressed={viewMode === 'completed'}
              className={cn(
                'rounded-sm px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] transition',
                viewMode === 'completed' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              Completed Events
            </button>
          </div>
            {viewMode === 'consolidated' && (
              <button
                type="button"
                onClick={exportConsolidatedManifest}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-border bg-background px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition hover:bg-accent"
              >
                <Download className="size-3.5" />
                Export All (PDF)
              </button>
            )}
          </div>

          {viewMode === 'completed' ? (
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input value={completedSearch} onChange={(event) => setCompletedSearch(event.target.value)} placeholder="Search event, client, venue..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" aria-label="Search completed events" />
              </label>
              <select value={completedDateFilter} onChange={(event) => setCompletedDateFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" aria-label="Filter completed events by date">
                <option value="all">All Dates</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option>
              </select>
            </div>
          ) : (
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, vehicles, batch IDs..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" aria-label="Search events, vehicles, batch IDs" />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" aria-label="Filter by dispatch status">
                <option value="all">All stages</option><option value="Planned">Planned</option><option value="Loaded">Loaded</option><option value="In Transit">In Transit</option><option value="Delivered">Delivered</option><option value="Returned">Returned</option>
              </select>
              <select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" aria-label="Filter by direction">
                <option value="all">All directions</option><option value="outbound">Outbound</option><option value="return">Return</option>
              </select>
              <select value={reconciliationFilter} onChange={(event) => setReconciliationFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none" aria-label="Filter by reconciliation">
                <option value="all">All reconciliation</option><option value="issues">Needs attention</option><option value="clear">Clear</option>
              </select>
            </div>
          </div>
          )}

        {viewMode === 'grouped' && selectedEvent && (
          <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <button type="button" onClick={() => setSelectedEventId(null)} className="text-primary hover:underline">
              All Events
            </button>
            <ChevronRight className="size-3" />
            <span className="text-card-foreground">{selectedEvent.eventTitle}</span>
          </div>
        )}
      </div>

      <div className="flex-1 px-6 py-6 sm:px-10">
        {viewMode === 'consolidated' ? (
          <ConsolidatedBatchTable summaries={filteredSummaries} onOpenBatch={openBatch} />
        ) : viewMode === 'completed' ? (
          <CompletedEventsList summaries={completedSummaries} onOpenEvent={setSelectedEventId} />
        ) : (
          <EventCardGrid summaries={filteredSummaries} onOpenEvent={setSelectedEventId} />
        )}
      </div>

      {(selectedEvent || selectedCompletedEvent) && (viewMode === 'grouped' || viewMode === 'completed') && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEventId(null) }}>
          <section className="flex max-h-[88vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dispatch-event-detail-title">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-8">
              <div><p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-primary">{viewMode === 'completed' ? 'Completed event' : 'Event detail'}</p><h2 id="dispatch-event-detail-title" className="mt-1 font-serif text-2xl font-medium text-card-foreground">{(selectedCompletedEvent ?? selectedEvent)?.eventTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{(selectedCompletedEvent ?? selectedEvent)?.venue}</p></div>
              <button type="button" onClick={() => setSelectedEventId(null)} className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close event detail"><X className="size-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="border-b border-border px-5 py-5 sm:px-8"><EventOverview summary={(selectedCompletedEvent ?? selectedEvent)!} /></div>
              <div className="p-5 sm:p-8"><EventBatchLevel summary={(selectedCompletedEvent ?? selectedEvent)!} onNewBatch={() => undefined} onOpenBatch={(batchId) => openBatch((selectedCompletedEvent ?? selectedEvent)!.eventId, batchId)} onExportManifest={() => exportEventManifest((selectedCompletedEvent ?? selectedEvent)!)} readOnly={viewMode === 'completed'} /></div>
            </div>
          </section>
        </div>
      )}

      {false && selectedEvent && viewMode === 'grouped' && (
        <div className="fixed inset-0 z-40 flex justify-end bg-background/65 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEventId(null) }}>
          <aside className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-border bg-card shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dispatch-event-detail-title">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div><p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-primary">Event detail</p><h2 id="dispatch-event-detail-title" className="mt-1 font-serif text-2xl font-medium text-card-foreground">{selectedEvent.eventTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedEvent.venue}</p></div>
              <button type="button" onClick={() => setSelectedEventId(null)} className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close event detail"><X className="size-4" /></button>
            </div>
            <div className="border-b border-border px-6 py-5"><EventOverview summary={selectedEvent} /></div>
            <div className="border-b border-border px-6 pt-4">
              <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Event dispatch views">
                {(['overview', 'items'] as EventTab[]).map((tab) => (
                  <button key={tab} type="button" role="tab" aria-selected={eventTab === tab} onClick={() => setEventTab(tab)} className={cn('border-b-2 px-3 pb-3 text-[0.62rem] font-bold uppercase tracking-[0.1em] transition', eventTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                    {tab[0].toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6">
              {eventTab === 'items' ? (
                <EventItemsView summary={selectedEvent} items={eventItems} search={itemSearch} onSearch={setItemSearch} statusFilter={itemStatusFilter} onStatusFilter={setItemStatusFilter} batchFilter={itemBatchFilter} onBatchFilter={setItemBatchFilter} onSelectItem={setSelectedItem} />
              ) : (
                <EventBatchLevel summary={selectedEvent} onNewBatch={(direction) => setNewBatchModal({ eventId: selectedEvent.eventId, direction })} onOpenBatch={(batchId) => openBatch(selectedEvent.eventId, batchId)} onExportManifest={() => exportEventManifest(selectedEvent)} />
              )}
            </div>
          </aside>
        </div>
      )}

      {selectedItem && <ItemDetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {activeNav && (
        <BatchDetailView
          batch={activeNav.batch}
          hasPrevious={activeBatchIndex !== null && activeBatchIndex > 0}
          hasNext={activeBatchIndex !== null && activeBatchIndex < navList.length - 1}
          onPrevious={() => setActiveBatchIndex((i) => (i !== null ? Math.max(0, i - 1) : i))}
          onNext={() => setActiveBatchIndex((i) => (i !== null ? Math.min(navList.length - 1, i + 1) : i))}
          onClose={() => setActiveBatchIndex(null)}
          onJustificationChange={(rowId, value) =>
            updateReconciliationRow(activeNav.eventId, activeNav.batch.id, rowId, { justification: value })
          }
          onHandoffNoteChange={(value) =>
            updateBatchHandoffNote(activeNav.eventId, activeNav.batch.id, value)
          }
          onAdvanceStage={() => advanceBatchStage(activeNav.eventId, activeNav.batch.id)}
          onStall={(reason) => markBatchStalled(activeNav.eventId, activeNav.batch.id, reason)}
          onResume={() => resolveBatchStall(activeNav.eventId, activeNav.batch.id)}
          availableVehicles={summaries.flatMap((summary) => summary.batches).map((candidate) => ({ vehicleType: candidate.vehicleType, plateNumber: candidate.plateNumber }))}
  availableDrivers={Array.from(new Set(summaries.flatMap((summary) => summary.batches.map((candidate) => candidate.driverName).filter(Boolean) as string[])))}
  onUpdateInfo={(info) => updateBatchInfo(activeNav.eventId, activeNav.batch.id, info)}
          onExportPdf={() => {
            const ev = events.find((e) => e.id === activeNav.eventId)
            exportBatchPdf({ eventTitle: activeNav.eventTitle, venue: ev?.venue || '', targetDate: ev?.targetDate || '' }, activeNav.batch)
          }}
          onCreateReturnBatch={() => createReturnBatchFromDelivered(activeNav.eventId, activeNav.batch)}
          readOnly={viewMode === 'completed'}
          onDelete={() => {
            setArchiveBatchTarget({ eventId: activeNav.eventId, batch: activeNav.batch })
          }}
        />
      )}

      {archiveBatchTarget && (
        <ConfirmArchiveBatchModal
          isOpen={!!archiveBatchTarget}
          onClose={() => setArchiveBatchTarget(null)}
          onConfirm={(reason) => {
            deleteBatch(archiveBatchTarget.eventId, archiveBatchTarget.batch.id, reason, {
              id: adminEmail || 'wom-001',
              name: adminName || 'Warehouse Operations Manager',
            })
            setArchiveBatchTarget(null)
            setActiveBatchIndex(null)
          }}
          batchCode={archiveBatchTarget.batch.id}
          driverName={archiveBatchTarget.batch.driverName}
          vehicleType={archiveBatchTarget.batch.vehicleType}
          itemCount={archiveBatchTarget.batch.reconciliation.length}
        />
      )}

      {newBatchModal && (
        <NewBatchModal
          eventId={newBatchModal.eventId}
          direction={newBatchModal.direction}
          onClose={() => setNewBatchModal(null)}
        />
      )}
    </div>
  )
}

function CompletedEventsList({ summaries, onOpenEvent }: { summaries: Array<EventDispatchSummary & { client: string }>; onOpenEvent: (eventId: string) => void }) {
  if (summaries.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center"><Archive className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-semibold text-card-foreground">No completed events yet.</p><p className="mt-1 text-xs text-muted-foreground">Completed events will appear here after their dispatch and logistics workflow is finished.</p></div>
  }
  return <div className="flex flex-col gap-3">{summaries.map((summary) => <button key={summary.eventId} type="button" onClick={() => onOpenEvent(summary.eventId)} className="group flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-serif text-base font-medium text-card-foreground">{summary.eventTitle}</p><p className="truncate text-xs text-muted-foreground">{summary.client} · {summary.venue}</p><p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{summary.targetDate}</p></div><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Completed <ChevronRight className="size-3" /></span></div><div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Truck className="size-3.5" />{summary.batches.length} batch{summary.batches.length === 1 ? '' : 'es'}</span><span>{summary.batches.filter((batch) => batch.direction === 'outbound').length} outbound</span><span>{summary.batches.filter((batch) => batch.direction === 'return').length} return</span><span>{summary.batches.reduce((count, batch) => count + batch.reconciliation.length, 0)} item lines</span></div></button>)}</div>
}

function EventCardGrid({
  summaries,
  onOpenEvent,
}: {
  summaries: EventDispatchSummary[]
  onOpenEvent: (eventId: string) => void
}) {
  if (summaries.length === 0) {
    return <p className="text-sm text-muted-foreground">No events on the registry yet.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {summaries.map((summary) => (
        <button
          key={summary.eventId}
          type="button"
          onClick={() => onOpenEvent(summary.eventId)}
          className="group flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-serif text-base font-medium text-card-foreground">{summary.eventTitle}</p>
              <p className="truncate text-[0.62rem] uppercase tracking-[0.06em] text-muted-foreground">{summary.venue}</p>
            </div>
            {summary.hasStalled && (
              <span
                title="A batch is stalled in transit"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-background"
              >
                <AlertTriangle className="size-3.5" />
              </span>
            )}
            {summary.hasPahabol && (
              <span
                title="Additional Delivery items flagged"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
              >
                <AlertTriangle className="size-3.5" />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex flex-wrap items-center gap-4 text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Truck className="size-3.5" />{summary.batches.length} batch{summary.batches.length === 1 ? '' : 'es'}</span>
              <span>{summary.batches.filter((batch) => batch.direction === 'outbound').length} outbound</span>
              <span>{summary.batches.filter((batch) => batch.direction === 'return').length} return</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', summary.handshakePercent >= 90 ? 'bg-primary' : summary.handshakePercent >= 60 ? 'bg-accent-foreground/60' : 'bg-destructive')}
                  style={{ width: `${summary.handshakePercent}%` }}
                />
              </div>
              <span className="text-[0.6rem] font-bold text-card-foreground">{summary.handshakePercent}%</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

function EventOverview({ summary }: { summary: EventDispatchSummary }) {
  const stages = ['Planned', 'Loaded', 'In Transit', 'Delivered']
  const counts = stages.map((stage) => summary.batches.filter((batch) => batch.stage === stage).length)
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stages.map((stage, index) => (
        <div key={stage} className="rounded-lg border border-border/70 bg-background px-3 py-3">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{stage}</p>
          <p className="mt-1 text-xl font-semibold text-card-foreground">{counts[index]}</p>
        </div>
      ))}
    </div>
  )
}

function EventItemsView({ summary, items, search, onSearch, statusFilter, onStatusFilter, batchFilter, onBatchFilter, onSelectItem }: { summary: EventDispatchSummary; items: EventItemRow[]; search: string; onSearch: (value: string) => void; statusFilter: string; onStatusFilter: (value: string) => void; batchFilter: string; onBatchFilter: (value: string) => void; onSelectItem: (item: EventItemRow) => void }) {
  const allItems = deriveEventItems(summary)
  const statuses = Array.from(new Set(allItems.map((item) => item.status)))
  const batches = summary.batches
  const attentionCount = allItems.filter((item) => item.status === 'Needs Attention' || item.reconciliationStatus === 'Additional Delivery' || !item.batchId).length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm font-semibold text-card-foreground">Items to dispatch</p><p className="text-xs text-muted-foreground">All item lines currently linked to this event&apos;s dispatch batches.</p></div>
        <span className={cn('rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider', attentionCount ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300')}>{attentionCount ? `${attentionCount} needs attention` : 'No items require attention'}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2"><Search className="size-3.5 text-muted-foreground" aria-hidden="true" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search items..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Search items" /></label>
        <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground" aria-label="Filter item status"><option value="all">All Statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        <select value={batchFilter} onChange={(event) => onBatchFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground" aria-label="Filter item batch"><option value="all">All Batches</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.vehicleType}</option>)}{allItems.some((item) => !item.batchId) && <option value="unassigned">Unassigned</option>}</select>
      </div>
      {items.length === 0 ? <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center"><Package className="mx-auto size-7 text-muted-foreground" /><p className="mt-2 text-sm font-medium text-card-foreground">No items found</p><p className="mt-1 text-xs text-muted-foreground">No items match the selected filters.</p></div> : <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[720px] text-left"><thead className="bg-muted/40"><tr>{['Item', 'Required', 'Prepared', 'Dispatched', 'Remaining', 'Status', 'Batch'].map((heading) => <th key={heading} className="px-3 py-3 text-[0.56rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{heading}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id} onClick={() => onSelectItem(item)} className="cursor-pointer border-t border-border/60 transition hover:bg-muted/40"><td className="px-3 py-3 text-xs font-semibold text-card-foreground">{item.itemName}</td><td className="px-3 py-3 text-xs text-foreground">{item.required}</td><td className="px-3 py-3 text-xs text-foreground">{item.prepared ?? '—'}</td><td className="px-3 py-3 text-xs text-foreground">{item.dispatched ?? '—'}</td><td className="px-3 py-3 text-xs text-foreground">{item.remaining ?? '—'}</td><td className="px-3 py-3"><span className="rounded-full bg-primary/10 px-2 py-1 text-[0.58rem] font-bold text-primary">{item.status}</span></td><td className="px-3 py-3 text-xs text-muted-foreground">{item.batchLabel || 'Unassigned'}</td></tr>)}</tbody></table></div>}
    </div>
  )
}

function ItemDetailDialog({ item, onClose, hidden = false }: { item: EventItemRow; onClose: () => void; hidden?: boolean }) {
  if (hidden) return null
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[0.6rem] font-bold uppercase tracking-wider text-primary">Item detail</p><h3 className="mt-1 font-serif text-xl text-card-foreground">{item.itemName}</h3></div><button type="button" onClick={onClose} aria-label="Close item detail" className="rounded-md p-2 text-muted-foreground hover:bg-accent"><X className="size-4" /></button></div><dl className="mt-5 grid grid-cols-2 gap-3 text-xs">{[['Required', item.required], ['Prepared', item.prepared ?? '—'], ['Dispatched', item.dispatched ?? '—'], ['Remaining', item.remaining ?? '—'], ['Status', item.status], ['Batch', item.batchLabel || 'Unassigned']].map(([label, value]) => <div key={String(label)} className="rounded-md bg-muted/40 p-3"><dt className="text-[0.56rem] font-bold uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold text-foreground">{value}</dd></div>)}</dl>{!item.assetId && <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">This item is not linked to a live asset record. Its dispatch status cannot be changed yet.</p>}</div></div>
}

function EventReturnsView({ summary, onNewBatch }: { summary: EventDispatchSummary; onNewBatch: () => void }) {
  const returns = summary.batches.filter((batch) => batch.direction === 'return')
  return <div className="space-y-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-card-foreground">Returns</p><p className="text-xs text-muted-foreground">Returned batches and their current inspection state.</p></div><button type="button" onClick={onNewBatch} className="rounded-md border border-border px-3 py-2 text-[0.6rem] font-bold uppercase tracking-wider hover:bg-accent">+ New Return Batch</button></div>{returns.length === 0 ? <div className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">No return batches have been created for this event.</div> : <div className="space-y-2">{returns.map((batch) => <div key={batch.id} className="rounded-lg border border-border bg-background p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-card-foreground">{batch.vehicleType}</span><span className="text-xs text-muted-foreground">{batch.stage}</span></div><p className="mt-1 text-xs text-muted-foreground">{batch.plateNumber} · {batch.reconciliation.length} item lines</p></div>)}</div>}</div>
}

function EventBatchLevel({
  summary,
  onNewBatch,
  onOpenBatch,
  onExportManifest,
  onlyOutbound = false,
  readOnly = false,
}: {
  summary: EventDispatchSummary
  onNewBatch: (direction: BatchDirection) => void
  onOpenBatch: (batchId: string) => void
  onExportManifest: () => void
  onlyOutbound?: boolean
  readOnly?: boolean
}) {
  const [showArchived, setShowArchived] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Handshake rate <span className="font-semibold text-card-foreground">{summary.handshakePercent}%</span> across{' '}
          {summary.batches.length} batch{summary.batches.length === 1 ? '' : 'es'}.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportManifest}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-border bg-background px-3.5 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition hover:bg-accent"
          >
            <Download className="size-3.5" />
            Export Manifest (PDF)
          </button>
          {!readOnly && <>
            <button
              type="button"
              onClick={() => onNewBatch('outbound')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3.5 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary-foreground transition hover:opacity-90"
            >
              + New Outbound Batch
            </button>
            <button
              type="button"
              onClick={() => onNewBatch('return')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-background px-3.5 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition hover:bg-accent"
            >
              + New Return Batch
            </button>
          </>}
        </div>
      </div>

      {summary.batches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          No dispatch batches created for this event yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary.batches.map((batch) => (
            <li key={batch.id} className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
              <div
                onClick={() => onOpenBatch(batch.id)}
                className="flex w-full flex-wrap items-center gap-4 cursor-pointer hover:opacity-95"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                  aria-label={batch.direction === 'outbound' ? 'Outbound / egress' : 'Return / ingress'}
                >
                  {batch.direction === 'outbound' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                </span>
                <div className="min-w-0 shrink-0">
                  <p className="truncate text-sm font-bold text-card-foreground">{batch.vehicleType}</p>
                  <p className="truncate text-[0.62rem] uppercase tracking-[0.06em] text-muted-foreground">
                    {batch.plateNumber} · Driver: <span className="font-semibold text-foreground">{batch.driverName || 'Unassigned'}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {batch.crew.length === 0 ? (
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="size-3.5" />
                    </span>
                  ) : (
                    batch.crew.slice(0, 3).map((member) => <Avatar key={member.id} name={member.name} />)
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      exportBatchPdf({ eventTitle: summary.eventTitle, venue: summary.venue, targetDate: summary.targetDate }, batch)
                    }}
                    className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-card-foreground hover:bg-accent"
                  >
                    <Download className="size-3" />
                    PDF
                  </button>

                  {batch.direction === 'outbound' && batch.stage === 'Delivered' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        createReturnBatchFromDelivered(summary.eventId, batch)
                      }}
                      className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-white hover:bg-emerald-700"
                    >
                      + Return Batch
                    </button>
                  )}

                  <DispatchStepper direction={batch.direction} stage={batch.stage} stalled={batch.stalled} />
                </div>
              </div>

              {/* Contained Assets Summary Row */}
              <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
                <span className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Contained Assets ({batch.reconciliation.length}):
                </span>
                {batch.reconciliation.length === 0 ? (
                  <span className="text-[0.62rem] text-muted-foreground">No assets staged yet.</span>
                ) : (
                  batch.reconciliation.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[0.62rem] font-medium text-foreground"
                    >
                      <span>{item.itemName}</span>
                      <span className="font-bold text-primary">({item.planned})</span>
                    </span>
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl border border-border bg-background p-4" aria-labelledby="return-activity-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p id="return-activity-title" className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Return activity</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.batches.filter((batch) => batch.direction === 'return').length > 0
                ? `${summary.batches.filter((batch) => batch.direction === 'return').length} return batch${summary.batches.filter((batch) => batch.direction === 'return').length === 1 ? '' : 'es'} in this event.`
                : 'No active return activity.'}
            </p>
          </div>
          {summary.batches.filter((batch) => batch.direction === 'return').length > 0 && (
            <div className="text-right text-xs text-muted-foreground">
              <span className="font-semibold text-card-foreground">
                {summary.batches.filter((batch) => batch.direction === 'return').reduce((total, batch) => total + batch.reconciliation.length, 0)}
              </span>{' '}
              item lines pending inspection
            </div>
          )}
        </div>
      </section>

      {/* Collapsible Archived Batches Section */}
      {(() => {
        const archived = getArchivedBatches(summary.eventId)
        if (archived.length === 0) return null
        return (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold text-destructive hover:opacity-90"
            >
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 shrink-0" />
                <span>Archived / Canceled Batches ({archived.length})</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', showArchived && 'rotate-180')} />
            </button>

            {showArchived && (
              <div className="space-y-2.5 border-t border-destructive/20 pt-3 animate-in fade-in-0">
                {archived.map((batch) => (
                  <div key={batch.id} className="rounded-lg border border-border bg-card p-3.5 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <span className="rounded bg-destructive/15 px-2 py-0.5 text-[0.62rem] font-bold text-destructive uppercase tracking-wider">Canceled</span>
                        <span>{batch.vehicleType} ({batch.plateNumber})</span>
                        <span className="text-[0.7rem] font-normal text-muted-foreground">· Batch ID: {batch.id}</span>
                      </div>
                      <span className="text-[0.68rem] text-muted-foreground font-mono">
                        {batch.archivedAt ? new Date(batch.archivedAt).toLocaleString() : 'Archived'}
                      </span>
                    </div>

                    <div className="grid gap-1.5 rounded-md bg-muted/40 p-2.5 text-[0.75rem]">
                      <div>
                        <span className="font-semibold text-foreground">Archived By: </span>
                        <span className="text-muted-foreground">{batch.archivedBy || 'Warehouse Manager'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Operational Reason: </span>
                        <span className="text-destructive font-medium">{batch.archiveReason || 'No reason specified'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Manifest Snapshot: </span>
                        <span className="text-muted-foreground">
                          {batch.reconciliation.length} items ({batch.reconciliation.map((r) => `${r.itemName} [${r.planned}]`).join(', ') || 'None'})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

function ConsolidatedBatchTable({
  summaries,
  onOpenBatch,
}: {
  summaries: EventDispatchSummary[]
  onOpenBatch: (eventId: string, batchId: string) => void
}) {
  const rows = summaries.flatMap((summary) => summary.batches.map((batch) => ({ summary, batch })))

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No dispatches available</p>
  }

  const dispatchCount = rows.length
  const inTransitCount = rows.filter(({ batch }) => batch.stage === 'In Transit').length
  const attentionCount = rows.filter(({ batch }) => batch.reconciliation.some((row) => row.status === 'Pahabol' || row.status === 'Short') || batch.crew.length === 0).length

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3">
        <div><p className="text-[0.56rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Dispatch Overview</p><p className="mt-0.5 text-sm font-semibold text-card-foreground">{dispatchCount} dispatch{dispatchCount === 1 ? '' : 'es'}</p></div>
        <div><p className="text-[0.56rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">In Transit</p><p className="mt-0.5 text-sm font-semibold text-card-foreground">{inTransitCount}</p></div>
        <div><p className="text-[0.56rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Attention</p><p className="mt-0.5 text-sm font-semibold text-card-foreground">{attentionCount}</p></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Event', 'Vehicle', 'Direction', 'Crew', 'Dispatch Status', 'Reconciliation'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-[0.56rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <Fragment key={summary.eventId}>
                <tr className="border-t border-border bg-muted/20">
                  <td colSpan={6} className="px-5 py-3">
                    <p className="text-sm font-semibold text-card-foreground">{summary.eventTitle}</p>
                    <p className="text-[0.62rem] text-muted-foreground">{summary.venue}</p>
                  </td>
                </tr>
                {summary.batches.map((batch) => {
                  const hasAdditionalDelivery = batch.reconciliation.some((row) => row.status === 'Pahabol' || row.status === 'Short')
                  return (
                    <tr
                      key={batch.id}
                      onClick={() => onOpenBatch(summary.eventId, batch.id)}
                      className="cursor-pointer border-t border-border/60 align-middle transition hover:bg-muted/40"
                    >
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">Dispatch batch</td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-card-foreground">{batch.vehicleType}</p>
                        <p className="text-[0.6rem] uppercase tracking-[0.06em] text-muted-foreground">{batch.plateNumber}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-card-foreground">
                          {batch.direction === 'outbound' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                          {batch.direction === 'outbound' ? 'Outbound' : 'Return'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {batch.crew.length === 0 ? <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[0.6rem] font-medium text-amber-700 dark:text-amber-300">Unassigned</span> : batch.crew.slice(0, 3).map((member) => <Avatar key={member.id} name={member.name} />)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <DispatchStepper direction={batch.direction} stage={batch.stage} stalled={batch.stalled} />
                      </td>
                      <td className="px-5 py-3.5">
                        {hasAdditionalDelivery ? <Pill tone="critical">Additional Delivery</Pill> : <Pill tone="positive">Matched</Pill>}
                      </td>
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NewBatchModal({
  eventId,
  direction,
  onClose,
}: {
  eventId: string
  direction: BatchDirection
  onClose: () => void
}) {
  const { events, staff, procurement } = usePortal()
  const event = events.find((e) => e.id === eventId)
  const batchStore = useDispatchStore(events, staff, procurement)
  const existingBatches = batchStore.get(eventId) ?? []

  const [vehicleType, setVehicleType] = useState('Box Truck (14ft)')
  const [plateNumber, setPlateNumber] = useState('NBC 1234')
  const [driverName, setDriverName] = useState('')

  // Event Master Inventory Items
  const masterItems = useMemo(() => {
    if (!event) return []
    return getEventDetailSnapshot(event, staff, procurement).items
  }, [event, staff, procurement])

  // Deduplication: Calculate open/committed quantities across active outbound batches for this event
  const itemAvailabilityMap = useMemo(() => {
    const map = new Map<string, number>()
    masterItems.forEach((item) => map.set(item.name, item.quantity))

    if (direction === 'outbound') {
      const openOutboundBatches = existingBatches.filter(
        (b) => b.direction === 'outbound' && b.stage !== 'Delivered' && b.stage !== 'Returned',
      )
      openOutboundBatches.forEach((b) => {
        b.reconciliation.forEach((r) => {
          const current = map.get(r.itemName) ?? 0
          map.set(r.itemName, Math.max(0, current - r.planned))
        })
      })
    }
    return map
  }, [masterItems, existingBatches, direction])

  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})

  const toggleItem = (name: string, available: number) => {
    setSelectedQuantities((prev) => {
      const next = { ...prev }
      if (next[name] !== undefined) {
        delete next[name]
      } else {
        next[name] = Math.min(available, Math.max(1, available))
      }
      return next
    })
  }

  const updateQuantity = (name: string, qty: number, available: number) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [name]: Math.min(available, Math.max(1, qty)),
    }))
  }

  const handleCreate = () => {
    const itemsToAssign = Object.entries(selectedQuantities).map(([itemName, planned]) => ({
      itemName,
      planned,
    }))

    addNewCustomBatch(eventId, direction, vehicleType, plateNumber, driverName, itemsToAssign)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-[44rem] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl space-y-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div>
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-primary">
              Dispatch &amp; Logistics
            </span>
            <h2 className="font-serif text-xl font-bold text-card-foreground">
              New {direction === 'outbound' ? 'Outbound (Egress)' : 'Return (Ingress)'} Batch
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Target Event: {event?.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Vehicle & Driver Info Form */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground">Vehicle Type</span>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="Vehicle type..."
                className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground">Plate Number</span>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="Plate number..."
                className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground">Driver Name</span>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Assigned driver..."
                className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>

          {/* Asset Selection with Active Open Batch Deduplication */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Select Event Assets to Allocate
              </h3>
              <span className="text-[0.6rem] text-muted-foreground">
                {Object.keys(selectedQuantities).length} assets selected
              </span>
            </div>

            <div className="rounded-lg border border-border bg-background p-3 space-y-2 max-h-56 overflow-y-auto">
              {masterItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No allocated master items found for this event.</p>
              ) : (
                masterItems.map((item) => {
                  const available = itemAvailabilityMap.get(item.name) ?? 0
                  const isSelected = selectedQuantities[item.name] !== undefined
                  const isFullyReserved = available <= 0

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between rounded-md border p-2.5 text-xs transition',
                        isFullyReserved
                          ? 'border-border bg-muted/40 opacity-60'
                          : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card',
                      )}
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isFullyReserved}
                          onChange={() => toggleItem(item.name, available)}
                          className="size-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[0.6rem] text-muted-foreground">
                            Event Total: {item.quantity} · Available: <span className="font-bold text-primary">{available}</span>
                          </p>
                        </div>
                      </label>

                      {isFullyReserved ? (
                        <span className="rounded bg-muted px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                          Reserved in Open Batch
                        </span>
                      ) : isSelected ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[0.58rem] font-bold uppercase text-muted-foreground">Load Qty:</span>
                          <input
                            type="number"
                            min={1}
                            max={available}
                            value={selectedQuantities[item.name]}
                            onChange={(e) => updateQuantity(item.name, Number(e.target.value) || 1, available)}
                            className="w-16 rounded border border-input bg-background px-2 py-1 text-xs text-foreground font-bold outline-none focus:border-primary"
                          />
                        </div>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-sm hover:opacity-90"
          >
            Create Batch ({Object.keys(selectedQuantities).length} Assets)
          </button>
        </div>
      </div>
    </div>
  )
}
