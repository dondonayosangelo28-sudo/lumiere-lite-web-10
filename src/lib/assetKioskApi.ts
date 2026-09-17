/**
 * assetKioskApi.ts
 *
 * FE client for AssetController (Lumiere.API/Controllers/AssetController.cs).
 * DTOs mirror the real BE shape documented in 04-asset-allocation-kiosk.md:
 *   AssetResponse — GET /api/assets
 *
 * Deficit-queue creation (POST /api/deficit-queue) lives in deficitApi.ts —
 * this file previously had a second, incompatible client for the same
 * endpoint (CreateDeficitRequest / createDeficitApi). That duplicate has
 * been removed; use `createDeficitItemApi` from './deficitApi' instead.
 *
 * NOTE: The "Crossdock" branch (Step 2b) has no confirmed BE endpoint as of
 * 2026-09-17; see §Production SHALL #6 in 04-asset-allocation-kiosk.md.
 * The crossdock call is intentionally left unimplemented here until
 * VendorAssetController.cs / DispatchDTOs.cs are audited.
 */

/* ---- DTO shapes (mirrors BE) ---- */

export interface AssetColor {
  hex: string
  brand: string
}

/**
 * AssetResponse - returned by GET /api/assets.
 * AssetTier is an int 1-5.
 * AssetState is a string (e.g. "Available", "Reserved", "InMaintenance").
 */
export interface AssetResponse {
  id: string
  name: string
  assetSubTypeId: string
  subTypeName?: string
  assetTier: number
  assetState: string
  quantity: number
  colors: AssetColor[]
  tags: string[]
  thumbnailUrl?: string
}

export interface AssetFilterParams {
  assetTypeId?: string
  tagValue?: string
  hexValue?: string
  tier?: number
  state?: string
}

export async function fetchAssetsApi(params: AssetFilterParams = {}): Promise<AssetResponse[]> {
  const qs = new URLSearchParams()
  if (params.assetTypeId) qs.set('assetTypeId', params.assetTypeId)
  if (params.tagValue)    qs.set('tagValue', params.tagValue)
  if (params.hexValue)    qs.set('hexValue', params.hexValue)
  if (params.tier != null) qs.set('tier', String(params.tier))
  if (params.state)       qs.set('state', params.state)

  const url = import.meta.env.VITE_API_URL + '/api/assets' + (qs.toString() ? '?' + qs : '')
  const token = localStorage.getItem('token') ?? ''
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    }
  })
  if (!res.ok) throw new Error('GET /api/assets failed: ' + res.status)
  return res.json()
}
