export type ExtraRow = {
  key: string
  billing_extra_id: number | null
  label: string
  calculation_description: string
  type: 'percentage' | 'fixed'
  value: string
}

export function computeLineAmount(base: number, type: 'percentage' | 'fixed', value: number): number {
  if (type === 'fixed') return Math.round(Math.max(value, 0) * 100) / 100
  return Math.round(Math.max(base, 0) * Math.max(value, 0) * 100) / 10000
}
