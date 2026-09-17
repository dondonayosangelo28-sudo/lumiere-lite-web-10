import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search, Package, Layers, Tag, Sparkles, ChevronRight,
  AlertTriangle, ShoppingCart, ArrowRight, RotateCcw, X,
  Boxes, CheckCircle2, Loader2, Info,
} from 'lucide-react'
import { ExecutiveShell } from '@/components/executive/ExecutiveShell'
import { EmptyState } from '@/components/EmptyState'
import { cn } from '@/lib/utils'
import { fetchAssetsApi } from '@/lib/assetKioskApi'
import type { AssetResponse, AssetFilterParams } from '@/lib/assetKioskApi'
import { createDeficitItemApi } from '@/lib/deficitApi'
import type { ExecutiveDestinationId } from '@/lib/executive-destinations'
import { useNav } from '@/lib/nav'
import { usePortal } from '@/lib/store'
import type { PortalEvent } from '@/lib/types'

/* ---- Tier label helpers ---- */
const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — Essentials',
  2: 'Tier 2 — Standard',
  3: 'Tier 3 — Premium',
  4: 'Tier 4 — Signature',
  5: 'Tier 5 — Bespoke',
}

const TIER_BADGE: Record<number, string> = {
  1: 'bg-muted text-muted-foreground border-border',
  2: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  3: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
  4: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  5: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
}

const STATE_BADGE: Record<string, string> = {
  Available:     'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Reserved:      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  InMaintenance: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
}

/* ---- Procurement step modal ---- */
type ProcureStep = 'quantity' | 'method' | 'confirming' | 'done'

interface ProcureModalProps {
  asset: AssetResponse | null
  events: PortalEvent[]
  onClose: () => void
}

function ProcureModal({ asset, events, onClose }: ProcureModalProps) {
  const [step, setStep] = useState<ProcureStep>('quantity')
  const [qty, setQty] = useState(1)
  const [method, setMethod] = useState<'procure' | 'crossdock' | null>(null)
  const [eventId, setEventId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = useCallback(async () => {
    if (!asset || method !== 'procure') return
    if (!eventId) {
      setError('Select the event this deficit is for.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const result = await createDeficitItemApi({ eventId, assetId: asset.id, quantityNeeded: qty })
      if (!result) throw new Error('POST /api/deficit-queue failed')
      setStep('done')
    } catch {
      setError('Failed to create deficit request. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }, [asset, method, qty, eventId])

  if (!asset) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-4 text-primary" />
            <span className="text-sm font-bold text-card-foreground">
              {step === 'done' ? 'Request Submitted' : 'Allocate Asset'}
            </span>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Asset identity row */}
          {step !== 'done' && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
              {asset.thumbnailUrl ? (
                <img src={asset.thumbnailUrl} alt={asset.name}
                  className="size-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Boxes className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-card-foreground">{asset.name}</p>
                <p className="text-[0.65rem] text-muted-foreground">{asset.subTypeName || 'Unclassified'} &middot; T{asset.assetTier}</p>
              </div>
            </div>
          )}

          {/* Step 1 — Quantity */}
          {step === 'quantity' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Quantity to Allocate
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted text-base font-bold"
                >−</button>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 rounded-lg border border-input bg-background py-2 text-center text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted text-base font-bold"
                >+</button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Stock on hand: <span className="font-semibold text-foreground">{asset.quantity}</span>
                {qty > asset.quantity && (
                  <span className="ml-2 text-amber-600 font-semibold">⚠ Exceeds available stock</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setStep('method')}
                className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Next <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Method */}
          {step === 'method' && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Allocation Method
              </p>
              <div className="space-y-3">
                {/* Procure */}
                <button
                  type="button"
                  onClick={() => setMethod('procure')}
                  className={cn(
                    'w-full rounded-xl border-2 p-4 text-left transition',
                    method === 'procure'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex size-5 items-center justify-center rounded-full border-2',
                      method === 'procure' ? 'border-primary bg-primary' : 'border-border',
                    )}>
                      {method === 'procure' && <span className="size-2.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-semibold text-card-foreground">Procure</span>
                  </div>
                  <p className="mt-1.5 ml-7 text-xs text-muted-foreground">
                    Flag a deficit request via POST /api/deficit-queue. The warehouse ops manager resolves it through the vendor flow.
                  </p>
                  {method === 'procure' && (
                    <div className="mt-3 ml-7">
                      <label className="block text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Event
                      </label>
                      <select
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                      >
                        <option value="">Select event...</option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </button>

                {/* Crossdock — blocked */}
                <div className="relative w-full rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 opacity-70">
                  <div className="flex items-center gap-2">
                    <div className="flex size-5 items-center justify-center rounded-full border-2 border-border" />
                    <span className="text-sm font-semibold text-muted-foreground">Crossdock</span>
                    <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-amber-700">Blocked</span>
                  </div>
                  <p className="mt-1.5 ml-7 text-xs text-muted-foreground">
                    No confirmed endpoint in VendorAssetController.cs or DispatchDTOs.cs yet.
                    See Production SHALL §6 in 04-asset-allocation-kiosk.md.
                  </p>
                  <div className="mt-2 ml-7 flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                    <AlertTriangle className="size-3 shrink-0 text-amber-600 mt-0.5" />
                    <span className="text-[0.6rem] text-amber-700">
                      Not yet buildable — VendorAssetController.cs audit pending.
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-700">{error}</p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('quantity')}
                  className="flex-1 rounded-lg border border-border py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:bg-muted"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!method || method !== 'procure' || !eventId || submitting}
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Confirm Procure
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-card-foreground">Deficit request submitted</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{qty}× {asset.name}</span> flagged for procurement via deficit queue.
                  The warehouse ops manager will resolve via vendor flow.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- Category sidebar item ---- */
const ALL_CATEGORY = '__all__'

/* ---- Main page ---- */
export function AssetAllocationKioskPage() {
  const { navigate } = useNav()
  const destination = (id: ExecutiveDestinationId) => navigate(id)
  const { events } = usePortal()

  // Data state
  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  // Sidebar / filter state
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY)
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<number | null>(null)

  // Kiosk action modal
  const [selectedAsset, setSelectedAsset] = useState<AssetResponse | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const params: AssetFilterParams = {}
      if (activeCategory !== ALL_CATEGORY) params.assetTypeId = activeCategory
      if (query.trim()) params.tagValue = query.trim()
      if (tierFilter != null) params.tier = tierFilter
      const data = await fetchAssetsApi(params)
      setAssets(data)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [activeCategory, query, tierFilter])

  useEffect(() => { load() }, [load])

  // Derive sidebar categories from loaded assets
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>()
    for (const a of assets) {
      const id = a.assetSubTypeId
      const label = a.subTypeName || 'Unclassified'
      const existing = map.get(id)
      if (existing) existing.count++
      else map.set(id, { id, label, count: 1 })
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [assets])

  // Client-side filter (fallback to query already passed to API, but also
  // filter in-memory by state as not all params may be server-filtered)
  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assets.filter((a) => {
      if (activeCategory !== ALL_CATEGORY && a.assetSubTypeId !== activeCategory) return false
      if (tierFilter != null && a.assetTier !== tierFilter) return false
      if (q) {
        const matchName = a.name.toLowerCase().includes(q)
        const matchTags = a.tags.some((t) => t.toLowerCase().includes(q))
        const matchSub  = (a.subTypeName || '').toLowerCase().includes(q)
        if (!matchName && !matchTags && !matchSub) return false
      }
      return true
    })
  }, [assets, activeCategory, tierFilter, query])

  const stickyHeader = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3" />
            Asset Kiosk
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Asset Allocation
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Browse, search, and allocate assets by classification. Quantity assignment routes to the deficit queue.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:w-72">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, tag, classification..."
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] font-bold text-muted-foreground hover:text-foreground">✕</button>
          )}
        </div>
        {(query || tierFilter != null || activeCategory !== ALL_CATEGORY) && (
          <button
            type="button"
            onClick={() => { setQuery(''); setTierFilter(null); setActiveCategory(ALL_CATEGORY) }}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <ExecutiveShell activeId="assets" onSelect={destination} stickyHeader={stickyHeader}>
        {/* Blocked crossdock notice */}
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Step 2 — Crossdock branch is blocked.</span>{' '}
            VendorAssetController.cs and DispatchDTOs.cs have not been audited yet. Only the Procure branch
            (POST /api/deficit-queue) is wired. See Production SHALL §6 in 04-asset-allocation-kiosk.md.
          </div>
        </div>

        {/* Tier filter strip */}
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTierFilter(null)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] transition',
              tierFilter === null
                ? 'bg-neutral-900 text-white'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted',
            )}
          >All Tiers</button>
          {[1, 2, 3, 4, 5].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(tierFilter === t ? null : t)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] transition border',
                tierFilter === t
                  ? 'bg-neutral-900 text-white border-transparent'
                  : cn(TIER_BADGE[t], 'hover:opacity-80'),
              )}
            >T{t}</button>
          ))}
        </div>

        {/* Two-pane kiosk layout */}
        <div className="flex gap-5 min-h-[60vh]">
          {/* ---- Left sidebar 20% — category list ---- */}
          <aside className="w-1/5 shrink-0 space-y-1">
            <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Classifications
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory(ALL_CATEGORY)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition',
                activeCategory === ALL_CATEGORY
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-card-foreground hover:bg-muted',
              )}
            >
              <span className="flex items-center gap-2">
                <Layers className="size-3.5 shrink-0" /> All
              </span>
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold',
                activeCategory === ALL_CATEGORY ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
              )}>{assets.length}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id === activeCategory ? ALL_CATEGORY : cat.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition',
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-card-foreground hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Package className="size-3.5 shrink-0" />
                  <span className="truncate">{cat.label}</span>
                </span>
                <span className={cn(
                  'shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold',
                  activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                )}>{cat.count}</span>
              </button>
            ))}

            {!isLoading && categories.length === 0 && (
              <p className="px-3 text-[0.65rem] text-muted-foreground italic">No classifications loaded.</p>
            )}
          </aside>

          {/* ---- Right pane 80% — thumbnail grid ---- */}
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <AlertTriangle className="size-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-semibold text-card-foreground">Could not load assets</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    GET /api/assets returned an error. Check that VITE_API_URL is set and the API is reachable.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={load}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Retry
                </button>
              </div>
            ) : displayed.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8">
                <EmptyState
                  title="No assets found"
                  message="No assets match the current filters. Try adjusting the category, tier, or search query."
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {displayed.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    data-testid={`asset-card-${asset.id}`}
                    onClick={() => setSelectedAsset(asset)}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg text-left"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square w-full overflow-hidden bg-muted/40">
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                          <Boxes className="size-10 text-muted-foreground/40" />
                          {/* Color swatches from palette */}
                          {asset.colors.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {asset.colors.slice(0, 5).map((c, i) => (
                                <span
                                  key={i}
                                  className="size-3 rounded-full border border-border"
                                  style={{ background: c.hex }}
                                  title={c.brand || c.hex}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer info */}
                    <div className="p-3">
                      <p className="truncate text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {asset.name}
                      </p>
                      <p className="mt-0.5 truncate text-[0.62rem] text-muted-foreground">
                        {asset.subTypeName || 'Unclassified'}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <span className={cn(
                          'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider',
                          TIER_BADGE[asset.assetTier] || 'bg-muted text-muted-foreground border-border',
                        )}>T{asset.assetTier}</span>

                        <span className={cn(
                          'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider',
                          STATE_BADGE[asset.assetState] || 'bg-muted text-muted-foreground border-border',
                        )}>{asset.assetState}</span>

                        <span className="ml-auto text-[0.62rem] font-bold text-muted-foreground">
                          ×{asset.quantity}
                        </span>
                      </div>

                      {asset.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <span key={tag}
                              className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[0.55rem] font-medium text-muted-foreground">
                              <Tag className="size-2.5" />{tag}
                            </span>
                          ))}
                          {asset.tags.length > 3 && (
                            <span className="text-[0.55rem] text-muted-foreground">+{asset.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hover allocate prompt */}
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/80 opacity-0 transition group-hover:opacity-100 rounded-xl">
                      <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-primary shadow-lg">
                        <ArrowRight className="size-3.5" /> Allocate
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ExecutiveShell>

      {/* Procurement / crossdock step modal */}
      {selectedAsset && (
        <ProcureModal
          asset={selectedAsset}
          events={events}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  )
}

export default AssetAllocationKioskPage
