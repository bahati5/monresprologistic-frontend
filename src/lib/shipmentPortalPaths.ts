import type { AuthUser } from '@/types'

/** Client portail ou chauffeur : détail expédition en lecture seule (pas les actions staff). */
export function isClientOrDriverShipmentViewer(user: AuthUser | null): boolean {
  return Boolean(user?.roles?.some((r) => r === 'client' || r === 'driver'))
}

/**
 * Liens expéditions : portail client (`/portal/expeditions/...`) vs espace staff (`/shipments/...`).
 */
export function getShipmentDetailHref(pathname: string, shipmentId: number | string): string {
  if (pathname.startsWith('/portal/expeditions')) {
    return `/portal/expeditions/${shipmentId}`
  }
  return `/shipments/${shipmentId}`
}
