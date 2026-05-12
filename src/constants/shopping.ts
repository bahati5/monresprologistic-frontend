export const DEFAULT_PAYMENT_METHODS_NOTE =
  'Moyens de paiement acceptés : MPESA - ORANGE MONEY - AIRTEL MONEY - AFRIMONEY'

export const STATUS_HEX: Record<string, string> = {
  pending_quote: '#d97706',
  awaiting_client_info: '#8b5cf6',
  unmatched_client: '#ef4444',
  quote_sent: '#2563eb',
  reminder_1: '#f59e0b',
  reminder_2: '#ea580c',
  awaiting_payment: '#2563eb',
  paid: '#059669',
  ordered: '#7c3aed',
  arrived_at_hub: '#16a34a',
  converted_to_shipment: '#4f46e5',
  cancelled: '#dc2626',
  expired: '#6b7280',
  on_hold: '#a855f7',
  abandoned: '#9ca3af',
}
