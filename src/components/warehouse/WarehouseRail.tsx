import { useState } from 'react'
import { cn } from '@/lib/utils'
import { WAREHOUSE_MODULES, type WarehouseModuleId } from '@/lib/warehouse-modules'

interface WarehouseRailProps {
  activeModuleId: WarehouseModuleId
  onSelectModule: (id: WarehouseModuleId) => void
  defaultOpen?: boolean
}

export function WarehouseRail({
  activeModuleId,
  onSelectModule,
  defaultOpen = false,
}: WarehouseRailProps) {
  const [open, setOpen] = useState(defaultOpen)

  const handleSelect = (id: WarehouseModuleId) => {
    if (id === activeModuleId) {
      setOpen((value) => !value)
      return
    }

    onSelectModule(id)
  }

  return (
    <aside className={cn('flex h-full min-h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-4 transition-[width] duration-200', open ? 'w-64 items-stretch' : 'w-[4.5rem] items-center')}>
      <div className={cn('flex items-center', open ? 'justify-start px-4' : 'justify-center')}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Collapse navigation' : 'Expand navigation'}
          aria-expanded={open}
          className={cn(
            'flex h-10 items-center rounded-lg text-sidebar-primary-foreground transition-colors hover:bg-sidebar-accent',
            open ? 'w-full justify-start px-3' : 'size-10 justify-center bg-sidebar-primary',
          )}
        >
          {open ? (
            <span className="truncate font-serif text-sm font-semibold tracking-[0.28em] text-sidebar-primary">LUMIERE</span>
          ) : (
            <span aria-hidden="true" className="font-serif text-lg font-semibold leading-none">L</span>
          )}
        </button>
      </div>

      <div className={cn('my-4 h-px bg-sidebar-border', open ? 'mx-4' : 'w-9')} aria-hidden="true" />

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
