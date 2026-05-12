import type { AuthUser } from '@/types'

export function isPortalClientUser(user: AuthUser | null | undefined): boolean {
  return Boolean(user?.roles?.includes('client'))
}

/** Base path for SAV list / navigation (portail client vs espace staff). */
export function getSavBasePath(user: AuthUser | null | undefined): string {
  return isPortalClientUser(user) ? '/portal/sav' : '/sav'
}
