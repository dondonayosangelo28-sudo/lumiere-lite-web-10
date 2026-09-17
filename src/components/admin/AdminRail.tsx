import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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

  return (
    <aside className={cn('flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-4 transition-[width] duration-200', open ? 'w-64 items-stretch' : 'w-16 items-center')}>
      <div className={cn('flex items-center', open ? 'justify-between px-4' : 'justify-center')}>
        <span className="flex size-8 items-center justify-center font-serif text-lg font-medium leading-none text-sidebar-primary" aria-hidden="true">L</span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={open}
          className={cn('flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', !open && 'hidden')}
        >
          <PanelLeftClose className="size-4" aria-hidden="true" />
        </button>
      </div>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} aria-label="Expand navigation" className="mt-3 flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <PanelLeftOpen className="size-4" aria-hidden="true" />
        </button>
      )}

      <div className={cn('my-3 h-px bg-sidebar-border', open ? 'mx-4' : 'w-8')} aria-hidden="true" />

      <nav className={cn('flex flex-col gap-2', open ? 'items-stretch px-3' : 'items-center')} aria-label="Admin destinations">
        {ADMIN_DESTINATIONS.map((destination) => {
          const Icon = destination.icon
          const active = destination.id === activeId
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => onSelect(destination.id)}
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
              <Icon className="size-4" aria-hidden="true" />
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
