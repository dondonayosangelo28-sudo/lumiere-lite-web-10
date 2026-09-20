import { useEffect, useMemo, useState } from 'react'
import { Building2, Calendar as CalendarIcon, ChevronRight, Clock, FilterX, MapPin } from 'lucide-react'
import type { PortalEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { EventCalendar, parseEventDate } from '@/components/EventCalendar'

interface WarehouseCalendarEventsViewProps {
  events: PortalEvent[]
  onSelectEvent: (event: PortalEvent) => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const statusStyles: Record<string, { badge: string; dot: string }> = {
  Initialized: { badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  'In Production': { badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20', dot: 'bg-sky-500' },
  Completed: { badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  Settled: { badge: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/30 font-semibold', dot: 'bg-emerald-600' },
  'On Hold': { badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
  Reserved: { badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500' },
  Cancelled: { badge: 'bg-muted text-muted-foreground border-border line-through', dot: 'bg-muted-foreground' },
}

function parseDate(dateStr: string): Date | null {
  const parts = parseEventDate(dateStr)
  return parts ? new Date(parts.year, parts.month, parts.day) : null
}

function eventProgress(event: PortalEvent) {
  if (event.status === 'Completed' || event.status === 'Settled') return 100
  if (event.status === 'In Production') return 65
  if (event.status === 'On Hold') return 35
  return 15
}

export function WarehouseCalendarEventsView({ events, onSelectEvent }: WarehouseCalendarEventsViewProps) {
  const initialView = useMemo(() => {
    const first = events
      .map((event) => parseDate(event.targetDate))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime())[0]
    if (first) return { year: first.getFullYear(), month: first.getMonth() }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  }, [events])

  const [currentView, setCurrentView] = useState(initialView)
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => setCurrentView(initialView), [initialView])

  const monthEvents = useMemo(() => {
    const selected = selectedDate ? parseEventDate(selectedDate) : null
    return events
      .filter((event) => {
        const date = parseEventDate(event.targetDate)
        if (!date) return false
        if (selected) return date.year === selected.year && date.month === selected.month && date.day === selected.day
        return date.year === currentView.year && date.month === currentView.month
      })
      .sort((a, b) => (parseDate(a.targetDate)?.getTime() ?? 0) - (parseDate(b.targetDate)?.getTime() ?? 0))
  }, [events, currentView, selectedDate])

  const monthEventsAll = useMemo(() => events.filter((event) => {
    const date = parseEventDate(event.targetDate)
    return date?.year === currentView.year && date.month === currentView.month
  }), [events, currentView])

  const eventGroups = useMemo(() => {
    const groups = new Map<string, PortalEvent[]>()
    for (const event of monthEvents) {
      const date = parseEventDate(event.targetDate)
      const key = date ? `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}` : 'unscheduled'
      groups.set(key, [...(groups.get(key) ?? []), event])
    }
    return [...groups.entries()]
  }, [monthEvents])

  const monthPreviewEvents = monthEventsAll.slice(0, 4)
  const handleDateSelect = (date: string) => setSelectedDate((previous) => previous === date ? '' : date)
  const handleResetToToday = () => {
    const now = new Date()
    setCurrentView({ year: now.getFullYear(), month: now.getMonth() })
    setSelectedDate('')
  }

  return (
    <div className="grid grid-cols-1 gap-6 max-sm:gap-3 lg:grid-cols-12 lg:items-start">
      <div className="space-y-4 max-sm:space-y-3 lg:col-span-5 xl:col-span-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm max-sm:p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-card-foreground max-sm:text-[0.7rem]">Booking Calendar</span>
            </div>
            <button type="button" onClick={handleResetToToday} className="rounded-md border border-border bg-background px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground transition hover:bg-muted hover:text-foreground">Current Month</button>
          </div>
          <EventCalendar value={selectedDate} events={events} currentView={currentView} onMonthChange={setCurrentView} onSelect={handleDateSelect} enableYearView className="border-0 p-0 shadow-none" />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm max-sm:p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[0.65rem]">{MONTH_NAMES[currentView.month]} {currentView.year} Summary</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.62rem] font-bold text-primary">{monthEventsAll.length} {monthEventsAll.length === 1 ? 'Event' : 'Events'}</span>
          </div>
          <div className="mt-3">
            {monthPreviewEvents.length === 0 ? <p className="py-1.5 text-xs text-muted-foreground">No events scheduled.</p> : (
              <div>
                {monthPreviewEvents.map((event, index) => {
                  const date = parseDate(event.targetDate)
                  const progress = eventProgress(event)
                  return <button key={event.id} type="button" onClick={() => onSelectEvent(event)} title={`${event.title} — ${event.status}`} className={cn('flex w-full cursor-pointer items-center gap-2.5 rounded-md py-2 text-left hover:bg-muted/50', index < monthPreviewEvents.length - 1 && 'border-b border-border/40')}>
                    <span className="flex size-8 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-muted/40"><span className="font-serif text-sm leading-none text-card-foreground">{date?.getDate() ?? '—'}</span><span className="text-[0.5rem] uppercase leading-tight text-muted-foreground">{date?.toLocaleDateString('en-US', { weekday: 'short' }) ?? '—'}</span></span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-card-foreground">{event.title}</span>
                    <span className="flex shrink-0 items-center gap-2"><span className="h-1.5 w-20 rounded-full bg-muted"><span className={cn('block h-full rounded-full', progress < 20 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${progress}%` }} /></span><span className="w-8 text-right text-[0.6rem] font-semibold text-muted-foreground">{progress}%</span></span>
                  </button>
                })}
                {monthEventsAll.length > 4 && <p className="mt-1 text-xs text-muted-foreground">+{monthEventsAll.length - 4} more this month</p>}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-2"><span className="flex items-center gap-1.5 text-xs font-medium text-primary"><span>Warehouse event registry</span><ChevronRight className="size-3" /></span></div>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-7 xl:col-span-8">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><h2 className="font-serif text-xl font-medium text-card-foreground">{selectedDate ? `Events on ${selectedDate}` : `${MONTH_NAMES[currentView.month]} ${currentView.year} Events`}</h2><span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.65rem] font-bold text-foreground">{monthEvents.length}</span></div><p className="mt-0.5 text-xs text-muted-foreground">{selectedDate ? 'Filtered by clicked calendar day.' : `All active and scheduled events for ${MONTH_NAMES[currentView.month]} ${currentView.year}.`}</p></div>
          {selectedDate && <button type="button" onClick={() => setSelectedDate('')} className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:self-auto"><FilterX className="size-3.5" /><span>Show all for {MONTH_NAMES[currentView.month].slice(0, 3)}</span></button>}
        </div>

        {monthEvents.length === 0 ? <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{selectedDate ? `No events on ${selectedDate}` : `No events in ${MONTH_NAMES[currentView.month]} ${currentView.year}`}</div> : <div className="space-y-3">{eventGroups.map(([dateKey, group]) => <div key={dateKey} className="space-y-3">{group.map((event) => {
          const date = parseDate(event.targetDate)
          const status = statusStyles[event.status] ?? { badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' }
          return <div key={event.id} className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4.5 shadow-sm transition hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4"><div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/40 text-center"><span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">{date ? MONTH_NAMES[date.getMonth()].slice(0, 3).toUpperCase() : 'TBD'}</span><span className="font-serif text-lg font-bold leading-none text-foreground">{date?.getDate() ?? '—'}</span><span className="text-[0.55rem] font-medium text-muted-foreground">{date?.toLocaleDateString('en-US', { weekday: 'short' }) ?? ''}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">{event.refId}</span><span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider', status.badge)}><span className={cn('size-1.5 rounded-full', status.dot)} aria-hidden="true" />{event.status}</span></div><h3 className="mt-1 truncate font-serif text-base font-medium leading-snug text-card-foreground transition-colors group-hover:text-primary">{event.title}</h3><div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">{event.client && <span className="flex items-center gap-1 font-medium text-foreground/80"><Building2 className="size-3 text-muted-foreground" /><span className="max-w-[180px] truncate">{event.client}</span></span>}{event.venue && <span className="flex items-center gap-1"><MapPin className="size-3 text-muted-foreground" /><span className="max-w-[200px] truncate">{event.venue}</span></span>}{(event.installationStart || event.installationEnd) && <span className="flex items-center gap-1"><Clock className="size-3 text-muted-foreground" /><span>{event.installationStart || '08:00'} - {event.installationEnd || '23:00'}</span></span>}</div></div></div>
            <div className="flex shrink-0 items-center gap-2 border-t border-border/50 pt-3 sm:border-0 sm:pt-0"><button type="button" onClick={() => onSelectEvent(event)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-card-foreground transition hover:border-primary/30 hover:bg-muted">View</button><button type="button" onClick={() => onSelectEvent(event)} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary hover:text-primary-foreground">Edit</button></div>
          </div>
        })}</div>)}</div>}
      </div>
    </div>
  )
}

export default WarehouseCalendarEventsView
