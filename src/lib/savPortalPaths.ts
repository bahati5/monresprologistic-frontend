import type { AuthUser } from '@/types'
import { isPortalOnlyClient } from '@/lib/internalAppRoles'

export function isPortalClientUser(user: AuthUser | null | undefined): boolean {
  return isPortalOnlyClient(user)
}

/** Base path for SAV list / navigation (portail client vs espace staff). */
export function getSavBasePath(user: AuthUser | null | undefined): string {
  return isPortalClientUser(user) ? '/portal/sav' : '/sav'
}
