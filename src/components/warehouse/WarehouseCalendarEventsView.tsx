import { useMemo, useState, useEffect } from 'react'
import { Calendar as CalendarIcon, MapPin, Building2, Clock, FilterX, ArrowRight } from 'lucide-react'
import type { PortalEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { EventCalendar, parseEventDate as parseCalendarDate } from '@/components/EventCalendar'

// The Dashboard is an operational overview, not a full event-management page.
// Only the nearest handful of upcoming events are previewed; the rest stay
// reachable via "View all events" and the calendar.
const UPCOMING_PREVIEW_LIMIT = 7

interface WarehouseCalendarEventsViewProps {
  events: PortalEvent[]
  onSelectEvent: (event: PortalEvent) => void
}

const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]

// Robust Event Date Parsing Helper (Handles 'Oct 14, 2026', '2026-10-14', etc.)
function parseEventDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null

  // Standard JS Date parsing
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  // Fallback ISO split YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3 && !parts.some(isNaN)) {
      return new Date(parts[0], parts[1] - 1, parts[2])
    }
  }

  return null
}

// Ingress Countdown Indicator Helper (Calculated dynamically against runtime Date with Guard Clause)
function getIngressCountdownBadge(targetDateStr: string): { label: string; style: string } {
  const evtDateObj = parseEventDate(targetDateStr)

  // Guard clause: Invalid Date fallback
  if (!evtDateObj || isNaN(evtDateObj.getTime())) {
    return {
      label: 'Date TBD',
      style: 'bg-muted border-border/50 text-muted-foreground font-medium',
    }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetStart = new Date(evtDateObj.getFullYear(), evtDateObj.getMonth(), evtDateObj.getDate()).getTime()

  const diffMs = targetStart - todayStart
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  // Guard clause: NaN diffDays fallback
  if (isNaN(diffDays)) {
    return {
      label: 'Date TBD',
      style: 'bg-muted border-border/50 text-muted-foreground font-medium',
    }
  }

  // Muted Gray (< 0 days): Completed
  if (diffDays < 0) {
    return {
      label: 'Completed',
      style: 'bg-muted border-border/50 text-muted-foreground font-medium',
    }
  }

  // Red (0–3 days): High Urgency
  if (diffDays === 0) {
    return {
      label: 'Today',
      style: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold',
    }
  }
  if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      style: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold',
    }
  }
  if (diffDays >= 2 && diffDays <= 3) {
    return {
      label: `${diffDays} days left`,
      style: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold',
    }
  }

  // Amber (4–13 days): Medium Urgency
  if (diffDays >= 4 && diffDays <= 6) {
    return {
      label: `${diffDays} days left`,
      style: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold',
    }
  }
  if (diffDays >= 7 && diffDays <= 13) {
    return {
      label: '1 week left',
      style: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold',
    }
  }

  // Gray (14–29 days): Standard Warning
  if (diffDays >= 14 && diffDays <= 29) {
    const weeks = Math.floor(diffDays / 7)
    return {
      label: `${weeks} week${weeks === 1 ? '' : 's'} left`,
      style: 'bg-slate-500/15 border-slate-500/30 text-slate-600 dark:text-slate-400 font-medium',
    }
  }

  // Green (30+ days): Low Urgency
  if (diffDays >= 30 && diffDays <= 59) {
    return {
      label: '1 month left',
      style: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium',
    }
  }

  // 60+ days
  const months = Math.floor(diffDays / 30)
  return {
    label: `${months} month${months === 1 ? '' : 's'} left`,
    style: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium',
  }
}

export function WarehouseCalendarEventsView({ events, onSelectEvent }: WarehouseCalendarEventsViewProps) {
  // Determine initial calendar view month/year from earliest seeded event
  const initialView = useMemo(() => {
    if (events.length > 0) {
      const parsedDates = events
        .map((e) => parseEventDate(e.targetDate))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())

      if (parsedDates.length > 0) {
        return { year: parsedDates[0].getFullYear(), month: parsedDates[0].getMonth() }
      }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  }, [events])

  const [currentView, setCurrentView] = useState<{ year: number; month: number }>(initialView)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [showAll, setShowAll] = useState(false)

  // Keep the view synchronized if the initial view resolves after mount (e.g. events load async)
  useEffect(() => {
    setCurrentView(initialView)
  }, [initialView])

  const handleDateSelect = (dateStr: string) => {
    // Toggle: clicking the same date clears the selection
    setSelectedDate((prev) => (prev === dateStr ? '' : dateStr))
  }

  // All events for the currently selected calendar date (supports multiple events per date)
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const target = parseCalendarDate(selectedDate)
    if (!target) return []
    return events
      .filter((evt) => {
        const parts = parseCalendarDate(evt.targetDate)
        return (
          parts !== null &&
          parts.year === target.year &&
          parts.month === target.month &&
          parts.day === target.day
        )
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [events, selectedDate])

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return ''
    const parts = parseCalendarDate(selectedDate)
    if (!parts) return selectedDate
    const d = new Date(parts.year, parts.month, parts.day)
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }, [selectedDate])

  // Upcoming Events list: sorted by nearest target date ascending
  const upcomingEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = parseEventDate(a.targetDate)?.getTime() ?? 0
      const dateB = parseEventDate(b.targetDate)?.getTime() ?? 0
      return dateA - dateB
    })
  }, [events])

  // Group upcoming events by Month Year for month-grouped sticky headers
  const monthGroups = useMemo(() => {
    const map = new Map<string, PortalEvent[]>()
    upcomingEvents.forEach((evt) => {
      const d = parseEventDate(evt.targetDate)
      const groupKey = d ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` : 'OTHER EVENTS'
      const list = map.get(groupKey) ?? []
      list.push(evt)
      map.set(groupKey, list)
    })
    return Array.from(map.entries())
  }, [upcomingEvents])

  // Compact Dashboard preview: only the nearest upcoming events are shown.
  // Prefer events that are today or later; fall back to the nearest overall
  // if every event is in the past. The full dataset is never truncated —
  // remaining events stay reachable via "View all events" and the calendar.
  const previewEvents = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const future = upcomingEvents.filter((evt) => {
      const d = parseEventDate(evt.targetDate)
      return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() >= todayStart : false
    })
    const source = future.length > 0 ? future : upcomingEvents
    return source.slice(0, UPCOMING_PREVIEW_LIMIT)
  }, [upcomingEvents])

  // Shared compact row for both the preview and the expanded "View all" list.
  const renderEventRow = (evt: PortalEvent) => {
    const countdown = getIngressCountdownBadge(evt.targetDate)
    return (
      <button
        key={evt.id}
        type="button"
        onClick={() => onSelectEvent(evt)}
        className="group flex w-full flex-col gap-2 rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-left transition-all duration-150 hover:border-primary/50 hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-4"
      >
        {/* Event name + reference id */}
        <div className="min-w-0 sm:flex-1">
          <h4 className="truncate font-serif text-sm font-medium text-card-foreground transition-colors group-hover:text-primary">
            {evt.title}
          </h4>
          <span className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground">
            {evt.refId}
          </span>
        </div>

        {/* Venue / date / status — a wrapping row on mobile, aligned columns on desktop */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] text-muted-foreground sm:contents">
          <span className="flex min-w-0 items-center gap-1 sm:w-44">
            <MapPin className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{evt.venue}</span>
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap font-medium text-foreground/80 sm:w-24">
            <CalendarIcon className="size-3 text-muted-foreground" />
            {evt.targetDate}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-0.5 text-[0.55rem] uppercase tracking-wider sm:w-28 sm:text-center',
              countdown.style,
            )}
          >
            {countdown.label}
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── TOP AREA: Executive-style Calendar + Selected-Date Event List ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT: Month Calendar (reuses the Executive Dashboard EventCalendar) */}
        <div className="flex flex-col rounded-2xl border border-border/90 bg-card/95 p-5 sm:p-6 lg:col-span-5 shadow-sm sm:shadow-md backdrop-blur-xs">
          <div className="flex items-center gap-3 border-b border-border/80 pb-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <CalendarIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-medium text-card-foreground">Event Calendar</h2>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Monthly Event &amp; Ingress Roster
              </p>
            </div>
          </div>

          <div className="mt-4">
            <EventCalendar
              value={selectedDate}
              events={events}
              currentView={currentView}
              onMonthChange={setCurrentView}
              onSelect={handleDateSelect}
              enableYearView
              showEventCount
              className="border-0 p-0 shadow-none"
            />
          </div>
        </div>

        {/* RIGHT: Selected-Date Event List (shows ALL events on the clicked date) */}
        <div className="flex min-h-[35rem] flex-col rounded-2xl border border-border/90 bg-card/95 p-5 sm:p-6 lg:col-span-7 shadow-sm sm:shadow-md backdrop-blur-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-medium text-card-foreground">
                  {selectedDate ? 'Events on this date' : 'Select a date'}
                </h3>
                {selectedDate && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-bold text-foreground">
                    {selectedDateEvents.length}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedDate ? selectedDateLabel : 'Click any day in the calendar to see all scheduled events.'}
              </p>
            </div>

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <FilterX className="size-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {!selectedDate ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  <CalendarIcon className="size-6" />
                </span>
                <p className="text-sm font-medium text-card-foreground">No date selected</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Select a day on the calendar to view all events scheduled for that date.
                </p>
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  <CalendarIcon className="size-6" />
                </span>
                <p className="text-sm font-medium text-card-foreground">No events on this date</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  There are no events scheduled for {selectedDateLabel}.
                </p>
              </div>
            ) : (
              selectedDateEvents.map((evt) => {
                const countdown = getIngressCountdownBadge(evt.targetDate)
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => onSelectEvent(evt)}
                    className="group flex w-full flex-col gap-2 rounded-xl border border-border/80 bg-background/90 p-4 text-left shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/40 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
                          {evt.refId}
                        </span>
                        <h4 className="mt-0.5 font-serif text-sm font-medium text-card-foreground transition-colors group-hover:text-primary">
                          {evt.title}
                        </h4>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2.5 py-0.5 text-[0.55rem] uppercase tracking-wider',
                          countdown.style,
                        )}
                      >
                        {countdown.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] text-muted-foreground">
                      {evt.client && (
                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">{evt.client}</span>
                        </span>
                      )}
                      {evt.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{evt.venue}</span>
                        </span>
                      )}
                      {(evt.installationStart || evt.installationEnd) && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground" />
                          <span>
                            {evt.installationStart || '08:00'} - {evt.installationEnd || '23:00'}
                          </span>
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── BELOW: Upcoming Events (Compact, Scalable Preview) ─── */}
      <div className="flex flex-col rounded-2xl border border-border/90 bg-card/95 p-5 sm:p-6 shadow-sm sm:shadow-md backdrop-blur-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-4">
          <div>
            <h3 className="font-serif text-lg font-medium text-card-foreground">Upcoming Events</h3>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {showAll
                ? `All ${upcomingEvents.length} scheduled`
                : `Nearest ${previewEvents.length} of ${upcomingEvents.length} scheduled`}
            </p>
          </div>
          {(upcomingEvents.length > previewEvents.length || showAll) && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-muted"
            >
              {showAll ? 'Show less' : 'View all events'}
              <ArrowRight className={cn('size-3.5 transition-transform', showAll && 'rotate-90')} />
            </button>
          )}
        </div>

        {/* Column labels (desktop only) */}
        {upcomingEvents.length > 0 && (
          <div className="mt-3 hidden items-center gap-4 px-3.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-muted-foreground sm:flex">
            <span className="flex-1">Event</span>
            <span className="w-44">Venue</span>
            <span className="w-24">Date</span>
            <span className="w-28 text-center">Status</span>
          </div>
        )}

        {upcomingEvents.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No upcoming events found.</p>
        ) : showAll ? (
          <div className="mt-2 max-h-[30rem] space-y-4 overflow-y-auto pr-1.5 scrollbar-thin">
            {monthGroups.map(([groupKey, groupEvents]) => (
              <div key={groupKey} className="space-y-1.5">
                <div className="sticky top-0 z-10 border-b border-border/80 bg-card/95 py-1.5 backdrop-blur-sm">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-primary">
                    {groupKey} ({groupEvents.length})
                  </span>
                </div>
                <div className="space-y-1.5">{groupEvents.map((evt) => renderEventRow(evt))}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 space-y-1.5">{previewEvents.map((evt) => renderEventRow(evt))}</div>
        )}
      </div>
    </div>
  )
}
