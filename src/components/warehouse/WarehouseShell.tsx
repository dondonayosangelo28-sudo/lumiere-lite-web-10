import type { ReactNode } from 'react'
import { WarehouseRail } from '@/components/warehouse/WarehouseRail'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'

interface WarehouseShellProps {
  activeId: WarehouseModuleId
  onSelect: (id: WarehouseModuleId) => void
  children: ReactNode
}

export function WarehouseShell({ activeId, onSelect, children }: WarehouseShellProps) {
  return (
    <div className="fixed inset-0 flex bg-background">
      <WarehouseRail activeId={activeId} onSelect={onSelect} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default WarehouseShell
