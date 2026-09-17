import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  variant?: 'dashboard' | 'table' | 'cards' | 'detail'
  className?: string
}

export function LoadingSkeleton({ variant = 'dashboard', className }: LoadingSkeletonProps) {
  return (
    <div className={cn('w-full space-y-6 animate-pulse p-4 sm:p-6', className)}>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-muted/70" />
        <div className="h-8 w-64 rounded bg-muted/80" />
        <div className="h-4 w-96 max-w-full rounded bg-muted/50" />
      </div>

      {variant === 'dashboard' && (
        <>
          {/* Stat cards grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg border border-border bg-card/60 p-4 space-y-3">
                <div className="h-3 w-20 rounded bg-muted/60" />
                <div className="h-7 w-24 rounded bg-muted/80" />
                <div className="h-3 w-32 rounded bg-muted/40" />
              </div>
            ))}
          </div>
          {/* Large panel skeleton */}
          <div className="h-64 rounded-lg border border-border bg-card/60 p-6 space-y-4">
            <div className="h-4 w-40 rounded bg-muted/70" />
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full rounded bg-muted/40" />
              <div className="h-4 w-5/6 rounded bg-muted/40" />
              <div className="h-4 w-4/6 rounded bg-muted/40" />
            </div>
          </div>
        </>
      )}

      {variant === 'cards' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg border border-border bg-card/60 p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-32 rounded bg-muted/70" />
                <div className="h-4 w-16 rounded bg-muted/50" />
              </div>
              <div className="h-6 w-48 rounded bg-muted/80" />
              <div className="h-3 w-36 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
          <div className="h-10 w-full rounded bg-muted/60" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded bg-muted/40" />
          ))}
        </div>
      )}

      {variant === 'detail' && (
        <div className="space-y-4">
          <div className="h-48 w-full rounded-lg border border-border bg-card/60 p-6 space-y-4">
            <div className="h-5 w-48 rounded bg-muted/70" />
            <div className="h-4 w-full rounded bg-muted/40" />
            <div className="h-4 w-3/4 rounded bg-muted/40" />
          </div>
        </div>
      )}
    </div>
  )
}
