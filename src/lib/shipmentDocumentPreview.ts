import api from '@/api/client'
import { toast } from 'sonner'

export type ShipmentDocKind = 'invoice' | 'label' | 'form'

const PREVIEW_URLS: Record<ShipmentDocKind, string> = {
  invoice: 'preview/invoice',
  label: 'preview/label',
  form: 'preview/form',
}

const ERROR_LABELS: Record<ShipmentDocKind, string> = {
  invoice: 'Impossible de charger la facture',
  label: "Impossible de charger l'étiquette",
  form: "Impossible de charger le formulaire d'expédition",
}

/**
 * Aperçu numérique (HTML) — même gabarit que le PDF, via l'API Laravel.
 * Impression / téléchargement : utiliser les routes `/pdf/...` (voir openPdf.ts).
 */
export async function fetchShipmentDocumentHtml(
  shipmentId: number,
  kind: ShipmentDocKind,
  options?: { suppressToast?: boolean },
): Promise<string | null> {
  const silent = options?.suppressToast === true
  const url = `/api/shipments/${shipmentId}/${PREVIEW_URLS[kind]}`
  try {
    const { data } = await api.get<{ html?: string }>(url)
    if (typeof data?.html === 'string' && data.html.trim() !== '') {
      return data.html
    }
    if (!silent) toast.error('Document vide ou invalide')
    return null
  } catch {
    if (!silent) toast.error(ERROR_LABELS[kind])
    return null
  }
}
