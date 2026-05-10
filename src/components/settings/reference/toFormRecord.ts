import type { AppSettings } from '@/types/settings'

export function toFormRecord(s: AppSettings | undefined): Record<string, unknown> {
  if (!s) return {}
  return { ...(s as unknown as Record<string, unknown>) }
}
