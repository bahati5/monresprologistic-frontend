/* ── Settings entity types ── */

export interface AppSettings {
  app_name: string
  app_url: string
  app_email: string
  nit: string
  phone: string
  mobile: string
  address: string
  country: string
  city: string
  postal_code: string
  locker_address: string
  locker_prefix: string
  locker_digits: number
  locker_mode: 'random' | 'sequential'
  auto_verify: boolean
  allow_registration: boolean
  admin_notification: boolean
  timezone: string
  language: string
  currency: string
  currency_symbol: string
  currency_position: 'before' | 'after'
  decimals: number
  number_format: string
  logo_url: string | null
  favicon_url: string | null
}

export interface Agency {
  id: number
  name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  is_active: boolean
  color: string | null
  created_at: string
}

export interface Office {
  id: number
  name: string
  address: string
  city: string
  country: string
  phone: string
  agency_id: number | null
  agency?: Agency
  is_active: boolean
}

export interface DeliveryTimeNested {
  id: number
  label: string
  description?: string | null
  shipping_mode_id?: number
  is_active: boolean
  sort_order?: number
}

export interface ShippingMode {
  id: number
  name: string
  code?: string | null
  description: string | null
  is_active: boolean
  sort_order?: number
  delivery_times?: DeliveryTimeNested[]
  delivery_times_count?: number
}

export interface PackagingType {
  id: number
  name: string
  description: string | null
  is_active: boolean
  is_billable?: boolean
  unit_price?: number | string | null
  sort_order?: number
}

/** @deprecated Utiliser les délais imbriqués sous ShippingMode ; type conservé pour compat. */
export interface DeliveryTime {
  id: number
  label: string
  shipping_mode_id?: number | null
  is_active: boolean
  sort_order?: number
}

export interface TransportCompany {
  id: number
  name: string
  logo_url: string | null
  contact: string | null
  is_active: boolean
}

export interface ShipLine {
  id: number
  name: string
  origin: string
  destination: string
  mode: string | null
  is_active: boolean
}

export interface ArticleCategory {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

export interface Tax {
  id: number
  name: string
  type: 'percentage' | 'fixed'
  value: number
  is_active: boolean
}

/** Pays (liste tarifs / pivots) — aligné API `settings/shipping-rates`. */
export interface ShippingRateCountryRef {
  id: number
  name: string
  code?: string | null
  iso2?: string | null
  emoji?: string | null
}

export interface ShippingRate {
  id: number
  agency_id?: number | null
  origin_country_id?: number | null
  dest_country_id?: number | null
  shipping_mode_id?: number | null
  pricing_type: 'per_kg' | 'per_volume' | 'flat'
  unit_price: number | string
  currency?: string
  weight_tiers?: unknown[] | Record<string, unknown> | null
  is_active: boolean
  agency?: { id: number; name: string }
  origin_country?: ShippingRateCountryRef
  dest_country?: ShippingRateCountryRef
  shipping_mode?: ShippingMode
  shipping_modes?: ShippingMode[]
  origin_countries?: ShippingRateCountryRef[]
  destination_countries?: ShippingRateCountryRef[]
}

export interface ShippingRatesIndexPayload {
  rates: ShippingRate[]
  countries: ShippingRateCountryRef[]
  shippingModes: { id: number; name: string; code?: string | null }[]
  agencies: { id: number; name: string }[]
}

export interface PricingRule {
  id: number
  name: string
  type: string
  conditions: Record<string, any>
  value: number
  is_active: boolean
}

export interface Zone {
  id: number
  name: string
  countries: number[]
  description: string | null
}

export interface Status {
  id: number
  code: string
  name: string
  color: string
  icon: string | null
  sort_order: number
  is_active: boolean
  entity_type: string
}

export interface WorkflowTransition {
  id: number
  from_status_id: number
  to_status_id: number
  from_status?: Status
  to_status?: Status
  roles: string[]
}

export interface PaymentMethod {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

export interface PaymentGatewayConfig {
  gateway: 'paypal' | 'stripe' | 'paystack' | 'wire_transfer'
  is_active: boolean
  config: Record<string, string>
}

export interface AgencyPaymentCoordinate {
  id: number
  agency_id: number
  agency?: Agency
  label: string
  details: string
}

export interface NotificationTemplate {
  id: number
  event: string
  channel: 'email' | 'sms' | 'whatsapp'
  subject: string | null
  body: string
  is_active: boolean
  variables: string[]
}

export interface SmtpConfig {
  host: string
  port: number
  encryption: 'tls' | 'ssl' | 'none'
  username: string
  password: string
  from_email: string
  from_name: string
}

export interface TwilioConfig {
  account_sid: string
  auth_token: string
  from_number: string
  is_active: boolean
  whatsapp_number: string
  whatsapp_active: boolean
}

export interface DocumentTemplate {
  id: number
  type: string
  name: string
  content: string
}

export interface LocationCountry {
  id: number
  name: string
  iso2: string
  phone_code: string
  is_active: boolean
}

export interface LocationState {
  id: number
  name: string
  country_id: number
  country?: LocationCountry
}

export interface LocationCity {
  id: number
  name: string
  state_id: number
  state?: LocationState
}

export interface LocationData {
  countries: LocationCountry[]
  states: LocationState[]
  cities: LocationCity[]
}
