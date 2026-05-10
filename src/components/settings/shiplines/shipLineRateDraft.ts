export type RateDraft = {
  shipping_mode_id: number
  unit_price: string
  is_active: boolean
  delivery_label_override: string
}

export function emptyRateRow(): RateDraft {
  return {
    shipping_mode_id: 0,
    unit_price: '0',
    is_active: true,
    delivery_label_override: '',
  }
}

export function deliveryOptionsForMode(mode: Record<string, unknown>): string[] {
  const raw = (mode.delivery_options ?? mode.deliveryOptions) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x)).filter((s) => s.trim() !== '')
}
