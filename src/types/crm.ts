/* ── CRM: Clients, Users, Drivers ── */

import type { PaginatedData } from './index'

export interface Client {
  uuid: string
  name: string
  full_name?: string
  first_name?: string
  last_name?: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  locker_number: string | null
  is_active: boolean
  is_verified: boolean
  is_client?: boolean
  is_staff?: boolean
  has_shipments_as_sender?: boolean
  has_shipments_as_recipient?: boolean
  shipments_as_sender_count?: number
  shipments_as_recipient_count?: number
  total_shipments: number
  total_spent: number
  balance: number
  created_at: string
}

export interface ClientCreatePayload {
  name: string
  email: string
  phone?: string
  password?: string
  password_confirmation?: string
  address?: string
  city?: string
  country?: string
  create_portal?: boolean
}

export interface User {
  uuid: string
  name: string
  email: string
  phone?: string | null
  roles?: { uuid?: string; name?: string; code?: string }[]
  role?: string
  agency_uuid?: string | null
  agency_name?: string | null
  is_active: boolean
  created_at: string
}

export interface UserCreatePayload {
  name: string
  email: string
  phone?: string
  password: string
  role: string
  agency_uuid?: string
}

/** Réponse GET /api/users (pagination + rôles assignables côté API). */
export interface UsersListResult extends PaginatedData<User> {
  availableRoles: string[]
  agencies?: { uuid: string; name: string }[]
}

export interface Driver {
  uuid: string
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
  uuid: string
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
