import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ADMIN_DESTINATIONS, type AdminDestinationId } from '@/lib/admin-destinations'

interface AdminRailProps {
  activeId: AdminDestinationId
  onSelect: (id: AdminDestinationId) => void
}

// Constant left icon rail for the Admin console. Unlike WOM's rail this never
// hides or collapses — every Admin screen sits at the same level (Canva-style),
// so the rail is a true constant present on the dashboard and every future
// destination. Lives outside the scroll container so it stays fixed.
export function AdminRail({ activeId, onSelect }: AdminRailProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (id: AdminDestinationId) => {
    if (id === activeId) {
      setOpen((value) => !value)
      return
    }

    onSelect(id)
  }

  return (
    <aside className={cn('flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-4 transition-[width] duration-200', open ? 'w-64 items-stretch' : 'w-16 items-center')}>
      <div className={cn('flex items-center', open ? 'justify-between px-4' : 'justify-center')}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Lumiere brand, collapse navigation' : 'Lumiere brand, expand navigation'}
          aria-expanded={open}
          className={cn('flex items-center rounded-lg text-sidebar-primary transition-colors hover:bg-sidebar-accent', open ? 'px-1' : 'size-9 justify-center')}
        >
          {open ? <span className="font-serif text-lg font-medium tracking-[0.18em]">LUMIERE</span> : <span className="font-serif text-lg font-medium leading-none">L</span>}
        </button>
      </div>

      <div className={cn('my-3 h-px bg-sidebar-border', open ? 'mx-4' : 'w-8')} aria-hidden="true" />

      <nav className={cn('flex flex-col gap-2', open ? 'items-stretch px-3' : 'items-center')} aria-label="Admin destinations">
        {ADMIN_DESTINATIONS.map((destination) => {
          const Icon = destination.icon
          const active = destination.id === activeId
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => handleSelect(destination.id)}
              aria-label={destination.label}
              aria-current={active ? 'true' : undefined}
              title={destination.label}
              className={cn(
                'flex h-10 items-center gap-3 rounded-lg transition-colors',
                open ? 'w-full justify-start px-3' : 'w-10 justify-center',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={cn('truncate text-sm font-medium', !open && 'sr-only')}>
                {destination.label}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
