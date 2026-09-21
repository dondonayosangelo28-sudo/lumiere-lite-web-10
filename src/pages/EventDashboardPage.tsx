import { useState, useMemo, useEffect } from 'react'
import { Search, Plus, Calendar as CalendarIcon, Clock, MapPin, Building2, ChevronRight, CalendarCheck, Sparkles, FilterX } from 'lucide-react'
import { ExecutiveShell } from '@/components/executive/ExecutiveShell'
import { EventCalendar, parseEventDate } from '@/components/EventCalendar'
import { RegisterEventDrawer } from '@/components/RegisterEventDrawer'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ErrorFallback } from '@/components/ErrorFallback'
import { usePortal } from '@/lib/store'
import { useNav } from '@/lib/nav'
import { cn } from '@/lib/utils'
import type { PortalEvent } from '@/lib/types'
import { getEventProgress } from '@/lib/event-progress'
import type { ExecutiveDestinationId } from '@/lib/executive-destinations'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const statusStyles: Record<string, { badge: string; dot: string }> = {
  Initialized: {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  'In Production': {
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
    dot: 'bg-sky-500',
  },
  Completed: {
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  Settled: {
    badge: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/30 font-semibold',
    dot: 'bg-emerald-600',
  },
  'On Hold': {
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
    dot: 'bg-rose-500',
  },
  Reserved: {
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  Cancelled: {
    badge: 'bg-muted text-muted-foreground border-border line-through',
    dot: 'bg-muted-foreground',
  },
}

function EventDashboardContent() {
  const { navigate } = useNav()
  const { events } = usePortal()

  // Search & Filter state
  const [query, setQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Calendar View month/year state (synced between calendar & event list)
  const [currentView, setCurrentView] = useState<{ year: number; month: number }>(() => {
    // Default to the month of the first event, or current date
    if (events.length > 0) {
      const firstParts = parseEventDate(events[0].targetDate)
      if (firstParts) return { year: firstParts.year, month: firstParts.month }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Drawer management for Create / View / Edit event
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'view' | 'edit'>('create')
  const [activeEvent, setActiveEvent] = useState<PortalEvent | null>(null)
  const [createDate, setCreateDate] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const openCreate = (date = selectedDate) => {
    setActiveEvent(null)
    setCreateDate(date)
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

  const destination = (id: ExecutiveDestinationId) => navigate(id)

  // Filter events by navigated month, selected date, and search query
  const monthEvents = useMemo(() => {
    const q = query.trim().toLowerCase()
    const selectedParts = selectedDate ? parseEventDate(selectedDate) : null

    return events.filter((ev) => {
      const parts = parseEventDate(ev.targetDate)
      if (!parts) return false

      // Match query
      const matchesQuery =
        !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.client.toLowerCase().includes(q) ||
        ev.refId.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        (ev.moodPlan && ev.moodPlan.toLowerCase().includes(q))

      if (!matchesQuery) return false

      // If specific date is selected, filter by that exact day
      if (selectedParts) {
        return (
          parts.year === selectedParts.year &&
          parts.month === selectedParts.month &&
          parts.day === selectedParts.day
        )
      }

      // Otherwise, filter to the currently navigated month
      return parts.year === currentView.year && parts.month === currentView.month
    })
  }, [events, currentView, selectedDate, query])

  const eventGroups = useMemo(() => {
    const groups = new Map<string, PortalEvent[]>()
    for (const event of monthEvents) {
      const parts = parseEventDate(event.targetDate)
      const key = parts
        ? `${parts.year}-${String(parts.month + 1).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
        : 'unscheduled'
      const group = groups.get(key) ?? []
      group.push(event)
      groups.set(key, group)
    }
    return Array.from(groups.entries()).map(([date, groupEvents]) => ({ date, events: groupEvents }))
  }, [monthEvents])

  // Total booked events across the current viewed month (unfiltered by search/date)
  const totalEventsInViewMonth = useMemo(() => {
    return events.filter((ev) => {
      const parts = parseEventDate(ev.targetDate)
      return parts && parts.year === currentView.year && parts.month === currentView.month
    }).length
  }, [events, currentView])

  const monthPreviewEvents = useMemo(() => {
    return events
      .filter((ev) => {
        const parts = parseEventDate(ev.targetDate)
        return parts && parts.year === currentView.year && parts.month === currentView.month
      })
      .sort((a, b) => {
        const aParts = parseEventDate(a.targetDate)
        const bParts = parseEventDate(b.targetDate)
        if (!aParts || !bParts) return 0
        return new Date(aParts.year, aParts.month, aParts.day).getTime() - new Date(bParts.year, bParts.month, bParts.day).getTime()
      })
  }, [events, currentView])

  const handleDateSelect = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate('')
    } else {
      setSelectedDate(dateStr)
      if (dateStr) {
        const parts = parseEventDate(dateStr)
        if (parts && (parts.year !== currentView.year || parts.month !== currentView.month)) {
          setCurrentView({ year: parts.year, month: parts.month })
        }
      }
    }
  }

  const handleResetToToday = () => {
    const now = new Date()
    setCurrentView({ year: now.getFullYear(), month: now.getMonth() })
    setSelectedDate('')
  }

  const stickyHeader = (
    <div className="flex flex-col gap-2 max-sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3" />
            Operations Console
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground max-sm:text-2xl sm:text-4xl">
          Executive Dashboard
        </h1>
        <p className="mt-1 text-xs text-muted-foreground max-sm:hidden sm:text-sm">
          Event schedule, calendar oversight, and fast portfolio registration.
        </p>
      </div>

      {/* Search and + Event Action Controls */}
      <div className="flex items-center gap-2 max-sm:gap-1.5">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, venues, ref..."
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30 max-sm:py-1.5 max-sm:pl-8 max-sm:text-[0.72rem]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] font-bold text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => openCreate()}
          data-testid="executive-add-event-button"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.98] cursor-pointer max-sm:px-3 max-sm:py-1.5 max-sm:text-[0.7rem]"
        >
          <Plus className="size-4" />
          <span>Event</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <ExecutiveShell activeId="dashboard" onSelect={destination} stickyHeader={stickyHeader}>
        {isError ? (
          <ErrorFallback
            title="Executive Dashboard Unavailable"
            message="Could not load event portfolio schedule."
            onRetry={() => setIsError(false)}
          />
        ) : isLoading ? (
          <LoadingSkeleton variant="dashboard" />
        ) : (
          <div className="grid grid-cols-1 gap-6 max-sm:gap-3 lg:grid-cols-12 lg:items-start">
            {/* Left / Top Column: Calendar Widget & Navigation (approx 4.5 cols on lg) */}
            <div className="space-y-4 max-sm:space-y-3 lg:col-span-5 xl:col-span-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm max-sm:p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-card-foreground max-sm:text-[0.7rem]">
                      Booking Calendar
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToToday}
                    className="rounded-md border border-border bg-background px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    Current Month
                  </button>
                </div>

                <EventCalendar
                  value={selectedDate}
                  events={events}
                  currentView={currentView}
                  onMonthChange={setCurrentView}
  onSelect={handleDateSelect}
  enableYearView
  className="border-0 p-0 shadow-none"
                />
              </div>

              {/* Month Summary Card */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm max-sm:p-3">
  <div className="flex items-center justify-between text-xs">
  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[0.65rem]">
  {MONTH_NAMES[currentView.month]} {currentView.year} Summary
  </span>
  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.62rem] font-bold text-primary">
  {totalEventsInViewMonth} {totalEventsInViewMonth === 1 ? 'Event' : 'Events'}
  </span>
  </div>

  <div className="mt-3">
  {monthPreviewEvents.length === 0 ? (
  <p className="py-1.5 text-xs text-muted-foreground">No events scheduled.</p>
  ) : (
  <>
  <div>
  {monthPreviewEvents.slice(0, 4).map((event, index) => {
    const parts = parseEventDate(event.targetDate)
    const progress = getEventProgress(event)
    const eventDate = parts ? new Date(parts.year, parts.month, parts.day) : null
    return (
      <button
        key={event.id}
        type="button"
        onClick={() => openView(event)}
        title={`${event.title} — ${event.status}`}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-md py-2 text-left hover:bg-muted/50',
          index < Math.min(monthPreviewEvents.length, 4) - 1 && 'border-b border-border/40',
        )}
      >
        <span className="flex size-8 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-muted/40">
          <span className="font-serif text-sm leading-none text-card-foreground">{parts?.day ?? '—'}</span>
          <span className="text-[0.5rem] uppercase leading-tight text-muted-foreground">
            {eventDate?.toLocaleDateString('en-US', { weekday: 'short' }) ?? '—'}
          </span>
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">{event.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="h-1.5 w-20 rounded-full bg-muted">
            <span
              className={cn('block h-full rounded-full', progress < 20 ? 'bg-amber-500' : 'bg-primary')}
              style={{ width: `${progress}%` }}
            />
          </span>
          <span className="w-8 text-right text-[0.6rem] font-semibold text-muted-foreground">
            {progress}%
          </span>
        </span>
      </button>
    )
  })}
  </div>
  {monthPreviewEvents.length > 4 && (
    <p className="mt-1 text-xs text-muted-foreground">+{monthPreviewEvents.length - 4} more this month</p>
  )}
  </>
  )}
  </div>
  
  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => navigate('registry')}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <span>View full registry table</span>
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right / Bottom Column: Month Event Rows List (approx 7.5 cols on lg) */}
            <div className="space-y-4 lg:col-span-7 xl:col-span-8">
              {/* Header of Month's Event Rows */}
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl font-medium text-card-foreground">
                      {selectedDate
                        ? `Events on ${selectedDate}`
                        : `${MONTH_NAMES[currentView.month]} ${currentView.year} Events`}
                    </h2>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-bold text-foreground">
                      {monthEvents.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedDate
                      ? 'Filtered by clicked calendar day.'
                      : `All active and scheduled events for ${MONTH_NAMES[currentView.month]} ${currentView.year}.`}
                  </p>
                </div>

                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:self-auto"
                  >
                    <FilterX className="size-3.5" />
                    <span>Show all for {MONTH_NAMES[currentView.month].slice(0, 3)}</span>
                  </button>
                )}
              </div>

              {/* Event Cards List */}
              {monthEvents.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8">
                  <EmptyState
                    title={
                      query
                        ? 'No events match your search'
                        : selectedDate
                          ? `No events on ${selectedDate}`
                          : `No events in ${MONTH_NAMES[currentView.month]} ${currentView.year}`
                    }
                    message={
                      query
                        ? 'Try clearing the search query to see all events for this month.'
                        : 'No event portfolios are scheduled for this timeframe. You can register a new event now.'
                    }
                    actionLabel="+ Register New Event"
                    onAction={() => openCreate()}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {eventGroups.map((group) => (
                    <div key={group.date} className="space-y-3">
                      {group.events.map((e) => {
                    const dateParts = parseEventDate(e.targetDate)
                    const dayNum = dateParts ? dateParts.day : '—'
                    const monthAbbr = dateParts
                      ? MONTH_NAMES[dateParts.month].slice(0, 3).toUpperCase()
                      : 'TBD'
                    const fullDate = dateParts
                      ? new Date(dateParts.year, dateParts.month, dateParts.day)
                      : null
                    const weekday = fullDate
                      ? fullDate.toLocaleDateString('en-US', { weekday: 'short' })
                      : ''

                    const statusInfo = statusStyles[e.status] || {
                      badge: 'bg-muted text-muted-foreground border-border',
                      dot: 'bg-muted-foreground',
                    }

                    return (
                      <div
                        key={e.id}
                        className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4.5 shadow-sm transition hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* Left: Date Badge + Main Info */}
                        <div className="flex items-start gap-4">
                          {/* Date Callout Box */}
                          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/40 text-center transition group-hover:border-primary/30 group-hover:bg-primary/5">
                            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                              {monthAbbr}
                            </span>
                            <span className="font-serif text-lg font-bold leading-none text-foreground">
                              {dayNum}
                            </span>
                            <span className="text-[0.55rem] font-medium text-muted-foreground">
                              {weekday}
                            </span>
                          </div>

                          {/* Event Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
                                {e.refId}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider',
                                  statusInfo.badge,
                                )}
                              >
                                <span
                                  className={cn('size-1.5 rounded-full', statusInfo.dot)}
                                  aria-hidden="true"
                                />
                                {e.status}
                              </span>
                            </div>

                            <h3 className="mt-1 font-serif text-base font-medium text-card-foreground leading-snug group-hover:text-primary transition-colors truncate">
                              {e.title}
                            </h3>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {e.client && (
                                <span className="flex items-center gap-1 font-medium text-foreground/80">
                                  <Building2 className="size-3 text-muted-foreground" />
                                  <span className="truncate max-w-[180px]">{e.client}</span>
                                </span>
                              )}
                              {e.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3 text-muted-foreground" />
                                  <span className="truncate max-w-[200px]">{e.venue}</span>
                                </span>
                              )}
                              {(e.installationStart || e.installationEnd) && (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3 text-muted-foreground" />
                                  <span>
                                    {e.installationStart || '08:00'} - {e.installationEnd || '23:00'}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex shrink-0 items-center gap-2 border-t border-border/50 pt-3 sm:border-0 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => openView(e)}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-card-foreground transition hover:bg-muted hover:border-primary/30"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(e)}
                            className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary hover:text-primary-foreground"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )
                      })}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => openCreate()}
                    className="w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary hover:text-primary-foreground"
                  >
                    Register Event
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </ExecutiveShell>

      {/* Drawer for creating new events and viewing/editing existing ones */}
      <RegisterEventDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        event={activeEvent ? { ...activeEvent } : null}
        initialDate={typeof createDate === 'string' ? createDate : ''}
        mode={drawerMode}
      />
    </>
  )
}

export function EventDashboardPage() {
  return <EventDashboardContent />
}

export default EventDashboardPage
