import type { Menu, FrontendElement } from './rbac'

export interface AuthUserRole {
  uuid: string
  code: string
  name: string
  description: string | null
}

export interface AuthUser {
  uuid: string
  name: string
  first_name?: string | null
  last_name?: string | null
  email: string
  email_verified_at: string | null
  theme_preference: 'light' | 'dark' | 'system'
  avatar_url?: string | null
  phone?: string | null
  roles: string[]
  permissions: string[]
  effective_permissions?: string[]
  agency_id: number | null
  created_at: string
  role?: AuthUserRole
  accessible_menus?: Menu[]
  accessible_pages?: FrontendElement[]
}

export interface PhoneCountry {
  id: number
  uuid?: string
  name: string
  iso2: string
  phone_code: string
}

export interface AppCurrency {
  code: string
  symbol: string
  position: 'before' | 'after'
}

export interface PaginatedData<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  links: PaginationLink[]
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface StatusData {
  id: number
  code: string
  name: string
  color?: string
  sort_order?: number
  is_active?: boolean
}

export interface FlashMessage {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}
