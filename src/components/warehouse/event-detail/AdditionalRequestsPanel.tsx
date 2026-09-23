import { ChevronRight, ClipboardList } from 'lucide-react'
import type { EventAdditionalRequest } from '@/lib/event-detail'
import { cn } from '@/lib/utils'

const statusTone: Record<EventAdditionalRequest['status'], string> = {
  'Needs Review': 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Reviewed: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  Available: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'In Replenishment': 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  'Ready for Dispatch': 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'Added to Outbound': 'bg-primary/15 text-primary',
}

export function AdditionalRequestsPanel({ requests, onOpenReplenishment }: { requests: EventAdditionalRequest[]; onOpenReplenishment?: () => void }) {
  return (
    <section className="rounded-xl border border-border bg-card" aria-labelledby="additional-requests-title">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardList className="size-4" aria-hidden="true" /></span>
          <div>
            <h2 id="additional-requests-title" className="text-sm font-semibold text-card-foreground">Additional Item Requests</h2>
            <p className="mt-1 text-xs text-muted-foreground">Executive requests remain separate from the original event item plan.</p>
          </div>
        </div>
        {onOpenReplenishment && requests.some((request) => request.replenishmentNeeded > 0) && (
          <button type="button" onClick={onOpenReplenishment} className="inline-flex shrink-0 items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-primary hover:underline">View replenishment <ChevronRight className="size-3" /></button>
        )}
      </div>
      {requests.length === 0 ? (
        <div className="px-5 py-8 text-center"><p className="text-sm font-semibold text-card-foreground">No additional item requests</p><p className="mt-1 text-xs text-muted-foreground">Additional requests from the Executive account will appear here.</p></div>
      ) : (
        <div className="divide-y divide-border">
          {requests.map((request) => (
            <div key={request.id} className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><p className="font-medium text-card-foreground">{request.itemName}</p><p className="mt-1 text-xs text-muted-foreground">Requested by {request.requestedBy} · {request.requestedAt}</p></div>
                <span className={cn('inline-flex w-fit rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider', statusTone[request.status])}>{request.status}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div><p className="text-muted-foreground">Requested</p><p className="mt-0.5 font-semibold text-card-foreground">{request.requestedQuantity}</p></div>
                <div><p className="text-muted-foreground">Available stock</p><p className="mt-0.5 font-semibold text-card-foreground">{request.availableStock}</p></div>
                <div><p className="text-muted-foreground">Replenishment needed</p><p className="mt-0.5 font-semibold text-card-foreground">{request.replenishmentNeeded}</p></div>
                <div><p className="text-muted-foreground">Reason</p><p className="mt-0.5 truncate font-medium text-card-foreground" title={request.reason}>{request.reason}</p></div>
              </div>
              {request.replenishmentNeeded > 0 && <p className="mt-3 rounded-md border border-orange-500/25 bg-orange-500/5 px-3 py-2 text-xs text-orange-800 dark:text-orange-200">The request remains {request.requestedQuantity}; only the shortfall of {request.replenishmentNeeded} needs replenishment.</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
