import { API_BASE_URL, getAuthToken } from './apiConfig'
import type { NewEventDraft, PortalEvent } from './types'

export interface EventResponseDto {
  id: string
  name?: string
  title?: string
  dateOfEvent?: string
  targetDate?: string
  eventVenue?: string
  venue?: string
  ingressDate?: string
  returnDate?: string
  geoClass?: string
  status?: string
  isLossMaker?: boolean
}

export interface CreateEventApiRequest {
  eventName: string
  dateOfEvent: string
  ingressDate: string
  ingressTime: string
  fullStop: string
  eventVenue: string
  geoClass: 'Local' | 'National'
  returnDate?: string
  eventPegs?: string
  colorPalette?: string
  brandingAndTextures?: string
  notes?: string
  estimatedRevenue?: number
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export function mapEventResponseToPortalEvent(dto: EventResponseDto, index = 0): PortalEvent {
  const eventTitle = dto.name || dto.title || 'Untitled Event'
  const rawDate = dto.dateOfEvent || dto.targetDate
  let eventDate = '2026-09-20'
  if (rawDate) {
    const clean = rawDate.split('T')[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      eventDate = clean
    } else {
      const d = new Date(rawDate)
      if (!isNaN(d.getTime())) {
        eventDate = d.toISOString().slice(0, 10)
      }
    }
  }

  const shortRef = dto.id ? dto.id.slice(0, 4).toUpperCase() : String(145 + index)
  
  return {
    id: dto.id,
    refId: `PRT-2026-${shortRef}`,
    title: eventTitle,
    client: 'Lumière Events',
    tier: 'Tier-1 VIP (Bespoke Logistics)',
    venue: dto.eventVenue || dto.venue || 'Venue pending assignment',
    targetDate: eventDate,
    installationStart: dto.ingressDate ? dto.ingressDate.split('T')[0] : eventDate,
    installationEnd: dto.returnDate ? dto.returnDate.split('T')[0] : eventDate,
    budget: 0,
    status: (dto.status || 'In Production') as any,
    moodPlan: '',
  }
}

/**
 * Fetches all events from GET /api/events.
 * Handles both plain Array and PaginatedList ({ items: [...] }) responses.
 */
export async function fetchEventsApi(): Promise<PortalEvent[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events?page=1&pageSize=100`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      console.warn(`[eventsApi] GET /api/events returned HTTP ${res.status}`)
      return []
    }
    const data = await res.json()
    const items: EventResponseDto[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : []

    return items.map((dto, idx) => mapEventResponseToPortalEvent(dto, idx))
  } catch (err) {
    console.warn('[eventsApi] GET /api/events fetch skipped/fallback:', err?.message ?? String(err))
    return []
  }
}

/**
 * Fetches a single event by ID from GET /api/events/{id}.
 */
export async function fetchEventByIdApi(eventId: string): Promise<PortalEvent | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events/${encodeURIComponent(eventId)}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return null
    const dto: EventResponseDto = await res.json()
    return mapEventResponseToPortalEvent(dto)
  } catch (err) {
    console.warn(`[eventsApi] GET /api/events/${eventId} fetch skipped/fallback:`, err?.message ?? String(err))
    return null
  }
}

/**
 * Registers a new event via POST /api/events using CreateEventRequest shape.
 */
export async function createEventApi(
  draft: NewEventDraft,
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const token = getAuthToken()
    const dateOfEventIso = draft.targetDate
      ? (draft.targetDate.includes('T') ? draft.targetDate : `${draft.targetDate}T00:00:00Z`)
      : new Date().toISOString()
    
    const ingressDateIso = draft.ingressDate
      ? (draft.ingressDate.includes('T') ? draft.ingressDate : `${draft.ingressDate}T00:00:00Z`)
      : dateOfEventIso

    const returnDateIso = draft.returnDate
      ? (draft.returnDate.includes('T') ? draft.returnDate : `${draft.returnDate}T00:00:00Z`)
      : dateOfEventIso

    const formatTime = (t?: string, fallback = '08:00:00') => {
      if (!t) return fallback
      return t.length === 5 ? `${t}:00` : t
    }

    const payload: CreateEventApiRequest = {
      eventName: draft.title,
      eventVenue: draft.venue || 'Venue Pending Assignment',
      geoClass: (draft.geoClass === 'National' ? 'National' : 'Local') as 'Local' | 'National',
      dateOfEvent: dateOfEventIso,
      ingressDate: ingressDateIso,
      ingressTime: formatTime(draft.ingressTime, '08:00:00'),
      fullStop: formatTime(draft.fullStop, '23:00:00'),
      returnDate: returnDateIso,
      eventPegs: draft.eventPegs || undefined,
      colorPalette: draft.colorPalette || undefined,
      brandingAndTextures: draft.brandingAndTextures || undefined,
      notes: draft.notes || draft.moodPlan || undefined,
      estimatedRevenue: draft.estimatedRevenue,
    }

    const res = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      const errMsg = errJson?.error || `HTTP ${res.status}`
      console.warn('[eventsApi] POST /api/events error:', errMsg)
      return { success: false, error: errMsg }
    }

    const data = await res.json().catch(() => ({}))
    return { success: true, eventId: data?.eventId || data?.id }
  } catch (err: any) {
    console.warn('[eventsApi] POST /api/events network/runtime error:', err?.message ?? String(err))
    return { success: false, error: err?.message || 'Network error' }
  }
}
