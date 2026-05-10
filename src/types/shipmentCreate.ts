export interface WizardShipmentItem {
  description: string
  quantity: number
  weight_kg: number
  value: number
  length_cm: number
  width_cm: number
  height_cm: number
  category_id?: number | ''
}

export type ItemsEntryMode = 'per_item' | 'global'

export type WizardCountryRow = {
  id: number
  name: unknown
  code?: string | null
  iso2?: string | null
  emoji?: string | null
}

export type ShipmentCreateLogisticsModal =
  | null
  | { k: 'packaging'; hint?: string }
  | { k: 'transport'; hint?: string }
