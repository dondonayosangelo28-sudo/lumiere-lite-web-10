import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { WarehouseTopBar } from '@/components/warehouse/WarehouseTopBar'
import { usePortal } from '@/lib/store'
import { getDeficitLines, lineCost, type DeficitLine } from '@/lib/warehouse-replenishment'
import { createDeficitItemApi, fetchDeficitQueueApi, updateDeficitStatusApi } from '@/lib/deficitApi'
import { DeficitTable } from '@/components/warehouse/replenishment/DeficitTable'
import { GeneratePOModal } from '@/components/warehouse/replenishment/GeneratePOModal'
import { AddMasterItemModal, type MasterItemDraft } from '@/components/warehouse/replenishment/AddMasterItemModal'
import { BulkGenerateFlow } from '@/components/warehouse/replenishment/BulkGenerateFlow'
import { cn } from '@/lib/utils'
import { exportReplenishmentDeficitPdf } from '@/lib/pdf-exporter'

type ViewMode = 'grouped' | 'consolidated' | 'draft'

const PREVIEW_LIMIT = 8

interface ReplenishmentModuleProps {
  onClose: () => void
}

export function ReplenishmentModule({ onClose }: ReplenishmentModuleProps) {
  const { events } = usePortal()
  const [lines, setLines] = useState<DeficitLine[]>(() => getDeficitLines(events))
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [query, setQuery] = useState('')
  const [poLine, setPoLine] = useState<DeficitLine | null>(null)
  const [editLine, setEditLine] = useState<DeficitLine | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addPresetEvent, setAddPresetEvent] = useState<{ id: string; title: string } | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    let active = true
    fetchDeficitQueueApi().then((items) => {
      if (!active || !items.length) return
      const mapped: DeficitLine[] = items.map((item) => ({
        id: item.id,
        eventId: item.eventId || undefined,
        eventTitle: item.eventName || undefined,
        itemName: item.itemName,
        category: (item.itemCategory as any) || 'General',
        unit: 'pcs',
        triggerSource: 'Auto-Threshold',
        currentStock: 0,
        threshold: item.quantityNeeded,
        costPerUnit: 100,
        priority: (item.urgencyLevel as any) || 'Medium',
        status: (item.status as any) || 'Not Purchased',
        primaryVendorId: '',
        quantityNeeded: item.quantityNeeded,
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

  const handleGeneratePO = async (id: string, quantity: number, vendorId: string) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, status: 'In Procurement', quantityNeeded: quantity, primaryVendorId: vendorId } : line)),
    )
    setPoLine(null)
    await updateDeficitStatusApi(id, 'In Procurement')
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

  const openCandidates = lines.filter((line) => line.status === 'Not Purchased')

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <WarehouseTopBar />
<div className="flex flex-col gap-4 border-b border-border px-6 pb-5 pt-7 sm:px-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-primary">Warehouse module</p>
              <h1 className="mt-1 pb-1 font-serif text-4xl font-medium leading-tight text-foreground">Replenishment / Deficits</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Automated deficit detection, inventory replenishment alerts, and purchase order drafting.
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-2">
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

          <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2">
            <div className="relative h-10">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items or events…"
                className="h-10 w-44 rounded-md border border-input bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
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
              Draft Master PO ({openCandidates.length})
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 sm:px-10">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Open deficits', lines.filter((line) => line.status !== 'Received').length, 'bg-destructive'],
            ['Critical', lines.filter((line) => line.priority === 'Critical').length, 'bg-destructive'],
            ['High priority', lines.filter((line) => line.priority === 'High').length, 'bg-amber-500'],
            ['PO candidates', openCandidates.length, 'bg-primary'],
          ].map(([label, value, dot]) => (
            <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={cn('size-1.5 rounded-full', dot)} />
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
              </div>
              <p className="mt-2 text-xl font-semibold text-card-foreground">{value}</p>
            </div>
          ))}
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
                  Draft Master PO ({openCandidates.length})
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
                      <span className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary">
                        {expanded ? 'Hide details' : 'Review'}
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
                  className="border-t border-border px-5 py-3 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary"
                >
                  {expandedEvents.has('general') ? 'Hide details' : 'Review'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {poLine && <GeneratePOModal line={poLine} onClose={() => setPoLine(null)} onGenerate={handleGeneratePO} />}
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
