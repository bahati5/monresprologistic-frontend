export type SuiviPeriod = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year'

export interface SuiviKpis {
  shipments_in_progress: number
  shipments_delivered: number
  shipments_delivered_prev: number
  delayed_count: number
  blocked_count: number
  orders_in_progress: number
  quotes_expiring_soon: number
  open_sav_tickets: number
  sla_at_risk: number
}

export interface SuiviTrendPoint {
  label: string
  total: number
  delivered: number
  in_progress: number
}

export type SuiviAlertSeverity = 'critical' | 'warning' | 'info'
export type SuiviAlertType = 'delay' | 'quote_expiry' | 'sla' | 'blocked'

export interface SuiviAlert {
  type: SuiviAlertType
  severity: SuiviAlertSeverity
  message: string
  href: string
}

export interface DelayedShipment {
  id: number
  uuid: string
  public_tracking: string
  status: string
  status_label: string
  days_stuck: number
  threshold: number
  client_name: string
  destination: string
  updated_at: string
  href: string
}

export interface ActiveOrder {
  id: number
  reference_code: string
  status: string
  status_label: string
  age_hours: number
  is_stale: boolean
  client_name: string | null
  article_label: string
  quote_expires_at: string | null
  created_at: string
  href: string
}

export interface SuiviDashboardData {
  kpis: SuiviKpis
  trends: SuiviTrendPoint[]
  alerts: SuiviAlert[]
  delayed: DelayedShipment[]
  period: SuiviPeriod
  generated_at: string
}

/* ─── Tableau de suivi unifié ─── */

export type SuiviBoardItemType =
  | 'devis'
  | 'expedition'
  | 'sav'
  | 'ramassage'
  | 'livraison'
  | 'regroupement'
  | 'paiement'

export type SuiviBoardPriority = 'critical' | 'high' | 'medium' | 'low'

export interface SuiviBoardItem {
  id: number
  reference: string
  type: SuiviBoardItemType
  type_label: string
  client_name: string | null
  client_id: number | null
  status: string
  status_label: string
  action: string | null
  attention: string | null
  suggestion: string | null
  priority: SuiviBoardPriority
  assigned_to: string | null
  assigned_to_id: number | null
  last_activity: string
  href: string
}

export interface SuiviBoardCounters {
  urgences: number
  devis: number
  expeditions: number
  ramassages: number
  paiements: number
  sav: number
  regroupements: number
  total: number
}

export interface SuiviBoardData {
  items: SuiviBoardItem[]
  counters: SuiviBoardCounters
  generated_at: string
}

export interface SuiviBoardFilters {
  type?: SuiviBoardItemType
  status?: string
  search?: string
  assigned_to?: string
  view?: 'all' | 'mine' | 'urgences'
}
