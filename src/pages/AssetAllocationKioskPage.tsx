import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search, Sparkles, ChevronRight,
  AlertTriangle, ShoppingCart, ArrowRight, RotateCcw, X,
  Boxes, CheckCircle2, Loader2,
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

const SAMPLE_ASSETS: AssetResponse[] = [
  { id: 'sample-lighting-kit', name: 'Aurora Lighting Kit', assetSubTypeId: 'lighting', subTypeName: 'Lighting', assetTier: 2, assetState: 'Available', quantity: 12, colors: [{ hex: '#f4c46a', brand: 'Warm Gold' }], tags: ['portable', 'interior'], thumbnailUrl: '/assets/aurora-lighting-kit.png' },
  { id: 'sample-lounge-chair', name: 'Marlow Lounge Chair', assetSubTypeId: 'furniture', subTypeName: 'Furniture', assetTier: 3, assetState: 'Available', quantity: 8, colors: [{ hex: '#b48762', brand: 'Cognac' }], tags: ['seating', 'lounge'], thumbnailUrl: '/assets/marlow-lounge-chair.png' },
  { id: 'sample-display-wall', name: 'Modular Display Wall', assetSubTypeId: 'display', subTypeName: 'Display', assetTier: 1, assetState: 'Reserved', quantity: 4, colors: [{ hex: '#ded8cc', brand: 'Stone' }], tags: ['modular', 'backdrop'], thumbnailUrl: '/assets/modular-display-wall.png' },
  { id: 'sample-plinth-set', name: 'Oak Plinth Set', assetSubTypeId: 'display', subTypeName: 'Display', assetTier: 2, assetState: 'Available', quantity: 16, colors: [{ hex: '#9b6b43', brand: 'Oak' }], tags: ['oak', 'merchandising'], thumbnailUrl: '/assets/oak-plinth-set.png' },
  { id: 'sample-textile-roll', name: 'Linen Textile Roll', assetSubTypeId: 'textiles', subTypeName: 'Textiles', assetTier: 3, assetState: 'Available', quantity: 24, colors: [{ hex: '#e9dfca', brand: 'Natural Linen' }], tags: ['linen', 'neutral'], thumbnailUrl: '/assets/linen-textile-roll.png' },
  { id: 'sample-signage-frame', name: 'Brass Signage Frame', assetSubTypeId: 'signage', subTypeName: 'Signage', assetTier: 4, assetState: 'InMaintenance', quantity: 3, colors: [{ hex: '#b08a4f', brand: 'Antique Brass' }], tags: ['brass', 'wayfinding'], thumbnailUrl: '/assets/brass-signage-frame.png' },
  { id: 'sample-vessel-set', name: 'Ceramic Vessel Set', assetSubTypeId: 'styling', subTypeName: 'Styling', assetTier: 5, assetState: 'Available', quantity: 10, colors: [{ hex: '#6e7774', brand: 'Sage' }], tags: ['ceramic', 'tabletop'], thumbnailUrl: '/assets/ceramic-vessel-set.png' },
  { id: 'sample-divider', name: 'Canvas Room Divider', assetSubTypeId: 'furniture', subTypeName: 'Furniture', assetTier: 2, assetState: 'Available', quantity: 6, colors: [{ hex: '#c7b8a5', brand: 'Canvas' }], tags: ['divider', 'privacy'], thumbnailUrl: '/assets/canvas-room-divider.png' },
]

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
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Boxes className="size-6 text-muted-foreground" />
              </div>
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
  const [isSampleData, setIsSampleData] = useState(false)

  // Sidebar / filter state
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY)
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mobilePage, setMobilePage] = useState(0)
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setIsPhone(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

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
      setIsSampleData(false)
    } catch {
      setAssets(SAMPLE_ASSETS)
      setIsSampleData(true)
      setIsError(false)
    } finally {
      setIsLoading(false)
    }
  }, [activeCategory, query, tierFilter])

  useEffect(() => { load() }, [load])

  // Derive sidebar categories from loaded assets
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number; thumbnailUrl?: string }>()
    for (const a of assets) {
      const id = a.assetSubTypeId
      const label = a.subTypeName || 'Unclassified'
      const existing = map.get(id)
      if (existing) {
        existing.count++
        if (!existing.thumbnailUrl && a.thumbnailUrl) existing.thumbnailUrl = a.thumbnailUrl
      } else map.set(id, { id, label, count: 1, thumbnailUrl: a.thumbnailUrl })
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [assets])

  const allCategoryImage = assets.find((asset) => asset.thumbnailUrl)?.thumbnailUrl

  // Client-side filter (fallback to query already passed to API, but also
  // filter in-memory by state as not all params may be server-filtered)
  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assets.filter((a) => {
      if (activeCategory !== ALL_CATEGORY && a.assetSubTypeId !== activeCategory) return false
      if (tierFilter != null && a.assetTier !== tierFilter) return false
      if (q) {
        const matchName = a.name.toLowerCase().includes(q)
        const matchTags = (a.tags ?? []).some((t) => t.toLowerCase().includes(q))
        const matchSub  = (a.subTypeName || '').toLowerCase().includes(q)
        if (!matchName && !matchTags && !matchSub) return false
      }
      return true
    })
  }, [assets, activeCategory, tierFilter, query])

  const mobilePageSize = 48
  const mobilePageCount = Math.max(1, Math.ceil(displayed.length / mobilePageSize))
  const visibleAssets = isPhone
    ? displayed.slice(mobilePage * mobilePageSize, (mobilePage + 1) * mobilePageSize)
    : displayed

  useEffect(() => {
    setMobilePage(0)
  }, [activeCategory, query, tierFilter, viewMode])

  const stockInfo = (asset: AssetResponse) => {
    const quantity = Math.max(0, asset.quantity)
    const status = asset.assetState === 'InMaintenance' || quantity === 0
      ? 'Out of Stock'
      : quantity <= 3
        ? 'Low Stock'
        : 'Available'
    const tone = status === 'Available'
      ? 'bg-emerald-500'
      : status === 'Low Stock'
        ? 'bg-amber-500'
        : 'bg-rose-500'
    return { quantity, status, tone, percent: Math.min(100, quantity === 0 ? 0 : Math.max(12, quantity * 8)) }
  }

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
        <div className="grid h-[60vh] grid-cols-1 gap-5 sm:h-auto sm:min-h-[60vh] sm:grid-cols-[minmax(15rem,20%)_minmax(0,1fr)] sm:gap-6">
          {/* ---- Visual category menu ---- */}
          <aside className="min-w-0 sm:max-h-[65vh]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">Classifications</p>
              <span className="text-[0.6rem] text-muted-foreground">{categories.length + 1} categories</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:block sm:space-y-2 sm:overflow-visible sm:pb-0">
              {[{ id: ALL_CATEGORY, label: 'All', count: assets.length, thumbnailUrl: allCategoryImage }, ...categories].map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveCategory(cat.id === activeCategory ? ALL_CATEGORY : cat.id)}
                    className={cn(
                      'group flex min-w-[9.5rem] shrink-0 items-center gap-3 rounded-xl border p-2 text-left transition duration-200 sm:min-w-0 sm:w-full',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-md'
                        : 'border-border/70 bg-card text-card-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/60 hover:shadow-sm',
                    )}
                  >
                    <span className={cn('size-11 shrink-0 overflow-hidden rounded-lg bg-muted/60 sm:size-12', isActive && 'ring-2 ring-white/50')}>
                      {cat.thumbnailUrl ? (
                        <img src={cat.thumbnailUrl} alt={`${cat.label} classification`} className="size-full object-cover transition duration-300 group-hover:scale-110" />
                      ) : (
                        <span className="flex size-full items-center justify-center"><Boxes className="size-4 opacity-40" /></span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{cat.label}</span>
                      <span className={cn('mt-0.5 block text-[0.6rem]', isActive ? 'text-primary-foreground/75' : 'text-muted-foreground')}>Browse collection</span>
                    </span>
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold', isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>{cat.count}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ---- Right pane 80% — thumbnail grid ---- */}
          <div className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:h-auto sm:flex-1 sm:overflow-visible">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-medium text-card-foreground">{activeCategory === ALL_CATEGORY ? 'All Assets' : categories.find((category) => category.id === activeCategory)?.label}</h2>
              <div className="flex shrink-0 items-center rounded-lg border border-border bg-card p-0.5">
                <button type="button" aria-label="Grid view" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={cn('rounded-md px-2 py-1.5 text-sm', viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>▦</button>
                <button type="button" aria-label="List view" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} className={cn('rounded-md px-2 py-1.5 text-sm', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>☰</button>
              </div>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
              <>
              <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4' : 'grid grid-cols-1 gap-2')}>
                {visibleAssets.map((asset) => {
                  const stock = stockInfo(asset)
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      data-testid={`asset-card-${asset.id}`}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        'group relative overflow-hidden border border-border bg-card text-left transition hover:border-primary/40 hover:shadow-lg',
                        viewMode === 'grid' ? 'rounded-xl' : 'flex w-full items-center gap-3 rounded-lg p-1.5 sm:p-2',
                      )}
                    >
                      <div className={cn('overflow-hidden bg-muted/40', viewMode === 'grid' ? 'aspect-square w-full' : 'size-14 shrink-0 rounded-md sm:size-20 sm:aspect-square')}>
                        {asset.thumbnailUrl ? (
                          <img src={asset.thumbnailUrl} alt={asset.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><Boxes className="size-8 text-muted-foreground/40" /></div>
                        )}
                      </div>
                      <div className={cn(viewMode === 'grid' ? 'p-2.5' : 'min-w-0 flex-1 pr-1')}>
                        <p className="truncate text-[0.7rem] font-semibold text-card-foreground">{asset.name}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[0.65rem] font-bold text-foreground">{stock.quantity} available</span>
                          <span className={cn('text-[0.55rem] font-semibold', stock.status === 'Available' ? 'text-emerald-600' : stock.status === 'Low Stock' ? 'text-amber-600' : 'text-rose-600')}>{stock.status}</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted" aria-label={`${stock.status}: ${stock.quantity} available`}>
                          <div className={cn('h-full rounded-full', stock.tone)} style={{ width: `${stock.percent}%` }} />
                        </div>
                      </div>
                      <span className="sr-only">Select to allocate {asset.name}</span>
                    </button>
                  )
                })}
              </div>
              {isPhone && mobilePageCount > 1 && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-card px-2 py-1.5">

                  <button type="button" disabled={mobilePage === 0} onClick={() => setMobilePage((page) => Math.max(0, page - 1))} className="rounded-md px-2 py-1 text-xs font-semibold text-primary disabled:opacity-40">Previous</button>
                  <span className="text-[0.6rem] text-muted-foreground">Page {mobilePage + 1} of {mobilePageCount}</span>
                  <button type="button" disabled={mobilePage >= mobilePageCount - 1} onClick={() => setMobilePage((page) => Math.min(mobilePageCount - 1, page + 1))} className="rounded-md px-2 py-1 text-xs font-semibold text-primary disabled:opacity-40">Next</button>
                </div>
              )}
              </>
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
