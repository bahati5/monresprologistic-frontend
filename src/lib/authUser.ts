import type { AuthUser } from '@/types'

/** Accepte un tableau de noms (string) ou d’objets Spatie `{ name }` et renvoie des chaînes. */
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

/** Assure `roles` / `permissions` en `string[]` pour tout le frontend (évite de rendre des objets React). */
export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null
  const u = raw as Record<string, unknown>
  const base = u as unknown as AuthUser
  return {
    ...base,
    roles: toNameList(u.roles),
    permissions: toNameList(u.permissions),
  }
}
