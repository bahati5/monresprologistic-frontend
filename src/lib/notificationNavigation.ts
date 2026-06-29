import type { AuthUser } from '@/types'
import { isPortalClientUser } from '@/lib/savPortalPaths'

/** Cible SPA pour une ligne de notification (API : action_href puis action_url). */
export function notificationDetailHref(row: Record<string, unknown>, user: AuthUser | null): string {
  const ah = row.action_href
  if (typeof ah === 'string' && ah.trim() !== '') return ah.trim()
  const au = row.action_url
  if (typeof au === 'string' && au.trim() !== '') return au.trim()
  const data = row.data
  if (data && typeof data === 'object' && data !== null && 'link' in data) {
    const link = (data as { link?: unknown }).link
    if (typeof link === 'string' && link.trim() !== '') return link.trim()
  }
  return isPortalClientUser(user) ? '/portal' : '/dashboard'
}
