import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WAREHOUSE_MODULES, type WarehouseModuleId } from '@/lib/warehouse-modules'

interface WarehouseRailProps {
  activeModuleId: WarehouseModuleId
  onSelectModule: (id: WarehouseModuleId) => void
  onExit: () => void
  onDashboard?: () => void
}

export function WarehouseRail({ activeModuleId, onSelectModule, onExit, onDashboard = onExit }: WarehouseRailProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (id: WarehouseModuleId) => {
    if (id === activeModuleId) {
      setOpen((value) => !value)
      return
    }

    onSelectModule(id)
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

      <button
        type="button"
        onClick={onExit}
        aria-label="Back to dashboard"
        title="Back to dashboard"
        className="mt-5 flex size-10 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
      </button>

      <div className={cn('my-3 h-px bg-sidebar-border', open ? 'mx-4' : 'w-8')} aria-hidden="true" />

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
