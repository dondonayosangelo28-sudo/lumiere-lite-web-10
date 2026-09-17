import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface ErrorFallbackProps {
  title?: string
  message?: string
  onRetry?: () => void | Promise<void>
}

export function ErrorFallback({
  title = 'Failed to load data',
  message = 'Could not fetch records from backend services. Please check your connection and try again.',
  onRetry,
}: ErrorFallbackProps) {
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetry) {
      window.location.reload()
      return
    }
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex min-h-[300px] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center shadow-lg">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h3 className="mt-4 font-serif text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="button-primary mt-6 inline-flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`size-3.5 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Retrying...' : 'Retry connection'}</span>
        </button>
      </div>
    </div>
  )
}
