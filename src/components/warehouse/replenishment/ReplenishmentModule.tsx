import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react'
import { WarehouseTopBar } from '@/components/warehouse/WarehouseTopBar'
import { usePortal } from '@/lib/store'
import { deriveDeficitStatus, getDeficitLines, lineCost, type DeficitLine } from '@/lib/warehouse-replenishment'
import { createDeficitItemApi, fetchDeficitQueueApi, recordDeficitReceiptApi, updateDeficitStatusApi } from '@/lib/deficitApi'
import { DeficitTable } from '@/components/warehouse/replenishment/DeficitTable'
import { GeneratePOModal } from '@/components/warehouse/replenishment/GeneratePOModal'
import { AddMasterItemModal, type MasterItemDraft } from '@/components/warehouse/replenishment/AddMasterItemModal'
import { BulkGenerateFlow } from '@/components/warehouse/replenishment/BulkGenerateFlow'
import { RecordReceiptModal } from '@/components/warehouse/replenishment/RecordReceiptModal'
import { cn } from '@/lib/utils'
import { exportReplenishmentDeficitPdf } from '@/lib/pdf-exporter'

type ViewMode = 'grouped' | 'consolidated' | 'draft'
type SummaryFilter = 'open' | 'critical' | 'high' | 'po'

const PREVIEW_LIMIT = 8

const SUMMARY_FILTERS: Array<{ id: SummaryFilter; label: string; dot: string }> = [
  { id: 'open', label: 'Open deficits', dot: 'bg-destructive' },
  { id: 'critical', label: 'Critical', dot: 'bg-destructive' },
  { id: 'high', label: 'High priority', dot: 'bg-amber-500' },
  { id: 'po', label: 'Order candidates', dot: 'bg-primary' },
]

interface ReplenishmentModuleProps {
  onClose: () => void
}

export function ReplenishmentModule({ onClose }: ReplenishmentModuleProps) {
  const { events } = usePortal()
  const [lines, setLines] = useState<DeficitLine[]>(() => getDeficitLines(events))
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [query, setQuery] = useState('')
  const [poLine, setPoLine] = useState<DeficitLine | null>(null)
  const [receiptLine, setReceiptLine] = useState<DeficitLine | null>(null)
  const [editLine, setEditLine] = useState<DeficitLine | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addPresetEvent, setAddPresetEvent] = useState<{ id: string; title: string } | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter | null>(null)

  useEffect(() => {
    let active = true
    fetchDeficitQueueApi().then((items) => {
      if (!active || !items.length) return
      const mapped: DeficitLine[] = items.map((item) => ({
        id: item.id,
        eventId: item.eventId || undefined,
        eventTitle: undefined,
        itemName: item.assetDescription || 'Unnamed asset',
        category: item.category || 'General',
        unit: item.unit || 'pcs',
        triggerSource: (item.triggerSource as DeficitLine['triggerSource']) || 'Auto-Threshold',
        currentStock: item.currentStock ?? 0,
        threshold: item.threshold ?? item.quantityNeeded,
        costPerUnit: item.costPerUnit ?? 0,
        priority: (item.priority as DeficitLine['priority']) || 'Medium',
        status: (item.status as DeficitLine['status']) || 'Not Purchased',
        primaryVendorId: '',
        quantityNeeded: item.quantityNeeded,
        orderedQuantity: item.quantityNeeded,
        receivedQuantity: 0,
        receipts: [],
      }))
      setLines((prev) => {
        const existingIds = new Set(prev.map((l) => l.id))
        const newOnly = mapped.filter((m) => !existingIds.has(m.id))
        return [...newOnly, ...prev]
      })
    })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return lines
    return lines.filter(
      (line) =>
        line.itemName.toLowerCase().includes(q) ||
        (line.eventTitle ?? 'general stockroom').toLowerCase().includes(q),
    )
  }, [lines, query])

  const openCandidates = lines.filter((line) => line.status === 'Not Purchased')

  const summaryLines = useMemo(() => {
    if (!summaryFilter) return []
    const base = summaryFilter === 'open'
      ? lines.filter((line) => line.status !== 'Received')
      : summaryFilter === 'critical'
        ? lines.filter((line) => line.priority === 'Critical')
        : summaryFilter === 'high'
          ? lines.filter((line) => line.priority === 'High')
          : openCandidates
    const q = query.trim().toLowerCase()
    return q ? base.filter((line) => `${line.itemName} ${line.eventTitle ?? ''} ${line.category}`.toLowerCase().includes(q)) : base
  }, [lines, openCandidates, query, summaryFilter])

  const grouped = useMemo(() => {
    const withEvent = filtered.filter((line) => line.eventId)
    const groups = new Map<string, { title: string; lines: DeficitLine[] }>()
    withEvent.forEach((line) => {
      if (!line.eventId || !line.eventTitle) return
      const existing = groups.get(line.eventId)
      if (existing) existing.lines.push(line)
      else groups.set(line.eventId, { title: line.eventTitle, lines: [line] })
    })
    const general = filtered.filter((line) => !line.eventId)
    return { groups: [...groups.entries()], general }
  }, [filtered])

  const handleGeneratePO = async (id: string, quantity: number, vendorId: string | null) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, status: 'In Procurement', quantityNeeded: quantity, primaryVendorId: vendorId } : line)),
    )
    setPoLine(null)
    await updateDeficitStatusApi(id, 'In Procurement')
  }

  const handleRecordReceipt = async (quantity: number, receivedDate: string, notes: string) => {
    if (!receiptLine) return
    if (!receiptLine.id || receiptLine.id.startsWith('def-')) {
      throw new Error('This item is not connected to a live receiving record.')
    }
    const result = await recordDeficitReceiptApi(receiptLine.id, { quantity, receivedDate, notes: notes || undefined, poRef: receiptLine.poRef })
    setLines((prev) => prev.map((line) => line.id === receiptLine.id ? { ...line, receivedQuantity: result.totalReceived, status: (result.status as DeficitLine['status']) || deriveDeficitStatus(line.orderedQuantity ?? 0, result.totalReceived), quantityNeeded: result.remainingToReceive, receipts: [...(line.receipts ?? []), { id: result.id, quantity, receivedDate, notes: notes || undefined, recordedBy: result.recordedBy ?? 'Warehouse', poRef: result.poRef ?? line.poRef }] } : line))
    setReceiptLine(null)
  }

  const handleSaveEdit = (draft: MasterItemDraft) => {
    if (!editLine) return
    setLines((prev) =>
      prev.map((line) =>
        line.id === editLine.id
          ? {
              ...line,
              itemName: draft.itemName,
              category: draft.category,
              unit: draft.unit,
              currentStock: draft.currentStock,
              threshold: draft.threshold,
              costPerUnit: draft.costPerUnit,
              priority: draft.priority,
              triggerSource: draft.triggerSource,
              primaryVendorId: draft.primaryVendorId,
            }
          : line,
      ),
    )
    setEditLine(null)
  }

  const handleAddMasterItem = async (draft: MasterItemDraft) => {
    const needed = Math.max(1, draft.threshold - draft.currentStock)
    const res = await createDeficitItemApi({
      eventId: draft.eventId,
      itemCategory: draft.category,
      itemName: draft.itemName,
      quantityNeeded: needed,
      urgencyLevel: draft.priority,
    })

    const newLine: DeficitLine = {
      id: res?.id || `def-master-${Date.now()}`,
      eventId: draft.eventId,
      eventTitle: draft.eventTitle,
      itemName: draft.itemName,
      category: draft.category,
      unit: draft.unit,
      triggerSource: draft.triggerSource,
      currentStock: draft.currentStock,
      threshold: draft.threshold,
      costPerUnit: draft.costPerUnit,
      priority: draft.priority,
      status: 'Not Purchased',
      primaryVendorId: draft.primaryVendorId,
      quantityNeeded: needed,
    }
    setLines((prev) => [newLine, ...prev])
    setAddOpen(false)
    setAddPresetEvent(null)
  }

  const handleRemove = (id: string) => setLines((prev) => prev.filter((line) => line.id !== id))

  const handleTagForDispatch = (id: string) =>
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, taggedForDispatch: !line.taggedForDispatch } : line)))

  const handleBulkConfirm = (ids: string[]) => {
    setLines((prev) => prev.map((line) => (ids.includes(line.id) ? { ...line, status: 'In Procurement' } : line)))
    setBulkOpen(false)
    setSelectedIds(new Set())
  }

  const exportReport = () => {
    exportReplenishmentDeficitPdf(filtered)
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <WarehouseTopBar />
<div className="flex flex-col gap-4 border-b border-border px-6 pb-5 pt-7 sm:px-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-primary">Warehouse module</p>
              <h1 className="mt-1 pb-1 font-serif text-4xl font-medium leading-tight text-foreground">Replenishment / Deficits</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Automated deficit detection, inventory replenishment alerts, and order preparation.
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-2">
          <div className="flex shrink-0 rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.05em] transition',
                viewMode === 'grouped'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Event-Bound Deficits ({events.length} Events)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('consolidated')}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.05em] transition',
                viewMode === 'consolidated'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              Consolidated Register ({lines.length} Lines)
            </button>
          </div>

          <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 lg:ml-auto lg:flex-wrap">
            <div className="relative h-10">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items or events…"
                className="h-10 w-44 md:w-72 rounded-md border border-input bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-md border border-border bg-background px-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition hover:bg-accent"
            >
              Add Item
            </button>
            <button
              type="button"
              onClick={exportReport}
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-md border border-border bg-background px-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition hover:bg-accent"
            >
              <Download className="size-3.5" />
              Export Report (PDF)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('draft')}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-md bg-primary px-2.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-primary-foreground transition hover:opacity-90"
            >
              Prepare Order ({openCandidates.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 sm:px-10">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SUMMARY_FILTERS.map(({ id, label, dot }) => {
            const value = id === 'open'
              ? lines.filter((line) => line.status !== 'Received').length
              : id === 'critical'
                ? lines.filter((line) => line.priority === 'Critical').length
                : id === 'high'
                  ? lines.filter((line) => line.priority === 'High').length
                  : openCandidates.length
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setQuery('')
                  setSummaryFilter(id)
                }}
                className="group rounded-lg border border-border bg-card px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-accent/50 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`View ${label}`}
              >
                <span className="flex items-center gap-2">
                  <span className={cn('size-1.5 rounded-full', dot)} />
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
                  <span className="ml-auto text-primary opacity-0 transition-opacity group-hover:opacity-100">→</span>
                </span>
                <span className="mt-2 block text-xl font-semibold text-card-foreground">{value}</span>
              </button>
            )
          })}
        </div>

        {viewMode === 'consolidated' ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-lg font-medium text-card-foreground">Consolidated Register</h2>
                <p className="text-xs text-muted-foreground">All inventory items requiring attention across the operation.</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {filtered.length} items
              </span>
            </div>
            <DeficitTable
              lines={filtered}
              selectedIds={selectedIds}
              onRowClick={setPoLine}
              onEdit={setEditLine}
              onRemove={handleRemove}
              onTagForDispatch={handleTagForDispatch}
              onRecordReceipt={setReceiptLine}
            />
          </div>
        ) : viewMode === 'draft' ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-serif text-lg font-medium text-card-foreground">Draft Purchase Orders</h2>
                <p className="text-xs text-muted-foreground">Review deficit candidates before sending them into purchasing.</p>
              </div>
              {openCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBulkOpen(true)}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-primary-foreground transition hover:opacity-90"
                >
                  Prepare Order ({openCandidates.length})
                </button>
              )}
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {openCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open deficit lines are waiting for purchasing.</p>
              ) : (
                openCandidates.map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => setPoLine(line)}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-accent/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-sm font-medium text-card-foreground">{line.itemName}</span>
                      <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.08em] text-muted-foreground">
                        {line.eventTitle ?? 'General stockroom'} · {line.quantityNeeded} {line.unit}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-card-foreground">₱{lineCost(line).toLocaleString()}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.groups.length === 0 && grouped.general.length === 0 && (
              <p className="text-sm text-muted-foreground">No deficit lines match the current search.</p>
            )}
            {grouped.groups.map(([eventId, group]) => {
              const activeLines = group.lines.filter((line) => line.status !== 'Received')
              const criticalCount = group.lines.filter((line) => line.priority === 'Critical').length
              const highCount = group.lines.filter((line) => line.priority === 'High').length
              const totalCost = activeLines.reduce((sum, line) => sum + lineCost(line), 0)
              const expanded = expandedEvents.has(eventId)
              return (
                <div key={eventId} className="overflow-hidden rounded-xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setExpandedEvents((current) => {
                      const next = new Set(current)
                      if (next.has(eventId)) next.delete(eventId)
                      else next.add(eventId)
                      return next
                    })}
                    className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
                    aria-expanded={expanded}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-lg font-medium text-card-foreground">{group.title}</span>
                      <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.08em] text-muted-foreground">
                        {group.lines.length} deficit item{group.lines.length === 1 ? '' : 's'} · {criticalCount} Critical · {highCount} High
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-4 sm:text-right">
                      <span>
                        <span className="block text-[0.56rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Active deficit</span>
                        <span className="block text-sm font-semibold text-card-foreground">₱{totalCost.toLocaleString()}</span>
                      </span>
                      <span className="inline-flex size-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/15">
                        {expanded ? <ChevronUp aria-hidden="true" className="size-4" /> : <ChevronDown aria-hidden="true" className="size-4" />}
                      </span>
                    </span>
                  </button>
                  {expanded && (
                    <div className="border-t border-border">
                      <DeficitTable
                        lines={group.lines}
                        selectedIds={selectedIds}
                        onRowClick={setPoLine}
                        onEdit={setEditLine}
                        onRemove={handleRemove}
                        onTagForDispatch={handleTagForDispatch}
                        onRecordReceipt={setReceiptLine}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {grouped.general.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-dashed border-border bg-card">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h2 className="font-serif text-lg font-medium text-card-foreground">General Stockroom</h2>
                    <p className="text-xs text-muted-foreground">Not tied to a specific event.</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{grouped.general.length} items</span>
                </div>
                {expandedEvents.has('general') && (
                  <div className="border-t border-border">
                    <DeficitTable
                      lines={grouped.general}
                      selectedIds={selectedIds}
                      onRowClick={setPoLine}
                      onEdit={setEditLine}
                      onRemove={handleRemove}
                      onTagForDispatch={handleTagForDispatch}
                      onRecordReceipt={setReceiptLine}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedEvents((current) => {
                    const next = new Set(current)
                    if (next.has('general')) next.delete('general')
                    else next.add('general')
                    return next
                  })}
                  className="flex w-full items-center justify-end border-t border-border px-5 py-3 text-primary"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 transition-colors hover:bg-primary/15">
                    {expandedEvents.has('general') ? <ChevronUp aria-hidden="true" className="size-4" /> : <ChevronDown aria-hidden="true" className="size-4" />}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {summaryFilter && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/65 backdrop-blur-sm max-md:h-[100dvh] max-md:bg-black/40 max-md:backdrop-blur-none max-md:p-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSummaryFilter(null) }}>
          <aside
            className="flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-detail-title"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-primary">Deficit details</p>
                <h2 id="summary-detail-title" className="mt-1 font-serif text-2xl font-medium text-card-foreground">
                  {SUMMARY_FILTERS.find((filter) => filter.id === summaryFilter)?.label}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{summaryLines.length} matching record{summaryLines.length === 1 ? '' : 's'}</p>
              </div>
              <button type="button" onClick={() => setSummaryFilter(null)} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Close deficit details">
                Close
              </button>
            </header>
            <div className="border-b border-border px-6 py-4">
              <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                <Search className="size-4 text-muted-foreground" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deficits..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search filtered deficits" />
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex flex-col gap-2">
                {summaryLines.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No records match this filter.</p>
                ) : summaryLines.map((line) => (
                  <button key={line.id} type="button" onClick={() => setPoLine(line)} className="rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="flex items-start justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block truncate font-serif text-sm font-medium text-card-foreground">{line.itemName}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">{line.eventTitle ?? 'General stockroom'} · {line.category}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{line.priority}</span>
                    </span>
                    <span className="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <span><span className="block text-muted-foreground">Deficit</span><span className="font-semibold text-card-foreground">{line.quantityNeeded} {line.unit}</span></span>
                      <span><span className="block text-muted-foreground">Stock</span><span className="font-semibold text-card-foreground">{line.currentStock}</span></span>
                      <span><span className="block text-muted-foreground">Status</span><span className="font-semibold text-card-foreground">{line.status}</span></span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
      {poLine && <GeneratePOModal line={poLine} onClose={() => setPoLine(null)} onGenerate={handleGeneratePO} />}
      {receiptLine && <RecordReceiptModal line={receiptLine} onClose={() => setReceiptLine(null)} onConfirm={handleRecordReceipt} />}
      {editLine && <AddMasterItemModal initial={editLine} onClose={() => setEditLine(null)} onSave={handleSaveEdit} />}
      {addOpen && (
        <AddMasterItemModal
          presetEvent={addPresetEvent ?? undefined}
          onClose={() => {
            setAddOpen(false)
            setAddPresetEvent(null)
          }}
          onSave={handleAddMasterItem}
        />
      )}
      {bulkOpen && (
        <BulkGenerateFlow candidates={openCandidates} onClose={() => setBulkOpen(false)} onConfirm={handleBulkConfirm} />
      )}
    </div>
  )
}
