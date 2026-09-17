import { API_BASE_URL, getAuthToken } from './apiConfig'
import type { CatalogAsset } from './warehouse-catalog'

export interface BackendAssetPayload {
  name: string
  description?: string
  quantity?: number
  catalogPhotoUrl?: string
}

export function mapCatalogAssetToBackendPayload(asset: Partial<CatalogAsset>): BackendAssetPayload {
  return {
    name: asset.name || '',
    description: asset.description || '',
    quantity: asset.currentStock ?? 0,
    catalogPhotoUrl: asset.image || '',
  }
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

export async function fetchAssetsApi(): Promise<Partial<CatalogAsset>[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/assets`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) return []
    return await res.json()
  } catch (err) {
    console.warn('[assetsApi] Fetch assets API call skipped/fallback:', err)
    return []
  }
}

export async function createAssetApi(asset: Partial<CatalogAsset>): Promise<Partial<CatalogAsset> | null> {
  try {
    const payload = mapCatalogAssetToBackendPayload(asset)
    const res = await fetch(`${API_BASE_URL}/api/assets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('[assetsApi] Create asset API call skipped/fallback:', err)
    return null
  }
}

export async function updateAssetApi(id: string, asset: Partial<CatalogAsset>): Promise<boolean> {
  try {
    const payload = mapCatalogAssetToBackendPayload(asset)
    const res = await fetch(`${API_BASE_URL}/api/assets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch (err) {
    console.warn('[assetsApi] Update asset API call skipped/fallback:', err)
    return true
  }
}
