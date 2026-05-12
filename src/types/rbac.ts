export interface Menu {
  uuid: string
  code: string
  name: string
  description: string | null
  icon: string | null
  order: number
  is_active: boolean
  /** Présent quand l’API utilise `withCount('elements')`. */
  elements_count?: number
}

export interface FrontendElement {
  uuid: string
  code: string
  name: string
  description: string | null
  route: string
  icon: string | null
  order: number
  is_page: boolean
  is_active: boolean
  display_in_sidebar: boolean
  menu: Menu | null
  permissions: string[]
}

export interface Permission {
  id: number
  name: string
  module: string
}

export interface PermissionGroup {
  uuid: string
  code: string
  name: string
  description: string | null
  is_active: boolean
  permissions: string[]
  permissions_count: number
}

export interface Role {
  uuid: string | null
  code: string
  name: string
  description: string | null
  is_system: boolean
  level: number
  permissions: string[]
  groups: PermissionGroup[]
  permissions_count: number
  users_count: number
  groups_count: number
}
