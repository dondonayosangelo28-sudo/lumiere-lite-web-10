import { getPendingQueue, removeQueuedDeclaration } from './offlineQueue'
import { API_BASE_URL, getAuthToken } from './apiConfig'

type SyncListener = (pendingCount: number, syncing: boolean) => void
const syncListeners = new Set<SyncListener>()
let isSyncing = false

export function subscribeOfflineSync(listener: SyncListener): () => void {
  syncListeners.add(listener)
  notifyListeners()
  return () => syncListeners.delete(listener)
}

async function notifyListeners() {
  const pending = await getPendingQueue()
  syncListeners.forEach((l) => l(pending.length, isSyncing))
}

/**
 * Triggers background sync replay of all queued offline declarations.
 */
export async function triggerOfflineReplay(): Promise<{ syncedCount: number; errors: number }> {
  if (isSyncing || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    const queue = await getPendingQueue()
    return { syncedCount: 0, errors: queue.length }
  }

  isSyncing = true
  notifyListeners()

  let syncedCount = 0
  let errors = 0

  try {
    const pendingItems = await getPendingQueue()
    const token = getAuthToken()

    for (const item of pendingItems) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/damage-reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': item.idempotencyKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            boundEvent: item.eventName,
            assetName: item.item,
            damageType: item.condition === 'Damaged' ? 'Critical' : 'Missing',
            notes: item.description,
            reportingOfficer: item.submittedBy,
          }),
        })

        // HTTP 200, 201 or 409 (already processed idempotently) count as successful sync
        if (response.ok || response.status === 409) {
          await removeQueuedDeclaration(item.id)
          syncedCount++
        } else {
          errors++
        }
      } catch (err) {
        console.warn(`[offlineReplay] Failed to replay declaration ${item.id}:`, err)
        errors++
      }
    }
  } finally {
    isSyncing = false
    notifyListeners()
  }

  return { syncedCount, errors }
}

// Auto-register network listener to flush queue on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[offlineReplay] Network connection restored — triggering background replay queue sync')
    triggerOfflineReplay()
  })
}
