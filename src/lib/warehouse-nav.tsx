import { createContext, useContext } from 'react'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'

interface WarehouseNavContextValue {
  activeModuleId: WarehouseModuleId
  selectModule: (id: WarehouseModuleId) => void
}

export const WarehouseNavContext = createContext<WarehouseNavContextValue>({
  activeModuleId: 'dashboard',
  selectModule: () => {},
})

export function useWarehouseNav() {
  return useContext(WarehouseNavContext)
}
