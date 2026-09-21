import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { X, FileText, Building2, Palette, CalendarDays, Plus, Pencil, ImageIcon, FileDown } from 'lucide-react'
import { usePortal } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { EventCalendar } from '@/components/EventCalendar'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { NewEventDraft, PortalEvent } from '@/lib/types'
import { getCatalogAssets, type CatalogAsset } from '@/lib/warehouse-catalog'
import { exportEventAssetLogisticsReport } from '@/lib/event-asset-report-pdf'

type DrawerMode = 'create' | 'view' | 'edit'

interface Props {
  open: boolean
  onClose: () => void
  // When provided, the drawer opens bound to an existing event.
  event?: PortalEvent | null
  // Preselects the date when creating an event from a calendar day.
  initialDate?: string
  // 'create' registers a new event, 'view' is read-only, 'edit' saves changes.
  mode?: DrawerMode
}

const baseVenues = [
  'Grand Ballroom at Lumière Estate',
  'Riverside Pavilion',
  'Urban Loft Space',
  'Garden Terrace',
]

// Convert "4:00 PM" or "16:00" format to HTML time input format "16:00"
function normalizeTimeFormat(time: string): string {
  if (!time) return ''
  // If already in HH:MM format, return as-is
  if (/^\d{1,2}:\d{2}$/.test(time)) return time
  // Convert "4:00 PM" or "4:00 AM" to "16:00" or "04:00"
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return time
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const meridiem = match[3]?.toUpperCase()
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

const ADD_VENUE = '__add_new_venue__'

const emptyDraft: NewEventDraft = {
  title: '',
  client: '',
  venue: '',
  targetDate: '',
  installationStart: '',
  installationEnd: '',
  moodPlan: '',
  geoClass: 'Local',
  ingressDate: '',
  ingressTime: '',
  fullStop: '',
  returnDate: '',
  eventPegs: '',
  colorPalette: '',
  brandingAndTextures: '',
  notes: '',
}

const labelClass =
  'block max-w-full break-words text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground'
const inputClass =
  'mt-2 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30 max-md:w-full max-md:min-w-0 max-md:max-w-full'

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof FileText
  children: string
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <Icon className="size-3.5 text-primary" />
      <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-card-foreground">
        {children}
      </h3>
    </div>
  )
}

export function RegisterEventDrawer({ open, onClose, event = null, initialDate = '', mode = 'create' }: Props) {
  const { addEvent, updateEvent, events, settleEvent } = usePortal()
  const { adminRole, isExecutive } = useAuth()
  const [draft, setDraft] = useState<NewEventDraft>(emptyDraft)
  const [showCalendar, setShowCalendar] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Custom venues added on the fly via the "+ Add New Venue" option.
  const [customVenues, setCustomVenues] = useState<string[]>([])
  const [addingVenue, setAddingVenue] = useState(false)
  const [newVenue, setNewVenue] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'assets'>('details')
  const [eventAssets, setEventAssets] = useState<Array<{ asset: CatalogAsset; quantity: number }>>([])
  const [editingAsset, setEditingAsset] = useState<{ asset: CatalogAsset; quantity: number } | null>(null)
  const [assetQuantity, setAssetQuantity] = useState('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState('')

  const readOnly = mode === 'view'

  useEffect(() => {
    if (!open) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 767px)').matches) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setActiveTab('details')
    setEditingAsset(null)
    setValidationAttempted(false)
    if (event) {
      const catalog = getCatalogAssets().filter((asset) => (asset.currentStock ?? 0) > 0)
      const offset = event.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(catalog.length, 1)
      setEventAssets(catalog.slice(offset, offset + 4).concat(catalog.slice(0, Math.max(0, offset + 4 - catalog.length))).map((asset, index) => ({
        asset,
        quantity: Math.min(asset.currentStock ?? 1, index + 1),
      })))
    } else {
      setEventAssets([])
    }
  }, [open, event])

  const openAssetEditor = (allocation: { asset: CatalogAsset; quantity: number }) => {
    setEditingAsset(allocation)
    setAssetQuantity(String(allocation.quantity))
  }

  const saveAssetAllocation = () => {
    if (!editingAsset) return
    const quantity = Number(assetQuantity)
    const available = editingAsset.asset.currentStock ?? 0
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > available) return
    setEventAssets((current) => current.map((item) => item.asset.id === editingAsset.asset.id ? { ...item, quantity } : item))
    setEditingAsset(null)
  }

  const addAssetAllocation = () => {
    const next = getCatalogAssets().find((asset) => !eventAssets.some((item) => item.asset.id === asset.id))
    if (next) setEventAssets((current) => [...current, { asset: next, quantity: 1 }])
  }

  // Sync the form with the bound event whenever the drawer opens (or the
  // target event changes). Create mode falls back to a blank draft.
  useEffect(() => {
    if (!open) return
    if (event) {
      setDraft({
        title: event.title,
        client: event.client,
        venue: event.venue,
        targetDate: event.targetDate,
        installationStart: normalizeTimeFormat(event.installationStart),
        installationEnd: normalizeTimeFormat(event.installationEnd),
        moodPlan: event.moodPlan ?? '',
        geoClass: 'Local',
        ingressDate: event.installationStart || event.targetDate,
        ingressTime: normalizeTimeFormat(event.ingressTime ?? ''),
        fullStop: normalizeTimeFormat(event.fullStop ?? ''),
        returnDate: event.installationEnd || event.targetDate,
      })
    } else {
      const targetDate = initialDate || ''
      setDraft({
        ...emptyDraft,
        targetDate,
        ingressDate: targetDate,
        returnDate: targetDate,
      })
    }
  }, [open, event, initialDate])

  const venues = [...baseVenues, ...customVenues]

  const set = (key: keyof NewEventDraft, value: string) => {
    if (readOnly) return
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const downloadReport = async () => {
    if (!event || !isExecutive || isGeneratingReport) return
    setReportError('')
    setIsGeneratingReport(true)
    try {
await exportEventAssetLogisticsReport(event, isExecutive, eventAssets.map(({ asset, quantity }) => ({ name: asset.name, qty: quantity, category: asset.category, status: asset.status, available: asset.currentStock })))
    } catch (error) {
      console.warn('[v0] Event report generation failed:', error)
      setReportError(error instanceof Error ? error.message : 'Unable to generate the report.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const close = () => {
    setDraft(emptyDraft)
    setReportError('')
    setPdfPreview(null)
    setValidationAttempted(false)
    setShowCalendar(false)
    setConfirmOpen(false)
    setAddingVenue(false)
    setNewVenue('')
    onClose()
  }

  const requiredFieldsComplete = Boolean(
    draft.title.trim() &&
      draft.client.trim() &&
      draft.venue.trim() &&
      draft.targetDate &&
      draft.ingressDate &&
      draft.ingressTime &&
      draft.fullStop &&
      draft.installationStart &&
      draft.installationEnd,
  )

  const submit = async () => {
    setValidationAttempted(true)
    if (!requiredFieldsComplete || isSubmitting) return
    setSubmitError('')
    setIsSubmitting(true)
    try {
      if (mode === 'edit' && event) {
        updateEvent(event.id, draft, adminRole || 'Executive')
      } else {
        await addEvent(draft, adminRole || 'Executive')
      }
      close()
    } catch (error) {
      console.warn('[v0] Event registration failed:', error)
      setSubmitError(error instanceof Error ? error.message : 'Unable to register the event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const commitNewVenue = () => {
    const v = newVenue.trim()
    if (!v) {
      setAddingVenue(false)
      return
    }
    if (!venues.includes(v)) setCustomVenues((prev) => [...prev, v])
    set('venue', v)
    setNewVenue('')
    setAddingVenue(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex h-full items-start justify-center overflow-y-auto p-4 sm:items-center max-md:h-[100dvh] max-md:p-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Overlay */}
      <div className="fixed inset-0 h-full bg-neutral-700/60 backdrop-blur-sm max-md:h-[100dvh] max-md:bg-black/40 max-md:backdrop-blur-none" onClick={close} />

      {/* Centered modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'Register new event' : 'Event details'}
        className="relative z-10 my-8 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-card shadow-2xl max-md:my-0 max-md:max-h-full max-md:shadow-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5 md:shrink-0">
          <div>
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {mode === 'create'
                ? 'Lumière · Planning — Initialization Mode'
                : mode === 'edit'
                  ? 'Lumière · Planning — Edit Mode'
                  : 'Lumière · Planning — Read-Only View'}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-medium text-card-foreground">
              {mode === 'create'
                ? 'Register New Event'
                : mode === 'edit'
                  ? 'Edit Event'
                  : 'View Event'}
            </h2>
            <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.15em] text-muted-foreground">
              Ref ID: {event?.refId ?? 'PRT-Pending-2026'}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              close()
            }}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close event registration"
            data-testid="register-event-close"
          >
            <X className="size-5" />
          </button>
        </div>

        {mode === 'view' && (
          <div className="grid grid-cols-2 border-b border-border px-6" role="tablist" aria-label="View event sections">
            {[
              { id: 'details' as const, label: 'Event Details' },
              { id: 'assets' as const, label: 'Assets' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-2 py-3 text-[0.62rem] font-bold uppercase tracking-[0.12em] transition ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'details' || mode !== 'view' ? (
        /* Body */
        <fieldset
          disabled={readOnly}
          className="min-h-0 max-h-[calc(90vh-200px)] space-y-7 overflow-y-auto overscroll-contain px-6 py-6 disabled:opacity-90 max-md:flex-1 max-md:max-h-none max-md:pb-6 max-md:scroll-pb-24 md:flex-1 md:pb-6"
        >
          {/* Core */}
          <div className="space-y-4">
            <SectionHeading icon={FileText}>Core Portfolio Characteristics</SectionHeading>
            <div>
              <label className={labelClass} htmlFor="ev-title">
                Event Concept / Title <span className="text-destructive">*</span>
              </label>
              <input
                id="ev-title"
                className={inputClass}
                placeholder="e.g. La Nuit Dorée..."
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ev-client">
                Client / Organizer Name <span className="text-destructive">*</span>
              </label>
              <input
                id="ev-client"
                className={inputClass}
                placeholder="Optional — enter primary stakeholder..."
                value={draft.client}
                onChange={(e) => set('client', e.target.value)}
              />
            </div>
          </div>

          {/* Venue & Timeline */}
          <div className="space-y-4">
            <SectionHeading icon={Building2}>Venue &amp; Timeline Matrices</SectionHeading>
            <div>
              <label className={labelClass} htmlFor="ev-venue">
                  Bind to Registry Venue <span className="text-destructive">*</span>

              </label>
              {addingVenue ? (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30"
                    placeholder="Type a new venue name..."
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitNewVenue()
                    }}
                  />
                  <button
                    type="button"
                    onClick={commitNewVenue}
                    className="shrink-0 rounded-md bg-primary px-4 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-primary-foreground transition hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  id="ev-venue"
                  className={`${inputClass} appearance-none`}
                  value={draft.venue}
                  onChange={(e) => {
                    if (e.target.value === ADD_VENUE) {
                      setAddingVenue(true)
                      return
                    }
                    set('venue', e.target.value)
                  }}
                >
                  <option value="" disabled hidden>Select an established estate…</option>
                  {venues.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                  <option value={ADD_VENUE}>+ Add New Venue</option>
                </select>
              )}
            </div>

            <div className="relative">
              <label className={labelClass} htmlFor="ev-date">
                Event Date <span className="text-destructive">*</span>
              </label>
              <button
                id="ev-date"
                type="button"
                onClick={() => setShowCalendar((v) => !v)}
                className={`${inputClass} flex items-center justify-between text-left`}
                aria-expanded={showCalendar}
                aria-controls={showCalendar ? 'event-date-calendar' : undefined}
              >
                <span className={draft.targetDate ? 'text-foreground' : 'text-muted-foreground/60'}>
                  {draft.targetDate || 'Select a date'}
                </span>
                <CalendarDays className="size-4 text-muted-foreground" />
              </button>
            </div>

            {showCalendar && (
              <div id="event-date-calendar">
                <EventCalendar
                  value={draft.targetDate}
                  events={events}
                  onSelect={(date) => {
                    set('targetDate', date)
                    setShowCalendar(false)
                  }}
                />
              </div>
            )}

            <div className="grid min-w-0 grid-cols-2 gap-3 max-md:grid max-md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] max-md:items-end max-md:gap-3 max-md:w-full max-md:min-w-0 max-md:overflow-hidden">
              <div className="min-w-0 max-md:min-w-0 max-md:w-full max-md:max-w-full">
                <label className={`${labelClass} max-md:whitespace-nowrap max-md:text-[10px] max-md:tracking-[0.08em]`} htmlFor="ev-start">
                  Event Start Time <span className="text-destructive">*</span>
                </label>
                <input
                  id="ev-start"
                  type="time"
                  className={`${inputClass} max-md:w-full max-md:min-w-0 max-md:max-w-full max-md:box-border max-md:appearance-none max-md:[-webkit-appearance:none] max-md:px-3 max-md:text-[14px] max-md:[&::-webkit-date-and-time-value]:min-w-0 max-md:[&::-webkit-date-and-time-value]:text-left max-md:[&::-webkit-calendar-picker-indicator]:hidden`}
                  value={draft.installationStart}
                  onChange={(e) => set('installationStart', e.target.value)}
                />
              </div>
              <div className="min-w-0 max-md:min-w-0 max-md:w-full max-md:max-w-full">
                <label className={`${labelClass} max-md:whitespace-nowrap max-md:text-[10px] max-md:tracking-[0.08em]`} htmlFor="ev-end">
                  Event End Time <span className="text-destructive">*</span>
                </label>
                <input
                  id="ev-end"
                  type="time"
                  className={`${inputClass} max-md:w-full max-md:min-w-0 max-md:max-w-full max-md:box-border max-md:appearance-none max-md:[-webkit-appearance:none] max-md:px-3 max-md:text-[14px] max-md:[&::-webkit-date-and-time-value]:min-w-0 max-md:[&::-webkit-date-and-time-value]:text-left max-md:[&::-webkit-calendar-picker-indicator]:hidden`}
                  value={draft.installationEnd}
                  onChange={(e) => set('installationEnd', e.target.value)}
                />
              </div>
            </div>

            {/* Geographic Classification & Logistics Ingress/Return/Fullstop */}
            <div>
              <label className={labelClass} htmlFor="ev-geo">
                Geographic Scope
              </label>
              <select
                id="ev-geo"
                className={`${inputClass} appearance-none`}
                value={draft.geoClass || 'Local'}
                onChange={(e) => set('geoClass', e.target.value)}
              >
                <option value="Local">Local (NCR / Metro - 1-day transit buffer)</option>
                <option value="National">National (Regional - 3-day transit buffer)</option>
              </select>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 max-md:grid max-md:grid-cols-2 max-md:gap-3 max-md:w-full max-md:min-w-0">
              <div className="min-w-0 max-md:min-w-0 max-md:w-full max-md:max-w-full">
                <label className={`${labelClass} max-md:whitespace-nowrap max-md:text-[10px] max-md:tracking-[0.08em]`} htmlFor="ev-ingress-date">
                  Ingress <span className="whitespace-nowrap">Date <span className="text-destructive">*</span></span>
                </label>
                <input
                  id="ev-ingress-date"
                  type="date"
                  className={`${inputClass} max-md:w-full max-md:min-w-0 max-md:max-w-full max-md:box-border max-md:appearance-none max-md:[-webkit-appearance:none] max-md:px-3 max-md:text-[12px] max-md:[&::-webkit-date-and-time-value]:min-w-0 max-md:[&::-webkit-date-and-time-value]:text-left max-md:[&::-webkit-calendar-picker-indicator]:hidden`}
                  value={draft.ingressDate || (draft.targetDate ? draft.targetDate : '')}
                  onChange={(e) => set('ingressDate', e.target.value)}
                />
              </div>
              <div className="min-w-0 max-md:min-w-0 max-md:w-full max-md:max-w-full">
                <label className={`${labelClass} max-md:whitespace-nowrap max-md:text-[10px] max-md:tracking-[0.08em]`} htmlFor="ev-return-date">
                  Egress / Return <span className="whitespace-nowrap">Date <span className="text-destructive">*</span></span>
                </label>
                <input
                  id="ev-return-date"
                  type="date"
                  className={`${inputClass} max-md:w-full max-md:min-w-0 max-md:max-w-full max-md:box-border max-md:appearance-none max-md:[-webkit-appearance:none] max-md:px-3 max-md:text-[12px] max-md:[&::-webkit-date-and-time-value]:min-w-0 max-md:[&::-webkit-date-and-time-value]:text-left max-md:[&::-webkit-calendar-picker-indicator]:hidden`}
                  value={draft.returnDate || (draft.targetDate ? draft.targetDate : '')}
                  onChange={(e) => set('returnDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 max-md:grid max-md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] max-md:items-end max-md:gap-3 max-md:w-full max-md:min-w-0 max-md:overflow-hidden">
              <div className="min-w-0 max-md:min-w-0 max-md:w-full max-md:max-w-full">
                <label className={`${labelClass} max-md:whitespace-nowrap max-md:text-[10px] max-md:tracking-[0.08em]`} htmlFor="ev-ingress-time">
                  Ingress Time <span className="text-destructive">*</span>
                </label>
                <input
                  id="ev-ingress-time"
                  type="time"
                  className={`${inputClass} max-md:w-full max-md:min-w-0 max-md:max-w-full max-md:box-border max-md:appearance-none max-md:[-webkit-appearance:none] max-md:px-3 max-md:text-[14px] max-md:[&::-webkit-date-and-time-value]:min-w-0 max-md:[&::-webkit-date-and-time-value]:text-left max-md:[&::-webkit-calendar-picker-indicator]:hidden`}
                  value={draft.ingressTime || ''}
                  onChange={(e) => set('ingressTime', e.target.value)}
                />
              </div>
              <div className="min-w-0 max-md:min-w-0 max-md:w-full max-md:max-w-full">
                <label className={`${labelClass} max-md:whitespace-nowrap max-md:text-[10px] max-md:tracking-[0.08em]`} htmlFor="ev-fullstop">
                  Full Stop Time <span className="text-destructive">*</span>
                </label>
                <input
                  id="ev-fullstop"
                  type="time"
                  className={`${inputClass} max-md:w-full max-md:min-w-0 max-md:max-w-full max-md:box-border max-md:appearance-none max-md:[-webkit-appearance:none] max-md:px-3 max-md:text-[14px] max-md:[&::-webkit-date-and-time-value]:min-w-0 max-md:[&::-webkit-date-and-time-value]:text-left max-md:[&::-webkit-calendar-picker-indicator]:hidden`}
                  value={draft.fullStop || ''}
                  onChange={(e) => set('fullStop', e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* Styling */}
          <div className="space-y-4">
            <SectionHeading icon={Palette}>Styling Essence</SectionHeading>
            <div>
              <label className={labelClass} htmlFor="ev-mood">
                Initial Creative Vision &amp; Design Mood Plan
              </label>
              <textarea
                id="ev-mood"
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Describe the atmosphere, textures, and sensory objectives..."
                value={draft.moodPlan}
                onChange={(e) => set('moodPlan', e.target.value)}
              />
            </div>
          </div>
        </fieldset>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 max-md:px-3 max-md:pt-3 md:pb-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-card-foreground">Assigned event assets</p>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">Assets currently planned or reserved for this event.</p>
              </div>
              {!readOnly && (
                <button type="button" onClick={addAssetAllocation} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-primary-foreground hover:opacity-90">
                  <Plus className="size-3" /> Add Asset
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="hidden grid-cols-[3rem_minmax(0,1fr)_4.5rem_4.5rem_5rem_3rem] gap-2 bg-muted/40 px-3 py-2 text-[0.52rem] font-bold uppercase tracking-[0.1em] text-muted-foreground sm:grid">
                <span>Image</span><span>Asset Name</span><span>Qty</span><span>Available</span><span>Status</span><span>Edit</span>
              </div>
              {eventAssets.map((allocation) => (
                <div key={allocation.asset.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.2rem_3.5rem_4.5rem_2rem] items-center gap-2 border-t border-border/60 px-3 py-2.5 first:border-t-0 sm:grid-cols-[3rem_minmax(0,1fr)_4.5rem_4.5rem_5rem_3rem] max-md:grid-cols-[2.25rem_minmax(0,1fr)_auto] max-md:items-start max-md:px-3 max-md:py-3">
                  {allocation.asset.image ? <img src={allocation.asset.image} alt="" className="size-9 rounded-md object-cover max-md:row-span-2" /> : <div className="flex size-9 items-center justify-center rounded-md bg-muted max-md:row-span-2"><ImageIcon className="size-4 text-muted-foreground" /></div>}
                  <div className="min-w-0"><p className="line-clamp-2 text-[0.68rem] font-medium text-card-foreground">{allocation.asset.name}</p><p className="whitespace-nowrap text-[0.58rem] text-muted-foreground sm:hidden">{allocation.quantity} assigned · {allocation.asset.currentStock ?? 0} available</p></div>
                  <span className="text-xs text-card-foreground max-md:hidden">{allocation.quantity}</span>
                  <span className="text-xs text-muted-foreground max-md:hidden">{allocation.asset.currentStock ?? 0}</span>
                  <span className="shrink-0 whitespace-nowrap text-[0.55rem] font-bold uppercase tracking-[0.08em] text-emerald-700">{allocation.asset.status}</span>
                  {!readOnly ? <button type="button" onClick={() => openAssetEditor(allocation)} aria-label={`Edit ${allocation.asset.name}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground max-md:col-start-3 max-md:row-start-2"><Pencil className="size-3.5" /></button> : <span />}
                </div>
              ))}
            </div>
            {editingAsset && (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between"><p className="text-xs font-semibold text-card-foreground">Edit allocation</p><button type="button" onClick={() => setEditingAsset(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button></div>
                <label className={labelClass} htmlFor="asset-quantity">Assigned quantity</label>
                <input id="asset-quantity" type="number" min="1" max={editingAsset.asset.currentStock ?? 0} value={assetQuantity} onChange={(e) => setAssetQuantity(e.target.value)} className={inputClass} />
                <p className="mt-2 text-[0.62rem] text-muted-foreground">Maximum available: {editingAsset.asset.currentStock ?? 0}</p>
                <button type="button" onClick={saveAssetAllocation} className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary-foreground hover:opacity-90">Save Allocation</button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 space-y-3 border-t border-border bg-card px-6 py-4 max-md:px-4 max-md:pt-3 max-md:pb-4 md:shrink-0 md:pt-4 md:pb-5 md:z-10">
          {(submitError || reportError) && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError || reportError}
            </p>
          )}
          {!readOnly && validationAttempted && !requiredFieldsComplete && (
            <p role="status" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              Required information missing: event title, client, venue, dates, and installation times must be completed.
            </p>
          )}
          {event?.status === 'Completed' && (
            <button
              type="button"
              onClick={() => {
                const result = settleEvent(event.id)
                if (result.success) close()
              }}
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700"
            >
              Settle Event
            </button>
          )}

          {readOnly ? (
            isExecutive ? (
              <button
                type="button"
                onClick={downloadReport}
                disabled={isGeneratingReport}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGeneratingReport ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                {isGeneratingReport ? 'Generating…' : 'Download PDF'}
              </button>
            ) : (
              <button
                type="button"
                onClick={close}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-card-foreground transition hover:bg-muted"
              >
                Close
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                setValidationAttempted(true)
                if (requiredFieldsComplete && !isSubmitting) setConfirmOpen(true)
              }}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              {isSubmitting ? 'Registering Event…' : mode === 'edit' ? 'Save Changes' : 'Initialize Event Registry'}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        eyebrow={mode === 'edit' ? 'Registry Update' : 'Registry Initialization'}
        title={mode === 'edit' ? 'Confirm Event Changes' : 'Confirm New Event'}
        tone="default"
        confirmLabel={mode === 'edit' ? 'Save Changes' : 'Initialize Registry'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false)
          await submit()
        }}
        description={
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold text-card-foreground">
                {draft.title || 'Untitled Event'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {draft.client || 'No client'} · {draft.targetDate || 'No date set'}
              </p>
            </div>
            <p>This will register the new event in the portfolio registry. Proceed?</p>
          </div>
        }
      />
    </div>
  )
}
