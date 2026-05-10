export type SettingsMerchantRow = {
  id: number
  name: string
  domains: string[] | null
  logo_url: string | null
  commission_rate?: number | null
  estimated_delivery_days?: number | null
  is_active: boolean
  sort_order?: number
}

export type MerchantSheetMode = 'create' | 'edit'

export type MerchantFormState = {
  name: string
  domainsInput: string
  logo_url: string
  commission_rate: string
  estimated_delivery_days: string
  is_active: boolean
  sort_order: string
}

export function emptyMerchantForm(): MerchantFormState {
  return {
    name: '',
    domainsInput: '',
    logo_url: '',
    commission_rate: '',
    estimated_delivery_days: '',
    is_active: true,
    sort_order: '0',
  }
}
