import { createContext, useContext } from 'react'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'

interface WarehouseNavValue {
  activeModuleId: WarehouseModuleId
  selectModule: (id: WarehouseModuleId) => void
}

export const WarehouseNavContext = createContext<WarehouseNavValue>({
  activeModuleId: 'dashboard',
  selectModule: () => {},
})

export function useWarehouseNav() {
  return useContext(WarehouseNavContext)
}
