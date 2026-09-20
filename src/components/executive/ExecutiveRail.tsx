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
        'fixed inset-x-0 bottom-0 z-40 h-16 w-full shrink-0 border-t border-sidebar-border bg-sidebar/95 px-2 pt-1 pb-[min(env(safe-area-inset-bottom,0px),0.75rem)] backdrop-blur-xl transition-all duration-200 md:static md:h-full md:flex md:cursor-pointer md:flex-col md:items-center md:justify-start md:border-r md:border-t-0 md:px-0 md:py-4',
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

      <nav className="grid w-full grid-cols-4 gap-1 md:flex md:w-auto md:flex-col md:gap-2" aria-label="Executive destinations">
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
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[0.65rem] font-medium leading-none transition-colors md:h-10 md:w-full md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3 md:text-sm',
                active
                  ? 'text-sidebar-primary md:bg-sidebar-primary md:text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <span className={cn('flex h-7 w-14 items-center justify-center rounded-full', active ? 'bg-sidebar-primary/15 text-sidebar-primary' : 'text-sidebar-foreground/70')}>
                <Icon className="size-5 shrink-0" aria-hidden="true" />
              </span>
              <span className="block max-w-full truncate text-[0.65rem] font-medium md:text-sm">
                <span className="md:hidden">{destination.shortLabel}</span>
                <span className="hidden md:inline">{destination.label}</span>
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
