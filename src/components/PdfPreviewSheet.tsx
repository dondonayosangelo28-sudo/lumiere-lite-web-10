import { useEffect, useMemo } from 'react'
import { X } from 'lucide-react'

type Props = {
  blob: Blob
  filename: string
  onClose: () => void
}

export function PdfPreviewSheet({ blob, filename, onClose }: Props) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      URL.revokeObjectURL(url)
    }
  }, [onClose, url])

  const download = () => {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-title">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <h2 id="pdf-preview-title" className="min-w-0 truncate text-sm font-semibold text-foreground">{filename}</h2>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Close PDF preview">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 bg-muted/30 p-3 sm:p-5">
          <iframe title="PDF preview" src={`${url}#toolbar=0`} className="h-[58dvh] min-h-[360px] w-full rounded-lg border border-border bg-white" />
          <p className="mt-2 text-center text-xs text-muted-foreground">Preview shows the first page. Download for the full report.</p>
        </div>
        <footer className="flex flex-col gap-2 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-5">
          <button type="button" onClick={download} className="order-1 w-full rounded-lg bg-[#8B6F47] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#745b39] sm:order-2 sm:w-auto">Download</button>
          <button type="button" onClick={onClose} className="order-2 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted sm:order-1 sm:w-auto">Close</button>
        </footer>
      </section>
    </div>
  )
}
