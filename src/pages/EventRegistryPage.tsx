import { useEffect, useMemo, useState } from 'react'
import { Search, MoreVertical, X, ChevronRight } from 'lucide-react'
import { ExecutiveShell } from '@/components/executive/ExecutiveShell'
import { RegisterEventDrawer } from '@/components/RegisterEventDrawer'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ErrorFallback } from '@/components/ErrorFallback'
import { EmptyState } from '@/components/EmptyState'
import { usePortal } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { useNav } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { PortalEvent } from '@/lib/types'
import type { ExecutiveDestinationId } from '@/lib/executive-destinations'

// Deterministic dispatch progress derived from an event's lifecycle status.
const dispatchProgress: Record<string, number> = {
  Settled: 100,
  Completed: 100,
  'In Production': 65,
  'On Hold': 40,
  Reserved: 25,
  Initialized: 15,
  Cancelled: 0,
}

const matchesEventQuery = (event: PortalEvent, rawQuery: string) => {
  const normalizedQuery = rawQuery.trim().toLowerCase()
  return (
    !normalizedQuery ||
    event.title.toLowerCase().includes(normalizedQuery) ||
    event.client.toLowerCase().includes(normalizedQuery) ||
    event.refId.toLowerCase().includes(normalizedQuery) ||
    event.venue.toLowerCase().includes(normalizedQuery)
  )
}

const statusStyles: Record<string, string> = {
  Initialized: 'text-amber-700',
  'In Production': 'text-sky-700',
  Completed: 'text-emerald-700',
  Settled: 'text-emerald-800 font-semibold',
  'On Hold': 'text-rose-700',
  Reserved: 'text-indigo-700',
  Cancelled: 'text-muted-foreground line-through',
}

export function EventRegistryPage() {
  const { events } = usePortal()
  // Both administrators and executives can register and maintain events.
  // The registry remains the single source of truth for create, view, and edit actions.
  const { intent, clearIntent, navigate } = useNav()
  const readOnly = false
  // A single drawer instance serves create / view / edit.
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'view' | 'edit'>('create')
  const [activeEvent, setActiveEvent] = useState<PortalEvent | null>(null)
  const [progressQuery, setProgressQuery] = useState('')
  const [progressScroll, setProgressScroll] = useState(0)
  const [progressOpen, setProgressOpen] = useState(false)
  const [listQuery, setListQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const openCreate = () => {
    setActiveEvent(null)
    setDrawerMode('create')
    setDrawerOpen(true)
  }
  const openView = (e: PortalEvent) => {
    setActiveEvent(e)
    setDrawerMode('view')
    setDrawerOpen(true)
  }
  const openEdit = (e: PortalEvent) => {
    setActiveEvent(e)
    setDrawerMode('edit')
    setDrawerOpen(true)
  }

  // Consume a "view-event" intent handed over from a dashboard "Open" button.
  useEffect(() => {
    if (intent?.kind === 'view-event') {
      const target = events.find((e) => e.id === intent.payload?.id)
      if (target) openView(target)
      clearIntent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent])

  const statuses = ['All', 'Initialized', 'In Production', 'On Hold', 'Completed', 'Settled']

  const filtered = useMemo(
    () => events.filter((event) => matchesEventQuery(event, listQuery) && (statusFilter === 'All' || event.status === statusFilter)),
    [events, listQuery, statusFilter],
  )

  const progressEvents = useMemo(
    () => events.filter((event) => event.status !== 'Cancelled' && matchesEventQuery(event, progressQuery)),
    [events, progressQuery],
  )

  const destination = (id: ExecutiveDestinationId) => navigate(id)

  const stickyHeader = (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Event Operations
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {readOnly
              ? 'Portfolio registry oversight — event concepts, venues, timelines, and production status.'
              : 'Register and orchestrate event portfolios across venues, timelines, and production stages.'}
          </p>
        </div>
      </div>
    </div>
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const handleRefetch = async () => {
    setIsError(false)
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 200))
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    handleRefetch()
  }, [])

  return (
    <ExecutiveShell activeId="registry" onSelect={destination} stickyHeader={stickyHeader}>
      {isError ? (
        <ErrorFallback
          title="Event Operations Registry Unavailable"
          message="Could not load event portfolio registry records."
          onRetry={handleRefetch}
        />
      ) : isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : (
        <>
          {/* Operational Progress — compact overview with detail available on demand */}
          <section className="mx-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm" aria-labelledby="operational-progress-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 id="operational-progress-heading" className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">Operational Progress</h2>
                  <p className="mt-0.5 text-[0.68rem] text-muted-foreground">Dispatch readiness across active event portfolios.</p>
                </div>
                <div className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
                <div className="grid grid-cols-4 gap-3 sm:flex sm:items-center sm:gap-5" aria-label="Operational progress summary">
                  {[
                    { label: 'Total', value: events.length },
                    { label: 'Upcoming', value: events.filter((e) => ['Reserved', 'Initialized'].includes(e.status)).length },
                    { label: 'In Progress', value: events.filter((e) => ['In Production', 'On Hold'].includes(e.status)).length },
                    { label: 'Completed', value: events.filter((e) => ['Completed', 'Settled'].includes(e.status)).length },
                  ].map((metric) => (
                    <div key={metric.label} className="min-w-0">
                      <p className="text-base font-semibold leading-none text-foreground">{metric.value}</p>
                      <p className="mt-1 whitespace-nowrap text-[0.55rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => setProgressOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card">
                View Progress <ChevronRight className="size-3.5" />
              </button>
            </div>
          </section>

          {progressOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProgressOpen(false) }}>
              <section className="flex max-h-[min(80vh,42rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="progress-dialog-heading">
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                  <div>
                    <h2 id="progress-dialog-heading" className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Operational Progress</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Asset dispatch readiness across active event portfolios.</p>
                  </div>
                  <button type="button" onClick={() => setProgressOpen(false)} aria-label="Close operational progress" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" /></button>
                </div>
                <div className="overflow-y-auto p-5">
                  <div className="relative">
                    <div className="mb-2 flex justify-end">
                      <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input value={progressQuery} onChange={(e) => setProgressQuery(e.target.value)} placeholder="Search active events..." aria-label="Search operational progress events" className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
                      </div>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border/70" aria-label="Operational progress events" onScroll={(event) => { const element = event.currentTarget; const maxScroll = element.scrollHeight - element.clientHeight; setProgressScroll(maxScroll > 0 ? element.scrollTop / maxScroll : 0) }}>
                      <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(7rem,0.7fr)_7rem_minmax(8rem,0.8fr)] gap-4 bg-muted/40 px-3 py-2 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:grid"><span>Event</span><span>Date</span><span>Progress</span><span>Status</span></div>
                      {progressEvents.length === 0 ? <p className="px-3 py-4 text-xs text-muted-foreground">No active events match your search.</p> : progressEvents.map((e) => {
                        const pct = dispatchProgress[e.status] ?? 0
                        const shortStatus = e.status === 'In Production' ? 'In Progress' : e.status === 'Initialized' ? 'Planning' : e.status
                        return <button type="button" key={e.id} onClick={() => { setProgressOpen(false); openView(e) }} className="grid w-full gap-2 border-t border-border/60 px-3 py-3 text-left first:border-t-0 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:grid-cols-[minmax(0,1.8fr)_minmax(7rem,0.7fr)_7rem_minmax(8rem,0.8fr)] sm:items-center sm:gap-4"><div className="min-w-0"><p className="truncate text-xs font-medium text-card-foreground">{e.title}</p><p className="mt-0.5 text-[0.62rem] text-muted-foreground sm:hidden">{e.targetDate || 'Date unavailable'}</p></div><span className="hidden text-xs text-muted-foreground sm:block">{e.targetDate || '—'}</span><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-label={`${pct}% complete`}><div className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-sky-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} /></div><span className="text-[0.65rem] font-semibold text-muted-foreground">{pct}%</span></div><span className={cn('text-[0.62rem] font-bold uppercase tracking-[0.1em]', statusStyles[e.status])}>{shortStatus}</span></button>
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

      <section className="mt-7" aria-labelledby="events-heading">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="events-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Events
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Registered events across the current executive portfolio.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={listQuery} onChange={(e) => setListQuery(e.target.value)} placeholder="Search events..." aria-label="Search all events" className="w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 sm:w-56" />
            </div>
            {!readOnly && (
              <button type="button" onClick={openCreate} className="rounded-md bg-primary px-5 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                Register New Event
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Event status filters">
          {statuses.map((status) => {
            const count = status === 'All' ? events.length : events.filter((e) => e.status === status).length
            return (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={cn('rounded-full px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] transition', statusFilter === status ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'border border-border bg-card text-muted-foreground hover:bg-muted')}>
                {status} ({count})
              </button>
            )
          })}
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-8">
              <EmptyState title="No events found" message="No registered events match the current search or status filters." />
            </div>
          ) : filtered.map((e) => (
            <article key={e.id} className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm transition hover:border-primary/40 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="truncate text-sm font-semibold text-card-foreground">{e.title}</h3>
                    <span className={cn('text-[0.6rem] font-bold uppercase tracking-[0.12em]', statusStyles[e.status])}>{e.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{e.client} <span className="px-1 text-border">/</span> {e.refId}</p>
                </div>
                <div className="flex items-center gap-3 lg:shrink-0">
                  <button type="button" onClick={() => openView(e)} className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-primary underline-offset-4 transition hover:underline">View Event</button>
                  {!readOnly && (
                    <div className="relative">
                      <button type="button" aria-label={`More actions for ${e.title}`} onClick={() => setOpenMenuId(openMenuId === e.id ? null : e.id)} className="rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><MoreVertical className="size-4" /></button>
                      {openMenuId === e.id && (
                        <div className="absolute right-0 z-10 mt-1 rounded-md border border-border bg-card shadow-lg">
                          <button type="button" onClick={() => { openEdit(e); setOpenMenuId(null) }} className="block w-full rounded-md px-4 py-2 text-left text-[0.6rem] font-bold uppercase tracking-[0.12em] text-card-foreground hover:bg-muted">Edit</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/70 pt-3 sm:grid-cols-4">
                <div><dt className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Venue</dt><dd className="mt-1 truncate text-xs text-card-foreground">{e.venue || '—'}</dd></div>
                <div><dt className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Event date</dt><dd className="mt-1 text-xs text-card-foreground">{e.targetDate || '—'}</dd></div>
                <div><dt className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Installation start</dt><dd className="mt-1 text-xs text-card-foreground">{e.installationStart || '—'}</dd></div>
                <div><dt className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Installation end</dt><dd className="mt-1 text-xs text-card-foreground">{e.installationEnd || '—'}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>
      </>
      )}

      <RegisterEventDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        event={activeEvent ? { ...activeEvent } : null}
        mode={drawerMode}
      />
    </ExecutiveShell>
  )
}
