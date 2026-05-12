import type { AuthUser } from '@/types'
import type { Menu, FrontendElement } from '@/types/rbac'

function toNameList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item !== '') out.push(item)
    else if (item && typeof item === 'object' && 'name' in item) {
      const n = (item as { name: unknown }).name
      if (typeof n === 'string' && n !== '') out.push(n)
    }
  }
  return out
}

function toMenuList(raw: unknown): Menu[] {
  if (!Array.isArray(raw)) return []
  return raw as Menu[]
}

function toPageList(raw: unknown): FrontendElement[] {
  if (!Array.isArray(raw)) return []
  return (raw as FrontendElement[]).map((p) => ({
    ...p,
    permissions: toNameList(p.permissions),
  }))
}

export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null
  const u = raw as Record<string, unknown>
  const base = u as unknown as AuthUser
  return {
    ...base,
    roles: toNameList(u.roles),
    permissions: toNameList(u.permissions),
    effective_permissions: toNameList(u.effective_permissions),
    accessible_menus: toMenuList(u.accessible_menus),
    accessible_pages: toPageList(u.accessible_pages),
  }
}
