import { AlertTriangle } from 'lucide-react'
import { stageSequenceFor, type BatchDirection, type BatchStage } from '@/lib/event-detail'
import { cn } from '@/lib/utils'

interface DispatchStepperProps {
  direction: BatchDirection
  stage: BatchStage
  // Stalled In Transit is an interruption layered on top of the normal
  // Planned → Loaded → In Transit → Delivered/Returned progression, not a
  // fifth step in it — so it renders as a distinct red indicator on the
  // active step rather than inserted into the sequence.
  stalled?: boolean
}

export function DispatchStepper({ direction, stage, stalled = false }: DispatchStepperProps) {
  const sequence = stageSequenceFor(direction)
  const activeIndex = sequence.indexOf(stage)

  return (
    <div className="flex flex-wrap items-center gap-1.5 gap-y-1.5" aria-label={`Batch stage: ${stage}${stalled ? ' — stalled in transit' : ''}`}>
      {sequence.map((step, index) => (
        <div key={step} className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex items-center gap-1.5 px-0.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.04em] transition-colors',
              index === activeIndex
                ? stalled
                  ? 'font-bold text-amber-700 dark:text-amber-300'
                  : 'font-bold text-primary'
                : index < activeIndex
                  ? 'text-foreground/70'
                  : 'text-muted-foreground',
            )}
          >
            {index === activeIndex && stalled && <AlertTriangle className="size-2.5" aria-hidden="true" />}
            {step}
          </span>
          {index < sequence.length - 1 && (
            <span
              className={cn('h-px w-3 shrink-0 max-sm:hidden', index < activeIndex ? 'bg-primary' : 'bg-border')}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
      {stalled && (
        <span className="ml-1 inline-flex items-center gap-1 text-[0.55rem] font-bold uppercase tracking-[0.04em] text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-2.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          Stalled In Transit
        </span>
      )}
    </div>
  )
}
