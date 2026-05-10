import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type {
  Agency,
  ShippingMode,
  PackagingType,
  TransportCompany,
  ShipLine,
  ArticleCategory,
  PricingRule,
  Zone,
  PaymentMethod,
  AgencyPaymentCoordinate,
  NotificationTemplate,
  BillingExtra,
} from '@/types/settings'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const S = '/api/settings'

const SETTINGS_LIST_EXTRA_KEYS: Record<string, string[]> = {
  transport_companies: ['companies'],
  article_categories: ['categories'],
}

function listFromSettingsPayload(data: unknown, snakeKey: string): unknown[] {
  if (data == null) return []
  if (Array.isArray(data)) return data
  if (typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  const camelKey = snakeKey.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
  const tryKeys = [snakeKey, camelKey, ...(SETTINGS_LIST_EXTRA_KEYS[snakeKey] ?? [])]
  for (const k of tryKeys) {
    const v = o[k]
    if (Array.isArray(v)) return v
  }
  return Array.isArray(o.data) ? o.data : []
}

function createCrudHooks<T>(key: string, basePath: string) {
  function useList(enabled = true) {
    return useQuery<T[]>({
      queryKey: ['settings', key],
      queryFn: () => api.get(basePath).then((r) => listFromSettingsPayload(r.data, key) as T[]),
      enabled,
    })
  }

  function useCreate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (payload: Partial<T>) => api.post(basePath, payload).then((r) => r.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['settings', key] })
        toast.success('Element cree')
      },
      onError: (err: Error) => toast.error(getApiErrorMessage(err)),
    })
  }

  function useUpdate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: Partial<T> }) =>
        api.patch(`${basePath}/${id}`, data).then((r) => r.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['settings', key] })
        toast.success('Element mis a jour')
      },
      onError: (err: Error) => toast.error(getApiErrorMessage(err)),
    })
  }

  function useDelete() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => api.delete(`${basePath}/${id}`).then((r) => r.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['settings', key] })
        toast.success('Element supprime')
      },
      onError: (err: Error) => toast.error(getApiErrorMessage(err)),
    })
  }

  return { useList, useCreate, useUpdate, useDelete }
}

export const agencyHooks = createCrudHooks<Agency>('agencies', `${S}/agencies`)
export const shippingModeHooks = createCrudHooks<ShippingMode>('shipping_modes', `${S}/shipping-modes`)
export const packagingTypeHooks = createCrudHooks<PackagingType>(
  'packaging_types',
  `${S}/packaging-types`,
)
export const transportCompanyHooks = createCrudHooks<TransportCompany>(
  'transport_companies',
  `${S}/transport-companies`,
)
export const shipLineHooks = createCrudHooks<ShipLine>('ship_lines', `${S}/ship-lines`)

export function useShippingRatesIndex(enabled = true) {
  return shipLineHooks.useList(enabled)
}

export function useMergeShipLineRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post(`${S}/ship-lines/merge-route`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'ship_lines'] })
      toast.success('Lignes mises à jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export const articleCategoryHooks = createCrudHooks<ArticleCategory>(
  'article_categories',
  `${S}/article-categories`,
)
export const billingExtraHooks = createCrudHooks<BillingExtra>('billing_extras', `${S}/billing-extras`)
export const pricingRuleHooks = createCrudHooks<PricingRule>('pricing_rules', `${S}/pricing-rules`)
export const zoneHooks = createCrudHooks<Zone>('zones', `${S}/zones`)
export const paymentMethodHooks = createCrudHooks<PaymentMethod>(
  'payment_methods',
  `${S}/payment-methods`,
)
export const agencyPaymentCoordinateHooks = createCrudHooks<AgencyPaymentCoordinate>(
  'coordinates',
  `${S}/agency-payment-coordinates`,
)
export const notificationTemplateHooks = createCrudHooks<NotificationTemplate>(
  'templates',
  `${S}/notifications`,
)
