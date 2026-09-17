import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { subscribeOfflineSync, triggerOfflineReplay } from '@/lib/offlineReplay'
import { cn } from '@/lib/utils'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [justReconnected, setJustReconnected] = useState<boolean>(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)
      const timer = setTimeout(() => setJustReconnected(false), 4000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const unsubscribe = subscribeOfflineSync((count, syncing) => {
      setPendingSyncCount(count)
      setIsSyncing(syncing)
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [])

  if (isOnline && !justReconnected && pendingSyncCount === 0) {
    return null
  }

  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-amber-600 px-4 py-2.5 text-white shadow-md dark:bg-amber-700"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <WifiOff className="size-4 shrink-0 animate-pulse" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-[0.1em] truncate">
            You are offline — changes will sync automatically when reconnected
          </p>
        </div>

        {pendingSyncCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-amber-100">
              {pendingSyncCount} queued
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-emerald-600 px-4 py-2 text-white shadow-md dark:bg-emerald-700"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-[0.1em] truncate">
          Connection restored — syncing queued offline changes
        </p>
      </div>

      {pendingSyncCount > 0 && (
        <button
          type="button"
          onClick={() => triggerOfflineReplay()}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/20 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white hover:bg-white/30 transition"
        >
          <RefreshCw className={cn('size-3', isSyncing && 'animate-spin')} aria-hidden="true" />
          Sync now
        </button>
      )}
    </div>
  )
}
