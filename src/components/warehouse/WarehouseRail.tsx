import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WAREHOUSE_MODULES, type WarehouseModuleId } from '@/lib/warehouse-modules'

interface WarehouseRailProps {
  activeModuleId?: WarehouseModuleId
  onSelectModule: (id: WarehouseModuleId) => void
  onExit: () => void
  onDashboard: () => void
  defaultOpen?: boolean
}

export function WarehouseRail({
  activeModuleId,
  onSelectModule,
  onExit,
  onDashboard,
  defaultOpen = false,
}: WarehouseRailProps) {
  const [open, setOpen] = useState(defaultOpen)

  const handleSelect = (id: WarehouseModuleId) => {
    if (id === 'dashboard') {
      if (activeModuleId === 'dashboard') {
        setOpen((value) => !value)
      } else {
        onDashboard()
      }
      return
    }

    if (id === activeModuleId) {
      setOpen((value) => !value)
      return
    }

    onSelectModule(id)
  }

  return (
    <aside className={cn('relative z-50 flex h-screen min-h-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200', open ? 'w-64 items-stretch' : 'w-[4.5rem] items-center')}>
      <div className={cn('flex items-center pt-3', open ? 'justify-start px-4' : 'justify-center')}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={open}
          className={cn(
            'flex items-center rounded-lg transition-colors hover:bg-sidebar-accent',
            open ? 'h-10 w-full justify-start px-3' : 'size-10 justify-center bg-sidebar-primary',
          )}
        >
          {open ? (
            <span className="truncate font-serif text-sm font-medium tracking-[0.34em] text-sidebar-primary">LUMIERE</span>
          ) : (
            <span aria-hidden="true" className="font-serif text-lg font-medium leading-none text-sidebar-primary-foreground">L</span>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onExit}
        aria-label="Back to dashboard"
        title="Back to dashboard"
        className={cn(
          'flex size-10 items-center justify-center text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          open ? 'ml-2 mt-7' : 'mt-7',
        )}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
      </button>

      <div className={cn('mt-5 h-px bg-sidebar-border', open ? 'mx-4' : 'w-9')} aria-hidden="true" />

      <nav className={cn('flex flex-col gap-2', open ? 'items-stretch px-3' : 'items-center')} aria-label="Warehouse modules">
        {WAREHOUSE_MODULES.map((module) => {
          const Icon = module.icon
          const active = module.id === activeModuleId
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => handleSelect(module.id)}
              aria-label={module.label}
              aria-current={active ? 'true' : undefined}
              title={module.label}
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
                {module.label}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
