export interface AuthUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  theme_preference: 'light' | 'dark' | 'system'
  roles: string[]
  permissions: string[]
  agency_id: number | null
  created_at: string
}

export interface PhoneCountry {
  id: number
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
