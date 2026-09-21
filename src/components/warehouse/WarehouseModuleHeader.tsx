import type { ReactNode } from 'react'

type WarehouseModuleHeaderProps = {
  title: string
  subtitle: string
  mobileControlsSticky?: boolean
  children: ReactNode
}

export function WarehouseModuleHeader({ title, subtitle, mobileControlsSticky = false, children }: WarehouseModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border px-6 pb-3.5 pt-7 sm:px-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-primary">Warehouse module</p>
          <h1 className="mt-1 pb-1 font-serif text-4xl font-medium leading-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between${mobileControlsSticky ? ' max-md:sticky max-md:top-0 max-md:z-20 max-md:-mx-6 max-md:bg-background max-md:px-6 max-md:pb-2' : ''}`}>{children}</div>
    </div>
  )
}
