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

export interface ShippingMode {
  id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
}

export interface PackagingType {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

export interface DeliveryTime {
  id: number
  label: string
  min_days: number | null
  max_days: number | null
  is_active: boolean
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

export interface ShippingRate {
  id: number
  origin_country_id: number | null
  destination_country_id: number | null
  origin_country?: { id: number; name: string }
  destination_country?: { id: number; name: string }
  shipping_mode_id: number | null
  shipping_mode?: ShippingMode
  rate_type: 'per_kg' | 'per_volume' | 'flat'
  price: number
  min_weight: number | null
  max_weight: number | null
  is_active: boolean
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
