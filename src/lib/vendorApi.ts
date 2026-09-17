import { API_BASE_URL, getAuthToken } from './apiConfig'

/**
 * Mirrors Lumiere.Core.DTOs.VendorResponse. The backend has no
 * contactName/email/phone/specialty/status fields on the vendor itself —
 * contact info lives on sub-resources (representatives, contact numbers,
 * contact platforms).
 */
export interface VendorDto {
  id: string
  name: string
  address?: string
  representatives: RepresentativeDto[]
}

/**
 * Mirrors Lumiere.Core.DTOs.CreateVendorRequest exactly: { Name, Address }.
 * Any other field (contactName/email/phone/specialty) is silently dropped
 * by the backend, so it is not accepted here.
 */
export interface CreateVendorRequestDto {
  name: string
  address?: string
}

export interface RepresentativeDto {
  id: string
  firstName: string
  lastName: string
}

/**
 * Mirrors Lumiere.Core.DTOs.AddRepresentativeRequest exactly:
 * { FirstName, LastName }.
 */
export interface CreateRepresentativeRequestDto {
  firstName: string
  lastName: string
}

/**
 * Mirrors Lumiere.Core.DTOs.AddContactRequest: { PhoneNumber, Type }.
 */
export interface CreateVendorContactRequestDto {
  phoneNumber: string
  type?: string
}

/**
 * Mirrors Lumiere.Core.DTOs.AddPlatformRequest: { PlatformName, Handle }.
 */
export interface CreateVendorPlatformRequestDto {
  platformName: string
  handle: string
}

function getHeaders(): HeadersInit {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * GET /api/vendors
 */
export async function fetchVendorsApi(): Promise<VendorDto[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors`, {
      headers: getHeaders(),
    })
    if (!res.ok) {
      console.warn(`[vendorApi] GET /api/vendors returned HTTP ${res.status}`)
      return []
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('[vendorApi] GET /api/vendors failed:', err)
    return []
  }
}

/**
 * POST /api/vendors
 */
export async function createVendorApi(req: CreateVendorRequestDto): Promise<VendorDto | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      console.warn(`[vendorApi] POST /api/vendors returned HTTP ${res.status}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[vendorApi] POST /api/vendors failed:', err)
    return null
  }
}

/**
 * POST /api/vendors/{vendorId}/representatives
 */
export async function createVendorRepresentativeApi(
  vendorId: string,
  req: CreateRepresentativeRequestDto,
): Promise<RepresentativeDto | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${encodeURIComponent(vendorId)}/representatives`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      console.warn(`[vendorApi] POST /api/vendors/${vendorId}/representatives returned HTTP ${res.status}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn(`[vendorApi] POST /api/vendors/${vendorId}/representatives failed:`, err)
    return null
  }
}

/**
 * POST /api/vendors/{vendorId}/contacts
 */
export async function createVendorContactApi(
  vendorId: string,
  req: CreateVendorContactRequestDto,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${encodeURIComponent(vendorId)}/contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    })
    return res.ok
  } catch (err) {
    console.warn(`[vendorApi] POST /api/vendors/${vendorId}/contacts failed:`, err)
    return false
  }
}

/**
 * POST /api/vendors/{vendorId}/platforms
 */
export async function createVendorPlatformApi(
  vendorId: string,
  req: CreateVendorPlatformRequestDto,
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/vendors/${encodeURIComponent(vendorId)}/platforms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    })
    return res.ok
  } catch (err) {
    console.warn(`[vendorApi] POST /api/vendors/${vendorId}/platforms failed:`, err)
    return false
  }
}
