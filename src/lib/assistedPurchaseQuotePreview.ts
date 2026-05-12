import api from '@/api/client'
import { toast } from 'sonner'

/**
 * Aperçu HTML du devis PDF (achat assisté), même gabarit que le PDF.
 */
export async function fetchAssistedPurchaseQuoteHtml(
  purchaseId: number | string,
  options?: { suppressToast?: boolean },
): Promise<string | null> {
  const silent = options?.suppressToast === true
  try {
    const { data } = await api.get<{ html?: string }>(`/api/assisted-purchases/${purchaseId}/preview/quote`)
    if (typeof data?.html === 'string' && data.html.trim() !== '') {
      return data.html
    }
    if (!silent) toast.error('Devis indisponible pour un aperçu numérique.')
    return null
  } catch {
    if (!silent) toast.error('Impossible de charger le devis.')
    return null
  }
}
