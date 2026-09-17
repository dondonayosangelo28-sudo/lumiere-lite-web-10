import { cn } from '@/lib/utils'
import { EXECUTIVE_DESTINATIONS, type ExecutiveDestinationId } from '@/lib/executive-destinations'

interface ExecutiveRailProps {
  activeId: ExecutiveDestinationId
  onSelect: (id: ExecutiveDestinationId) => void
}

// Constant left icon rail for the Executive console — matches AdminRail
// exactly (same dimensions, brand mark, and button styling). Every Executive
// screen sits at the same level, so the rail never hides or collapses, and it
// lives outside the scroll container so it stays fixed.
export function ExecutiveRail({ activeId, onSelect }: ExecutiveRailProps) {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 flex w-full shrink-0 items-center justify-center border-t border-sidebar-border bg-sidebar px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:static md:h-full md:w-16 md:flex-col md:justify-start md:border-r md:border-t-0 md:px-0 md:py-4">
      <span
        className="sr-only"
        aria-hidden="true"
      >
        L
      </span>

      <div className="hidden md:my-3 md:block md:h-px md:w-8 md:bg-sidebar-border" aria-hidden="true" />

      <nav className="flex w-full items-center justify-around gap-1 md:w-auto md:flex-col md:gap-2" aria-label="Executive destinations">
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
