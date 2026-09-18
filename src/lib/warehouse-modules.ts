import {
  Boxes,
  LayoutDashboard,
  PackageSearch,
  Truck,
  type LucideIcon,
} from 'lucide-react'

// The six operational modules a Warehouse Operations Manager drills into.
// Shared between the home-screen module row and the icon rail so both
// surfaces stay in lockstep as modules are filled in during later phases.
export type WarehouseModuleId =
  | 'dashboard'
  | 'assets'
  | 'replenishment'
  | 'dispatch'

export interface WarehouseModule {
  id: WarehouseModuleId
  label: string
  icon: LucideIcon
  blurb: string
  previewPoints: string[]
}

export const WAREHOUSE_MODULES: WarehouseModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    blurb: 'Warehouse-wide KPIs, event roster, and upcoming ingress schedule.',
    previewPoints: ['Total / Available Assets', 'Critical Deficits & Pending Procurement', 'Month calendar & upcoming events'],
  },
  {
    id: 'assets',
    label: 'Asset Catalog',
    icon: Boxes,
    blurb: 'Category-specific asset views, stock levels, and condition tracking.',
    previewPoints: ['Category-specific asset layouts', 'Stock & threshold tracking', 'Condition and maintenance flags'],
  },
  {
    id: 'replenishment',
    label: 'Replenishment & Deficits',
    icon: PackageSearch,
    blurb: 'Deficit tracking, reorder requisitions, and procurement status.',
    previewPoints: ['Checkpoint-based deficit tracking', 'Reorder requisition routing', 'Purchase order status'],
  },
  {
    id: 'dispatch',
    label: 'Dispatch & Logistics',
    icon: Truck,
    blurb: 'Dispatch manifests, vehicle assignments, and transit checkpoints.',
    previewPoints: ['Dispatch manifests', 'Vehicle assignments', 'Transit checkpoint history'],
  },
]

export function getWarehouseModule(id: WarehouseModuleId) {
  return WAREHOUSE_MODULES.find((module) => module.id === id)
}
