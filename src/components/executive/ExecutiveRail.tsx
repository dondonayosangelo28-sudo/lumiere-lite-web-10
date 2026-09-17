import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXECUTIVE_DESTINATIONS, type ExecutiveDestinationId } from '@/lib/executive-destinations'

interface ExecutiveRailProps {
  activeId: ExecutiveDestinationId
  onSelect: (id: ExecutiveDestinationId) => void
  open: boolean
  onToggle: () => void
}

// Constant left icon rail for the Executive console — matches AdminRail
// exactly (same dimensions, brand mark, and button styling). Every Executive
// screen sits at the same level, so the rail never hides or collapses, and it
// lives outside the scroll container so it stays fixed.
export function ExecutiveRail({ activeId, onSelect, open, onToggle }: ExecutiveRailProps) {
  return (
    <aside className={cn(
      'fixed inset-x-0 bottom-0 z-40 flex w-full shrink-0 items-center justify-center border-t border-sidebar-border bg-sidebar px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 transition-all duration-200 md:static md:h-full md:flex-col md:justify-start md:border-r md:border-t-0 md:px-0 md:py-4',
      open ? 'md:w-16' : 'md:w-12',
    )}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
        aria-expanded={open}
        className="mb-3 hidden size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex"
      >
        {open ? <PanelLeftClose className="size-4" aria-hidden="true" /> : <PanelLeftOpen className="size-4" aria-hidden="true" />}
      </button>

      <div className="hidden md:mb-3 md:block md:h-px md:w-8 md:bg-sidebar-border" aria-hidden="true" />

      <nav className={cn('items-center justify-around gap-1 md:w-auto md:flex-col md:gap-2', open ? 'flex w-full' : 'hidden md:flex')} aria-label="Executive destinations">
        {EXECUTIVE_DESTINATIONS.map((destination) => {
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
                'flex size-11 items-center justify-center rounded-lg transition-colors md:size-10',
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
