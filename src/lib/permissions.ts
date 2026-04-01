import type { AuthUser } from '@/types'

export function userCan(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user?.permissions?.length) return false
  return user.permissions.includes(permission)
}
