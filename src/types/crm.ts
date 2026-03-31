/* ── CRM: Clients, Recipients, Users, Drivers ── */

export interface Client {
  id: number
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  locker_number: string | null
  is_active: boolean
  is_verified: boolean
  total_shipments: number
  total_spent: number
  balance: number
  created_at: string
}

export interface ClientCreatePayload {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
  address?: string
  city?: string
  country?: string
}

export interface RecipientAddress {
  id: number
  label: string
  address: string
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  phone: string | null
  is_default: boolean
}

export interface Recipient {
  id: number
  client_id: number
  name: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  addresses: RecipientAddress[]
  created_at: string
}

export interface RecipientCreatePayload {
  name: string
  email?: string
  phone?: string
  city?: string
  country?: string
}

export interface User {
  id: number
  name: string
  email: string
  level: number
  role_label: string
  agency_id: number | null
  agency_name: string | null
  is_active: boolean
  gender: string | null
  created_at: string
}

export interface UserCreatePayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  level: number
  agency_id?: number
  gender?: string
}

export interface Driver {
  id: number
  name: string
  email: string
  phone: string | null
  license_number: string | null
  vehicle_type: string | null
  vehicle_plate: string | null
  zone: string | null
  is_active: boolean
  total_deliveries: number
  created_at: string
}

export interface DriverCreatePayload {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
  license_number?: string
  vehicle_type?: string
  vehicle_plate?: string
  zone?: string
}

export interface Notification {
  id: string
  type: string
  data: {
    title: string
    message: string
    link?: string
    icon?: string
  }
  read_at: string | null
  created_at: string
}
