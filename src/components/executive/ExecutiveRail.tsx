import { cn } from '@/lib/utils'
import { EXECUTIVE_DESTINATIONS, type ExecutiveDestinationId } from '@/lib/executive-destinations'

interface ExecutiveRailProps {
  activeId: ExecutiveDestinationId
  onSelect: (id: ExecutiveDestinationId) => void
  open: boolean
  onToggle: () => void
}

// Fixed navigation rail for the Executive console. It stays outside the
// scroll container so the navigation remains available while content scrolls.
export function ExecutiveRail({ activeId, onSelect, open, onToggle }: ExecutiveRailProps) {
  return (
    <aside
      onClick={(event) => {
        if (window.matchMedia('(min-width: 768px)').matches && !event.target.closest('nav')) onToggle()
      }}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex w-full shrink-0 cursor-pointer items-center justify-center border-t border-sidebar-border bg-sidebar px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 max-sm:h-12 max-sm:border-border max-sm:border-t-0 max-sm:bg-background max-sm:pt-0 max-sm:shadow-none transition-all duration-200 md:static md:h-full md:flex-col md:justify-start md:border-r md:border-t-0 md:px-0 md:py-4',
        open ? 'md:w-64' : 'md:w-12',
      )}
    >
      <div className={cn('mb-3 hidden items-center md:flex', open ? 'w-full justify-between px-4' : 'justify-center')}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Lumiere brand, collapse navigation' : 'Lumiere brand, expand navigation'}
          aria-expanded={open}
          className={cn('flex items-center rounded-lg text-sidebar-primary transition-colors hover:bg-sidebar-accent', open ? 'px-1' : 'size-9 justify-center')}
        >
          {open ? <span className="font-serif text-lg font-medium tracking-[0.18em]">LUMIERE</span> : <span className="font-serif text-lg font-medium leading-none">L</span>}
        </button>
      </div>

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
                'flex size-11 items-center justify-center gap-3 rounded-lg transition-colors md:h-10 md:w-full md:justify-start md:px-3',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={cn('hidden truncate text-sm font-medium md:block', !open && 'md:hidden')}>
                {destination.label}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
