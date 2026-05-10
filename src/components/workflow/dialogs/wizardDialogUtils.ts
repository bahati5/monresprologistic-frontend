import type { QueryClient } from '@tanstack/react-query'

export const CREATE_OPTIONS_KEY = ['shipments', 'create-options'] as const

export async function refetchAndPickMaxId(
  qc: QueryClient,
  listPath: 'countries' | 'agencies' | 'packagingTypes' | 'transportCompanies' | 'shipLines',
): Promise<string | null> {
  await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
  const opts = qc.getQueryData([...CREATE_OPTIONS_KEY]) as Record<string, unknown> | undefined
  const list = (opts?.[listPath] as { id: number }[]) || []
  if (!list.length) return null
  const max = list.reduce((m, x) => Math.max(m, x.id), 0)
  return max ? String(max) : null
}

export async function refetchAndPickCountryByCode(qc: QueryClient, code: string): Promise<string | null> {
  await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
  const opts = qc.getQueryData([...CREATE_OPTIONS_KEY]) as Record<string, unknown> | undefined
  const list = (opts?.countries as { id: number; code?: string; iso2?: string }[]) || []
  const u = code.toUpperCase()
  const row =
    list.find((c) => (c.iso2 || c.code || '').toString().toUpperCase() === u) ||
    list.find((c) => (c.code || '').toUpperCase() === u)
  return row ? String(row.id) : refetchAndPickMaxId(qc, 'countries')
}

export function deliveryOptionsForMode(mode: Record<string, unknown>): string[] {
  const raw = (mode.delivery_options ?? mode.deliveryOptions) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x)).filter((s) => s.trim() !== '')
}

export function shipLineRouteSummary(line: Record<string, unknown>) {
  const origins = line.origin_countries as { name?: string }[] | undefined
  const dests = line.destination_countries as { name?: string }[] | undefined
  const o = origins?.map((c) => c.name).filter(Boolean).slice(0, 3).join(', ')
  const d = dests?.map((c) => c.name).filter(Boolean).slice(0, 3).join(', ')
  if (!o && !d) return ''
  return `${o || '…'} → ${d || '…'}`
}
