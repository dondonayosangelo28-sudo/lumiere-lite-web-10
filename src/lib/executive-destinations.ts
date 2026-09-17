import { LayoutGrid, ClipboardList, ListFilter, Package, type LucideIcon } from 'lucide-react'

// The four destinations pinned to the Executive icon rail — mirrors the
// Admin console's ADMIN_DESTINATIONS list/rail pattern.
export type ExecutiveDestinationId = 'dashboard' | 'registry' | 'logs' | 'assets'

export interface ExecutiveDestination {
  id: ExecutiveDestinationId
  label: string
  icon: LucideIcon
}

export const EXECUTIVE_DESTINATIONS: ExecutiveDestination[] = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutGrid },
  { id: 'assets', label: 'Asset Allocation Kiosk', icon: Package },
  { id: 'registry', label: 'Event Operations', icon: ClipboardList },
  { id: 'logs', label: 'Operational Audit Logs', icon: ListFilter },
]

export function getExecutiveDestination(id: ExecutiveDestinationId) {
  return EXECUTIVE_DESTINATIONS.find((destination) => destination.id === id)
}
