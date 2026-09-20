import { LayoutGrid, ClipboardList, ListFilter, Package, type LucideIcon } from 'lucide-react'

// The four destinations pinned to the Executive icon rail — mirrors the
// Admin console's ADMIN_DESTINATIONS list/rail pattern.
export type ExecutiveDestinationId = 'dashboard' | 'registry' | 'logs' | 'assets'

export interface ExecutiveDestination {
  id: ExecutiveDestinationId
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const EXECUTIVE_DESTINATIONS: ExecutiveDestination[] = [
  { id: 'dashboard', label: 'Executive Dashboard', shortLabel: 'Dashboard', icon: LayoutGrid },
  { id: 'assets', label: 'Asset Allocation Kiosk', shortLabel: 'Assets', icon: Package },
  { id: 'registry', label: 'Event Operations', shortLabel: 'Events', icon: ClipboardList },
  { id: 'logs', label: 'Operational Audit Logs', shortLabel: 'Audit', icon: ListFilter },
]

export function getExecutiveDestination(id: ExecutiveDestinationId) {
  return EXECUTIVE_DESTINATIONS.find((destination) => destination.id === id)
}
