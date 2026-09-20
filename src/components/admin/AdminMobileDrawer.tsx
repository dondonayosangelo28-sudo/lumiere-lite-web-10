import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ADMIN_DESTINATIONS, type AdminDestinationId } from '@/lib/admin-destinations'

interface AdminMobileDrawerProps {
  open: boolean
  onClose: () => void
  activeId: AdminDestinationId
  onSelect: (id: AdminDestinationId) => void
}

export function AdminMobileDrawer({ open, onClose, activeId, onSelect }: AdminMobileDrawerProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation menu"
        className="fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-72 max-w-[85%] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl sm:hidden"
      >
        <div className="px-4 pt-5">
          <div className="font-serif text-lg font-medium tracking-[0.18em] text-sidebar-primary">LUMIERE</div>
        </div>
        <div className="my-3 mx-4 h-px w-8 bg-sidebar-border" aria-hidden="true" />
        <nav className="flex flex-col gap-2 px-3" aria-label="Admin destinations">
          {ADMIN_DESTINATIONS.map((destination) => {
            const Icon = destination.icon
            const active = destination.id === activeId
            return (
              <button
                key={destination.id}
                type="button"
                onClick={() => {
                  onSelect(destination.id)
                  onClose()
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 w-full items-center justify-start gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{destination.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
