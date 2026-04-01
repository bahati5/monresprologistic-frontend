/* ── React Query hooks for all Settings API endpoints ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { mapAppSettingsFromApi, mapAppSettingsToApi } from '@/lib/appSettingsMap'
import { toast } from 'sonner'

const S = '/api/settings'

/** Réponses Laravel camelCase (`shippingModes`) vs clé interne snake (`shipping_modes`). */
const SETTINGS_LIST_EXTRA_KEYS: Record<string, string[]> = {
  shipping_rates: ['rates'],
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

// ─── Generic CRUD factory ───
function useCrudHooks<T>(
  key: string,
  basePath: string,
  opts?: { idField?: string }
) {
  const idField = opts?.idField ?? 'id'

  function useList(enabled = true) {
    return useQuery<T[]>({
      queryKey: ['settings', key],
      queryFn: () => api.get(basePath).then(r => listFromSettingsPayload(r.data, key) as T[]),
      enabled,
    })
  }

  function useCreate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (payload: Partial<T>) => api.post(basePath, payload).then(r => r.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['settings', key] })
        toast.success('Element cree')
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
    })
  }

  function useUpdate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: Partial<T> }) =>
        api.patch(`${basePath}/${id}`, data).then(r => r.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['settings', key] })
        toast.success('Element mis a jour')
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
    })
  }

  function useDelete() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: number) => api.delete(`${basePath}/${id}`).then(r => r.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['settings', key] })
        toast.success('Element supprime')
      },
      onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
    })
  }

  return { useList, useCreate, useUpdate, useDelete }
}

// ─── App Settings (single object, GET/PUT) ───
export type ApiCountryRow = {
  id: number
  name: string
  code: string
  iso2?: string | null
  phonecode?: string | null
  emoji?: string | null
}

function normalizeCountryRow(raw: Record<string, unknown>): ApiCountryRow {
  const isoVal = raw.iso2 ?? raw.iso_2
  const phoneVal = raw.phonecode ?? raw.phone_code
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    code: raw.code != null && raw.code !== '' ? String(raw.code) : '',
    iso2: isoVal != null && isoVal !== '' ? String(isoVal) : null,
    phonecode: phoneVal != null && phoneVal !== '' ? String(phoneVal) : null,
    emoji: raw.emoji != null && raw.emoji !== '' ? String(raw.emoji) : null,
  }
}

export function useAppSettings() {
  return useQuery<AppSettings>({
    queryKey: ['settings', 'app'],
    queryFn: () => api.get(`${S}/app`).then((r) => mapAppSettingsFromApi(r.data)),
  })
}

export function useUpdateAppSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      api.put(`${S}/app`, mapAppSettingsToApi(data)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      toast.success('Parametres enregistres')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUploadLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('logo', file)
      return api.post(`${S}/app/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      toast.success('Logo mis a jour')
    },
  })
}

export function useUploadFavicon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('favicon', file)
      return api.post(`${S}/app/favicon`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      toast.success('Favicon mis a jour')
    },
  })
}

export function useCountriesList() {
  return useQuery({
    queryKey: ['locations', 'countries'],
    queryFn: () =>
      api.get<Record<string, unknown>[]>('/api/locations/countries').then((r) => {
        const rows = r.data
        return Array.isArray(rows) ? rows.map(normalizeCountryRow) : []
      }),
  })
}

export function useTimezonesList() {
  return useQuery({
    queryKey: ['locations', 'timezones'],
    queryFn: () => api.get<string[]>('/api/locations/timezones').then((r) => r.data),
    staleTime: 60 * 60 * 1000,
  })
}

export type PhoneCountryApiRow = {
  id: number
  name: string
  iso2?: string | null
  phonecode: string
  emoji?: string | null
}

/** Pays avec indicatif (sélecteur téléphone). */
export function usePhoneCountries() {
  return useQuery<PhoneCountryApiRow[]>({
    queryKey: ['locations', 'phone-countries'],
    queryFn: () =>
      api.get<PhoneCountryApiRow[]>('/api/locations/phone-countries').then((r) =>
        Array.isArray(r.data) ? r.data : [],
      ),
    staleTime: 60 * 60 * 1000,
  })
}

export function useCreateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; code: string; iso2?: string; emoji?: string; is_active?: boolean }) =>
      api.post('/api/settings/locations/countries', { is_active: true, ...payload }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['locations', 'countries'] })
      qc.invalidateQueries({ queryKey: ['settings', 'locations'] })
      toast.success('Pays ajoute')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ─── Settings Hub overview ───
export function useSettingsHub() {
  return useQuery({
    queryKey: ['settings', 'hub'],
    queryFn: () => api.get(`${S}`).then(r => r.data),
  })
}

// ─── CRUD Hooks per entity ───
import type {
  AppSettings,
  Agency, Office, ShippingMode, PackagingType,
  TransportCompany, ShipLine, ArticleCategory, Tax, ShippingRate,
  PricingRule, Zone, Status, PaymentMethod, AgencyPaymentCoordinate,
  NotificationTemplate, DocumentTemplate, ShippingRatesIndexPayload,
} from '@/types/settings'

export const agencyHooks    = useCrudHooks<Agency>('agencies', `${S}/agencies`)
export const officeHooks    = useCrudHooks<Office>('offices', `${S}/offices`)
export const shippingModeHooks   = useCrudHooks<ShippingMode>('shipping_modes', `${S}/shipping-modes`)
export const packagingTypeHooks  = useCrudHooks<PackagingType>('packaging_types', `${S}/packaging-types`)
export const transportCompanyHooks = useCrudHooks<TransportCompany>('transport_companies', `${S}/transport-companies`)
export const shipLineHooks       = useCrudHooks<ShipLine>('ship_lines', `${S}/ship-lines`)

/** Ajoute pays + tarifs (par mode) à une ou plusieurs lignes existantes — POST /api/settings/ship-lines/merge-route */
export function useMergeShipLineRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post(`${S}/ship-lines/merge-route`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'ship_lines'] })
      toast.success('Lignes mises à jour')
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Erreur'),
  })
}
export const articleCategoryHooks = useCrudHooks<ArticleCategory>('article_categories', `${S}/article-categories`)
export const taxHooks            = useCrudHooks<Tax>('taxes', `${S}/taxes`)
export const shippingRateHooks   = useCrudHooks<ShippingRate>('shipping_rates', `${S}/shipping-rates`)

/** Index complet tarifs (lignes + pays + modes + agences) pour l’éditeur multi-sélection. */
export function useShippingRatesIndex(enabled = true) {
  return useQuery<ShippingRatesIndexPayload>({
    queryKey: ['settings', 'shipping_rates', 'index'],
    queryFn: async () => {
      const r = await api.get(`${S}/shipping-rates`)
      const d = r.data as Record<string, unknown>
      const modes = d.shipping_modes ?? d.shippingModes
      return {
        rates: (Array.isArray(d.rates) ? d.rates : []) as ShippingRate[],
        countries: (Array.isArray(d.countries) ? d.countries : []) as ShippingRatesIndexPayload['countries'],
        shippingModes: (Array.isArray(modes) ? modes : []) as ShippingRatesIndexPayload['shippingModes'],
        agencies: (Array.isArray(d.agencies) ? d.agencies : []) as ShippingRatesIndexPayload['agencies'],
      }
    },
    enabled,
  })
}
export const pricingRuleHooks    = useCrudHooks<PricingRule>('pricing_rules', `${S}/pricing-rules`)
export const zoneHooks           = useCrudHooks<Zone>('zones', `${S}/zones`)
export const statusHooks         = useCrudHooks<Status>('statuses', `${S}/statuses`)
export const paymentMethodHooks  = useCrudHooks<PaymentMethod>('payment_methods', `${S}/payment-methods`)
export const agencyPaymentCoordinateHooks = useCrudHooks<AgencyPaymentCoordinate>('coordinates', `${S}/agency-payment-coordinates`)
export const notificationTemplateHooks = useCrudHooks<NotificationTemplate>('templates', `${S}/notifications`)
export const documentTemplateHooks = useCrudHooks<DocumentTemplate>('templates', `${S}/document-templates`)

// ─── Workflows (custom) ───
export function useWorkflows() {
  return useQuery({
    queryKey: ['settings', 'workflows'],
    queryFn: () => api.get(`${S}/workflows`).then(r => r.data?.transitions ?? r.data ?? []),
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { from_status_id: number; to_status_id: number; roles: string[] }) =>
      api.post(`${S}/workflows`, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'workflows'] })
      toast.success('Transition creee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/workflows/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'workflows'] })
      toast.success('Transition supprimee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ─── Payment Gateways (GET/PUT single object) ───
export function usePaymentGateways() {
  return useQuery({
    queryKey: ['settings', 'payment-gateways'],
    queryFn: () => api.get(`${S}/payment-gateways`).then(r => r.data),
  })
}

export function useUpdatePaymentGateways() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, any>) => api.put(`${S}/payment-gateways`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'payment-gateways'] })
      toast.success('Passerelles mises a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ─── SMTP Config (GET/PUT) ───
export function useSmtpConfig() {
  return useQuery({
    queryKey: ['settings', 'smtp'],
    queryFn: () => api.get(`${S}/smtp-config`).then(r => r.data),
  })
}

export function useUpdateSmtpConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, any>) => api.put(`${S}/smtp-config`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'smtp'] })
      toast.success('Configuration SMTP enregistree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ─── Twilio Config (GET/PUT) ───
export function useTwilioConfig() {
  return useQuery({
    queryKey: ['settings', 'twilio'],
    queryFn: () => api.get(`${S}/twilio-config`).then(r => r.data),
  })
}

export function useUpdateTwilioConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, any>) => api.put(`${S}/twilio-config`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'twilio'] })
      toast.success('Configuration Twilio enregistree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ─── Document Templates (GET/PUT) ───
export function useDocumentTemplates() {
  return useQuery({
    queryKey: ['settings', 'document-templates'],
    queryFn: () => api.get(`${S}/document-templates`).then(r => r.data),
  })
}

export function useUpdateDocumentTemplates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, any>) => api.put(`${S}/document-templates`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'document-templates'] })
      toast.success('Templates mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ─── Locations (GET + CRUD countries/states/cities) ───
export function useLocations() {
  return useQuery({
    queryKey: ['settings', 'locations'],
    queryFn: () => api.get(`${S}/locations`).then(r => r.data),
  })
}

export function useDeleteCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/countries/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'locations'] })
      toast.success('Pays supprime')
    },
  })
}

export function useCreateState() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; country_id: number }) =>
      api.post(`${S}/locations/states`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'locations'] })
      toast.success('Region creee')
    },
  })
}

export function useDeleteState() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/states/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'locations'] })
      toast.success('Region supprimee')
    },
  })
}

export function useCreateCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; state_id: number }) =>
      api.post(`${S}/locations/cities`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'locations'] })
      toast.success('Ville creee')
    },
  })
}

export function useDeleteCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/cities/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'locations'] })
      toast.success('Ville supprimee')
    },
  })
}
