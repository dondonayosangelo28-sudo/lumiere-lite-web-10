import type { StaffRole } from '@/lib/types'

export function getRoleLabel(role: string): string {
  return role === 'WOM' ? 'Warehouse' : role
}

export function getAccountLabel(role: StaffRole | string): string {
  return getRoleLabel(role)
}
