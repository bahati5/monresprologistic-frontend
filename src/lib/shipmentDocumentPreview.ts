import api from '@/api/client'
import { toast } from 'sonner'

export type ShipmentDocKind = 'invoice' | 'label'

/**
 * Aperçu numérique (HTML) — même gabarit que le PDF, via l’API Laravel.
 * Impression / téléchargement : utiliser les routes `/pdf/...` (voir openPdf.ts).
 */
export async function fetchShipmentDocumentHtml(
  shipmentId: number,
  kind: ShipmentDocKind,
  options?: { suppressToast?: boolean },
): Promise<string | null> {
  const silent = options?.suppressToast === true
  const url =
    kind === 'invoice'
      ? `/api/shipments/${shipmentId}/preview/invoice`
      : `/api/shipments/${shipmentId}/preview/label`
  try {
    const { data } = await api.get<{ html?: string }>(url)
    if (typeof data?.html === 'string' && data.html.trim() !== '') {
      return data.html
    }
    if (!silent) toast.error('Document vide ou invalide')
    return null
  } catch {
    if (!silent) {
      toast.error(
        kind === 'invoice'
          ? 'Impossible de charger la facture'
          : "Impossible de charger l'étiquette",
      )
    }
    return null
  }
}
