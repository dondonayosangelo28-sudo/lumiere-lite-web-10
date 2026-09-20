import type { PortalEvent } from '@/lib/types'

const STATUS_PROGRESS: Record<PortalEvent['status'], number> = {
  Settled: 100,
  Completed: 100,
  'In Production': 65,
  'On Hold': 40,
  Reserved: 25,
  Initialized: 15,
  Cancelled: 0,
}

export function getEventProgress(event: PortalEvent): number {
  if (typeof event.progress === 'number' && Number.isFinite(event.progress)) {
    return Math.min(100, Math.max(0, event.progress))
  }

  return STATUS_PROGRESS[event.status]
}
