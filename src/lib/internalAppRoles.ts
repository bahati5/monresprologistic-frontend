import type { AuthUser } from '@/types'

/** Rôles staff : tableau de bord global et navigation interne (prioritaires sur client / chauffeur). */
export const INTERNAL_STAFF_ROLE_NAMES = [
  'super_admin',
  'agency_admin',
  'operator',
  'customs_agent',
] as const

export function hasInternalStaffAppRole(user: AuthUser | null | undefined): boolean {
  const roles = user?.roles
  if (!roles?.length) return false
  return roles.some((r) => (INTERNAL_STAFF_ROLE_NAMES as readonly string[]).includes(r))
}

/** Compte portail client mobile uniquement (pas un staff qui cumule le rôle client). */
export function isPortalOnlyClient(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles?.includes('client') && !hasInternalStaffAppRole(user))
}

/** Chauffeur terrain sans rôle staff (UI ramassages simplifiée). */
export function isFieldDriverOnly(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles?.includes('driver') && !hasInternalStaffAppRole(user))
}
