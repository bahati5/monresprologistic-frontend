export type RowMerchant = { name?: string; logo_url?: string | null }

export function primaryMerchantFromRow(r: Record<string, unknown>): RowMerchant | null {
  const items = r.items as { merchant?: Record<string, unknown> | null }[] | undefined
  const raw = items?.[0]?.merchant
  if (!raw || typeof raw !== 'object') return null
  const logo = raw.logo_url
  return {
    name: typeof raw.name === 'string' ? raw.name : undefined,
    logo_url: logo != null && String(logo).trim() !== '' ? String(logo).trim() : null,
  }
}

export const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending_quote', label: 'En cours de chiffrage' },
  { value: 'awaiting_payment', label: 'Devis disponible' },
  { value: 'paid', label: 'Paiement validé' },
  { value: 'ordered', label: 'Acheté chez le fournisseur' },
  { value: 'arrived_at_hub', label: "Colis reçu à l'entrepôt" },
  { value: 'converted_to_shipment', label: 'Converti en expédition' },
  { value: 'cancelled', label: 'Annulé' },
]
