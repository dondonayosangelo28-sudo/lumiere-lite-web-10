import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortalEvent } from '@/lib/types'

export interface EventCalendarProps {
  /* Currently selected date string, e.g. "Oct 14, 2026" or "2026-10-14" */
  value?: string
  /* Existing events used to flag booked days */
  events: PortalEvent[]
  /* Selection callback */
  onSelect?: (dateString: string) => void
  /* Optional controlled view month/year */
  currentView?: { year: number; month: number }
  /* Callback when month view changes */
  onMonthChange?: (view: { year: number; month: number }) => void
  /* Optional full-year picker for dashboard calendars */
  enableYearView?: boolean
  className?: string
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function parseEventDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null
  const clean = dateStr.split('T')[0].trim()
  const ymdMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10)
    const m = parseInt(ymdMatch[2], 10) - 1
    const d = parseInt(ymdMatch[3], 10)
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d }
    }
  }
  const parsed = new Date(dateStr)
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth(),
      day: parsed.getDate(),
    }
  }
  return null
}

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`

export function EventCalendar({
  value = '',
  events,
  onSelect,
  currentView,
  onMonthChange,
  enableYearView = false,
  className,
}: EventCalendarProps) {
  // Map of booked day keys -> event details
  const booked = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>()
    for (const ev of events) {
      const parts = parseEventDate(ev.targetDate)
      if (parts) {
        const key = dayKey(parts.year, parts.month, parts.day)
        const existing = map.get(key)
        if (existing) {
          existing.count += 1
          existing.title += `, ${ev.title}`
        } else {
          map.set(key, { title: ev.title, count: 1 })
        }
      }
    }
    return map
  }, [events])

  const selectedParts = useMemo(() => {
    if (!value) return null
    return parseEventDate(value)
  }, [value])

  const [yearPopupOpen, setYearPopupOpen] = useState(false)
  const [popupYear, setPopupYear] = useState(() => (currentView?.year ?? new Date().getFullYear()))

  useEffect(() => {
    if (!yearPopupOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setYearPopupOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [yearPopupOpen])

  const [internalView, setInternalView] = useState<{ year: number; month: number }>(() => {
    if (currentView) return currentView
    if (selectedParts) return { year: selectedParts.year, month: selectedParts.month }
    // Fall back to first event's date or current date
    if (events.length > 0) {
      const firstParts = parseEventDate(events[0].targetDate)
      if (firstParts) return { year: firstParts.year, month: firstParts.month }
    }
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const view = currentView || internalView

  const firstWeekday = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const shiftMonth = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1)
    const newView = { year: next.getFullYear(), month: next.getMonth() }
    setInternalView(newView)
    if (onMonthChange) {
      onMonthChange(newView)
    }
  }

  // Count booked days in the currently viewed month
  const bookedCountInMonth = useMemo(() => {
    let count = 0
    for (let day = 1; day <= daysInMonth; day++) {
      if (booked.has(dayKey(view.year, view.month, day))) {
        count++
      }
    }
    return count
  }, [booked, view.year, view.month, daysInMonth])

  return (
    <div className={cn('executive-calendar rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        {enableYearView ? (
          <button
            type="button"
            aria-haspopup="dialog"
            title="View full year"
            onClick={() => {
              setPopupYear(view.year)
              setYearPopupOpen(true)
            }}
            className="cursor-pointer rounded-md px-3 py-1 text-center hover:bg-muted"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
              {MONTHS[view.month]} {view.year}
            </p>
            <p className="text-[0.6rem] text-muted-foreground">
              {bookedCountInMonth} {bookedCountInMonth === 1 ? 'day booked' : 'days booked'}
            </p>
          </button>
        ) : (
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
              {MONTHS[view.month]} {view.year}
            </p>
            <p className="text-[0.6rem] text-muted-foreground">
              {bookedCountInMonth} {bookedCountInMonth === 1 ? 'day booked' : 'days booked'}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[0.58rem] font-bold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} className="h-9" />
          const key = dayKey(view.year, view.month, day)
          const bookingInfo = booked.get(key)
          const isBooked = !!bookingInfo
          const isSelected =
            selectedParts !== null &&
            selectedParts.year === view.year &&
            selectedParts.month === view.month &&
            selectedParts.day === day

          const date = new Date(view.year, view.month, day)

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect?.(fmt(date))}
              title={isBooked ? `Booked (${bookingInfo.count}): ${bookingInfo.title}` : fmt(date)}
              className={cn(
                'group relative flex h-9 w-full flex-col items-center justify-center rounded-lg text-xs font-medium transition cursor-pointer',
                isSelected
                  ? 'bg-primary font-bold text-primary-foreground shadow-sm'
                  : isBooked
                    ? 'bg-rose-500/10 font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                    : 'text-foreground hover:bg-muted',
              )}
            >
              <span>{day}</span>
              {isBooked && !isSelected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-rose-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[0.62rem] font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-rose-500" /> Booked
          </span>
          <span className="flex items-center gap-1.5 text-[0.62rem] font-medium text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" /> Selected
          </span>
        </div>
        {value && onSelect && (
          <button
            type="button"
            onClick={() => onSelect('')}
            className="text-[0.6rem] font-semibold uppercase tracking-wider text-primary hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>

      {enableYearView && yearPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setYearPopupOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-year-title"
            className="max-h-[92vh] w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-t-[28px] rounded-b-none border border-white/40 dark:border-white/10 bg-card/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl backdrop-saturate-150 transition duration-[220ms] ease-out motion-reduce:transition-opacity sm:max-w-4xl sm:rounded-[28px] sm:p-7"
          >
            <div className="mx-auto mt-2 mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/30 sm:hidden" />
            <div className="flex items-start justify-between gap-4 pb-4">
              <div>
                <h2 id="calendar-year-title" className="text-4xl font-semibold tracking-tight text-foreground">{popupYear}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {Array.from({ length: 12 }, (_, month) =>
                    Array.from({ length: new Date(popupYear, month + 1, 0).getDate() }, (_, i) => i + 1)
                      .filter((day) => booked.has(dayKey(popupYear, month, day))).length,
                  ).reduce((sum, count) => sum + count, 0)} event days
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPopupYear((year) => year - 1)} className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-foreground/80 backdrop-blur transition hover:bg-muted active:scale-95" aria-label="Previous year"><ChevronLeft className="size-4" /></button>
                <button type="button" onClick={() => setPopupYear((year) => year + 1)} className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-foreground/80 backdrop-blur transition hover:bg-muted active:scale-95" aria-label="Next year"><ChevronRight className="size-4" /></button>
                <button type="button" onClick={() => setPopupYear(new Date().getFullYear())} className="rounded-full bg-muted/60 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur hover:bg-muted">Today</button>
                <button type="button" onClick={() => setYearPopupOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-foreground/80 backdrop-blur transition hover:bg-muted active:scale-95" aria-label="Close year view"><X className="size-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
              {MONTHS.map((monthName, month) => {
                const monthDays = new Date(popupYear, month + 1, 0).getDate()
                const start = new Date(popupYear, month, 1).getDay()
                const miniCells = [...Array<null>(start).fill(null), ...Array.from({ length: monthDays }, (_, i) => i + 1)]
                const now = new Date()
                const isDisplayedMonth = view.year === popupYear && view.month === month
                const isCurrentMonth = now.getFullYear() === popupYear && now.getMonth() === month
                return (
                  <div key={monthName}>
                    <button type="button" onClick={() => { const next = { year: popupYear, month }; setInternalView(next); onMonthChange?.(next); setYearPopupOpen(false) }} className={cn('text-base font-semibold tracking-tight hover:opacity-80', isDisplayedMonth || isCurrentMonth ? 'text-primary' : 'text-foreground')}>{monthName}</button>
                    <div className="mt-2 grid grid-cols-7 text-center text-[0.6rem] font-medium text-muted-foreground/70">{WEEKDAYS.map((day) => <span key={day}>{day.slice(0, 1)}</span>)}</div>
                    <div className="mt-1 grid grid-cols-7 justify-items-center gap-y-1 text-center text-[0.72rem] tabular-nums">
                      {miniCells.map((day, index) => {
                        if (day === null) return <span key={`empty-${index}`} className="h-6 w-6" />
                        const key = dayKey(popupYear, month, day)
                        const isBooked = booked.has(key)
                        const isSelected = selectedParts?.year === popupYear && selectedParts.month === month && selectedParts.day === day
                        const isToday = now.getFullYear() === popupYear && now.getMonth() === month && now.getDate() === day
                        const isWeekend = index % 7 === 0 || index % 7 === 6
                        const date = new Date(popupYear, month, day)
                        return <button key={key} type="button" title={isBooked ? booked.get(key)?.title : fmt(date)} onClick={() => { const next = { year: popupYear, month }; setInternalView(next); onMonthChange?.(next); if (isBooked) onSelect?.(fmt(date)); setYearPopupOpen(false) }} className={cn('relative flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-muted/60', isToday ? 'bg-primary font-semibold text-primary-foreground' : isSelected ? 'ring-[1.5px] ring-primary' : isWeekend ? 'text-muted-foreground/70' : 'text-foreground')}>{day}{isBooked && !isToday && <span className="absolute bottom-0.5 size-[3px] rounded-full bg-rose-500" />}</button>
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-[0.65rem] text-muted-foreground"><span><span className="text-rose-500">●</span> Event day</span><span><span className="text-primary">●</span> Today</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
