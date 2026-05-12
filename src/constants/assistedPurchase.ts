import type { AssistedPurchaseStatus } from '@/types/assistedPurchase'

export const STATUS_CONFIG: Record<AssistedPurchaseStatus, {
  label: string
  hex: string
  icon: string
}> = {
  pending_quote: { label: 'En attente de devis', hex: '#d97706', icon: 'clock' },
  awaiting_client_info: { label: 'Info client requise', hex: '#8b5cf6', icon: 'message-circle' },
  unmatched_client: { label: 'Client non identifié', hex: '#ef4444', icon: 'user-x' },
  quote_sent: { label: 'Devis envoyé', hex: '#2563eb', icon: 'send' },
  reminder_1: { label: 'Relance 1 envoyée', hex: '#f59e0b', icon: 'bell' },
  reminder_2: { label: 'Relance 2 envoyée', hex: '#ea580c', icon: 'bell-ring' },
  awaiting_payment: { label: 'En attente de paiement', hex: '#059669', icon: 'credit-card' },
  cancelled: { label: 'Refusé', hex: '#dc2626', icon: 'x-circle' },
  expired: { label: 'Expiré', hex: '#6b7280', icon: 'timer-off' },
  on_hold: { label: 'En attente', hex: '#a855f7', icon: 'pause-circle' },
  abandoned: { label: 'Abandonné', hex: '#9ca3af', icon: 'archive' },
  paid: { label: 'Payé', hex: '#059669', icon: 'check-circle' },
  ordered: { label: 'Commandé fournisseur', hex: '#7c3aed', icon: 'shopping-cart' },
  arrived_at_hub: { label: 'Arrivé au hub', hex: '#16a34a', icon: 'package-check' },
  converted_to_shipment: { label: 'Converti en expédition', hex: '#4f46e5', icon: 'truck' },
}

export const QUOTE_DASHBOARD_TABS = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'reminded', label: 'Relancés' },
  { value: 'expired_month', label: 'Expirés ce mois' },
  { value: 'accepted', label: 'Acceptés' },
] as const

export const DEFAULT_QUOTE_VALIDITY_DAYS = 7
export const DEFAULT_REMINDER_1_DELAY_DAYS = 2
export const DEFAULT_REMINDER_2_DELAY_DAYS = 5

export const EMPTY_QUOTE_LINE_FORM = {
  name: '',
  internal_code: '',
  description: '',
  type: 'percentage' as const,
  calculation_base: 'product_price' as const,
  default_value: '',
  behavior: 'optional' as const,
  is_visible_to_client: true,
  is_active: true,
  applies_to: 'all' as const,
}
