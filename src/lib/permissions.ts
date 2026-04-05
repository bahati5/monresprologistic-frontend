import type { AuthUser } from '@/types'

export function userCan(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user?.permissions?.length) return false
  return user.permissions.includes(permission)
}

/** Vrai si l’utilisateur possède au moins une des permissions listées (utile pendant la transition consolidations → regroupements). */
export function userCanAny(user: AuthUser | null | undefined, permissions: string[]): boolean {
  const perms = user?.permissions
  if (!perms?.length) return false
  return permissions.some((p) => perms.includes(p))
}

/** Création / rattachement à un lot (nouveau nom + ancien nom Spatie si la migration des permissions n’a pas été jouée). */
export function userCanManageRegroupementShipments(user: AuthUser | null | undefined): boolean {
  return userCanAny(user, ['create_regroupements', 'create_consolidations'])
}

/** Consultation des lots (page regroupements, picker, statut). */
export function userCanViewRegroupements(user: AuthUser | null | undefined): boolean {
  return userCanAny(user, ['view_regroupements', 'view_consolidations', 'manage_regroupements', 'manage_consolidations'])
}
