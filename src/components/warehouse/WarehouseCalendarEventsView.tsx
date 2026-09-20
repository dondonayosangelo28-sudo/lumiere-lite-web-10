import { useMemo, useState } from 'react'
import type { PortalEvent } from '@/lib/types'
import { EventCalendar, parseEventDate } from '@/components/EventCalendar'
import { cn } from '@/lib/utils'

interface WarehouseCalendarEventsViewProps {
  events: PortalEvent[]
  onSelectEvent: (event: PortalEvent) => void
}

function getIngressCountdownBadge(targetDateStr: string): { label: string; style: string } {
  const eventDate = parseEventDate(targetDateStr)
  if (!eventDate) return { label: 'Date TBD', style: 'bg-muted border-border/50 text-muted-foreground font-medium' }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const targetStart = new Date(eventDate.year, eventDate.month, eventDate.day).getTime()
  const diffDays = Math.ceil((targetStart - todayStart) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Completed', style: 'bg-muted border-border/50 text-muted-foreground font-medium' }
  if (diffDays === 0) return { label: 'Today', style: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' }
  if (diffDays === 1) return { label: 'Tomorrow', style: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' }
  if (diffDays <= 3) return { label: `${diffDays} days left`, style: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold' }
  if (diffDays <= 6) return { label: `${diffDays} days left`, style: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold' }
  if (diffDays <= 13) return { label: '1 week left', style: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold' }
  if (diffDays <= 29) {
    const weeks = Math.floor(diffDays / 7)
    return { label: `${weeks} week${weeks === 1 ? '' : 's'} left`, style: 'bg-slate-500/15 border-slate-500/30 text-slate-600 dark:text-slate-400 font-medium' }
  }
  if (diffDays <= 59) return { label: '1 month left', style: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium' }
  const months = Math.floor(diffDays / 30)
  return { label: `${months} month${months === 1 ? '' : 's'} left`, style: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium' }
}

function dateKey(dateString: string): string | null {
  const date = parseEventDate(dateString)
  if (!date) return null
  return `${date.year}-${date.month + 1}-${date.day}`
}

export function WarehouseCalendarEventsView({ events, onSelectEvent }: WarehouseCalendarEventsViewProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => (parseEventDate(a.targetDate)?.year ?? 9999) - (parseEventDate(b.targetDate)?.year ?? 9999) || (parseEventDate(a.targetDate)?.month ?? 0) - (parseEventDate(b.targetDate)?.month ?? 0) || (parseEventDate(a.targetDate)?.day ?? 0) - (parseEventDate(b.targetDate)?.day ?? 0)),
    [events],
  )
  const firstEventDate = sortedEvents[0]?.targetDate ?? ''
  const [selectedDate, setSelectedDate] = useState(firstEventDate)

  const selectedEvents = useMemo(() => {
    const selectedKey = dateKey(selectedDate)
    if (!selectedKey) return []
    return events.filter((event) => dateKey(event.targetDate) === selectedKey)
  }, [events, selectedDate])

  const handleSelectDate = (date: string) => setSelectedDate(date)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <EventCalendar
            events={events}
            value={selectedDate}
            onSelect={handleSelectDate}
            enableYearView
            className="h-full"
          />
        </div>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-4" aria-labelledby="selected-date-events">
          <div className="border-b border-border pb-4">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary">Selected date</p>
            <h2 id="selected-date-events" className="mt-1 font-serif text-xl font-medium text-card-foreground">
              {selectedDate || 'Choose a date'}
            </h2>
            <p className="mt-1 text-[0.65rem] text-muted-foreground">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'} scheduled
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {selectedEvents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No events scheduled for this date.</p>
            ) : (
              selectedEvents.map((event) => (
                <button key={event.id} type="button" onClick={() => onSelectEvent(event)} className="group w-full rounded-lg border border-border bg-background p-3 text-left transition hover:border-primary/50 hover:bg-accent/40">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-sm font-medium text-card-foreground group-hover:text-primary">{event.title}</h3>
                    <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[0.52rem] uppercase tracking-wider', getIngressCountdownBadge(event.targetDate).style)}>
                      {getIngressCountdownBadge(event.targetDate).label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[0.65rem] text-muted-foreground">{event.venue} · {event.client}</p>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="upcoming-events">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 id="upcoming-events" className="font-serif text-xl font-medium text-card-foreground">Upcoming Events ({sortedEvents.length})</h2>
            <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Operations roster</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedEvents.map((event) => {
            const countdown = getIngressCountdownBadge(event.targetDate)
            return (
              <button key={event.id} type="button" onClick={() => onSelectEvent(event)} className="group rounded-xl border border-border bg-background p-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/40">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-sm font-medium text-card-foreground group-hover:text-primary">{event.title}</h3>
                  <span className={cn('shrink-0 rounded-full border px-2.5 py-0.5 text-[0.55rem] uppercase tracking-wider', countdown.style)}>{countdown.label}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[0.62rem] text-muted-foreground">
                  <span className="min-w-0 truncate font-semibold text-card-foreground">{event.venue}</span>
                  <span className="shrink-0 whitespace-nowrap">· {event.targetDate}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default WarehouseCalendarEventsView
