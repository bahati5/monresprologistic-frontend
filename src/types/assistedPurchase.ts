import type { ReactNode } from 'react'

export type AssistedPurchaseStatus =
  | 'pending_quote'
  | 'awaiting_client_info'
  | 'unmatched_client'
  | 'quote_sent'
  | 'reminder_1'
  | 'reminder_2'
  | 'awaiting_payment'
  | 'cancelled'
  | 'expired'
  | 'on_hold'
  | 'abandoned'
  | 'paid'
  | 'ordered'
  | 'arrived_at_hub'
  | 'converted_to_shipment'

export type QuoteLineType = 'percentage' | 'fixed_amount' | 'manual'
export type QuoteLineCalculationBase = 'product_price' | 'subtotal_after_commission'
export type QuoteLineAppliesTo = 'all' | 'assisted_purchase' | 'shipment'
export type QuoteLineBehavior = 'mandatory' | 'optional' | 'optional_included'

export interface QuoteLineTemplate {
  id: number
  agency_id: number
  name: string
  internal_code: string
  description: string | null
  type: QuoteLineType
  calculation_base: QuoteLineCalculationBase | null
  default_value: number | null
  is_mandatory: boolean
  is_visible_to_client: boolean
  is_active: boolean
  display_order: number
  applies_to: QuoteLineAppliesTo
  behavior: QuoteLineBehavior
  created_at: string
  updated_at: string
}

export interface QuoteLineTemplateFormData {
  name: string
  internal_code: string
  description: string
  type: QuoteLineType
  calculation_base: QuoteLineCalculationBase | null
  default_value: string
  behavior: QuoteLineBehavior
  is_visible_to_client: boolean
  is_active: boolean
  applies_to: QuoteLineAppliesTo
}

export interface QuoteTemplate {
  id: number
  agency_id: number
  name: string
  description: string | null
  is_shared: boolean
  created_by_name: string | null
  usage_count: number
  lines: QuoteTemplateLineConfig[]
  created_at: string
  updated_at: string
}

export interface QuoteTemplateLineConfig {
  quote_line_template_id: number
  custom_value: number | null
  template_name?: string
}

export interface QuoteTemplateFormData {
  name: string
  description: string
  is_shared: boolean
  lines: {
    quote_line_template_id: number
    included: boolean
    custom_value: string
  }[]
}

export interface ActiveQuoteLine {
  id: string
  template_id: number | null
  internal_code: string
  name: string
  description: string | null
  type: QuoteLineType
  calculation_base: QuoteLineCalculationBase | null
  value: string
  is_mandatory: boolean
  is_visible_to_client: boolean
  display_order: number
  is_modified: boolean
  original_value: number | null
  zero_reason?: string
}

export interface QuoteCurrencySettings {
  primary_currency: string
  secondary_currency_enabled: boolean
  secondary_currency: string
  secondary_currency_rate_mode: 'manual' | 'automatic'
  secondary_currency_rate: number
  secondary_currency_rate_updated_at: string | null
}

export interface QuoteCalculationResult {
  lines: { code: string; name: string; amount: number; base_amount?: number }[]
  total: number
  total_secondary: number | null
}

export interface ArticleAvailability {
  status: 'not_checked' | 'available_exact' | 'available_alternative' | 'unavailable'
  alternative_note: string
}

export interface ArticlePreference {
  primary: string
  alternative: string | null
  alternative_declared: boolean
}

export interface PurchaseArticle {
  id: number
  name: string
  product_url: string
  price_original: number | null
  price_converted: number | null
  currency_original: string | null
  quantity: number
  merchant: { id?: number; name?: string; logo_url?: string | null } | null
  attributes: Record<string, string[]>
  preference: ArticlePreference | null
  availability: ArticleAvailability
  image_url: string | null
  is_available: boolean | null
  scrape_status: 'pending' | 'success' | 'failed' | 'manual'
  options_label: string | null
}

export interface QuoteSnapshot {
  product_price_usd: number
  exchange_rates_used: Record<string, unknown>
  lines: {
    template_id: number | null
    code: string
    name: string
    type: QuoteLineType
    base: QuoteLineCalculationBase | null
    rate: number | null
    base_amount: number | null
    calculated_amount: number
    modified_from_template: boolean
    visible_to_client: boolean
  }[]
  primary_currency: string
  total_primary: number
  secondary_currency_enabled: boolean
  secondary_currency: string | null
  secondary_currency_rate: number | null
  total_secondary: number | null
}

export interface QuoteFollowUpSettings {
  quote_validity_days: number
  reminder_1_delay_days: number
  reminder_2_delay_days: number
  auto_reminders_enabled: boolean
}

export interface QuoteTrackingEntry {
  id: number
  quote_id: number
  status: AssistedPurchaseStatus
  created_at: string
  note: string | null
  changed_by_name: string | null
}

export interface RefusalReason {
  code: string
  label: string
}

export const REFUSAL_REASONS: RefusalReason[] = [
  { code: 'price_too_high', label: 'Prix trop élevé' },
  { code: 'no_longer_needed', label: "Je n'en ai plus besoin" },
  { code: 'found_cheaper', label: "J'ai trouvé moins cher ailleurs" },
  { code: 'delivery_too_long', label: 'Délai trop long' },
  { code: 'other', label: 'Autre' },
]

export interface QuoteDashboardMetrics {
  total_open: number
  total_value_pending: number
  acceptance_rate_month: number
  quotes_by_status: Record<string, number>
}

export interface QuoteDashboardRow {
  id: number
  reference: string
  client_name: string
  amount: number
  currency: string
  sent_at: string | null
  expires_at: string | null
  status: AssistedPurchaseStatus
  reminder_count: number
  has_call_task: boolean
}

export interface AssistedPurchaseAnalytics {
  quotes_sent: number
  acceptance_rate: number
  total_revenue: number
  avg_response_days: number
  weekly_breakdown: Record<string, {
    total: number
    accepted: number
    refused: number
    expired: number
  }>
  top_merchants: { name: string; percentage: number }[]
  refusal_reasons: { reason: string; percentage: number }[]
  reminder_effectiveness: {
    after_reminder_1: number
    after_reminder_2: number
  }
  clarification_rate: number
}

export interface OneTimeLineData {
  label: string
  type: 'fixed_amount' | 'percentage'
  value: string
  calculation_base: QuoteLineCalculationBase | null
  is_visible_to_client: boolean
}

export interface QuoteEditorProps {
  purchaseId: string | number
  articles: PurchaseArticle[]
  clientNote: string | null
  onSendQuote: (payload: QuoteEditorPayload) => Promise<void>
  isSending: boolean
  canEdit: boolean
  currency: string
  headerActions?: ReactNode
}

export interface QuoteEditorPayload {
  lines: {
    template_id: number | null
    internal_code: string
    name: string
    type: QuoteLineType
    calculation_base: QuoteLineCalculationBase | null
    value: number
    is_visible_to_client: boolean
  }[]
  articles: {
    id: number
    quantity: number
    unit_price: number
    availability_status: string
    alternative_note: string | null
  }[]
  estimated_delivery: string
  staff_message: string
  template_id: number | null
}
