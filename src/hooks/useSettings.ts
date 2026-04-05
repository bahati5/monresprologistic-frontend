/* ── React Query hooks for all Settings API endpoints ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { mapAppSettingsFromApi, mapAppSettingsToApi } from '@/lib/appSettingsMap'
import { formatMoneyFromBranding } from '@/lib/formatCurrency'
import type {
  AppSettings,
  PublicBranding,
  Agency, ShippingMode, PackagingType,
  TransportCompany, ShipLine, ArticleCategory,
  PricingRule, Zone, PaymentMethod, AgencyPaymentCoordinate,
  NotificationTemplate, BillingExtra,
} from '@/types/settings'
import { toast } from 'sonner'

const S = '/api/settings'

function truthySetting(v: unknown): boolean {
  return v === '1' || v === 1 || v === true || v === 'true'
}

export function mapPublicBranding(raw: Record<string, unknown>): PublicBranding {
  const strOrNull = (v: unknown): string | null => {
    if (v == null || v === '') return null
    const s = String(v).trim()
    return s === '' ? null : s
  }

  const cur = String(raw.currency ?? '').trim()
  const posRaw = String(raw.currency_position ?? raw.symbol_position ?? 'after').toLowerCase()
  // before / prefix → avant ; after / suffix / autres → après
  const currency_position: 'before' | 'after' =
    posRaw === 'before' || posRaw === 'prefix' ? 'before' : 'after'

  return {
    logo_url: strOrNull(raw.logo_url),
    favicon_url: strOrNull(raw.favicon_url),
    site_name: String(raw.site_name ?? ''),
    hub_brand_name: String(raw.hub_brand_name ?? ''),
    show_sidebar_brand_with_logo: truthySetting(raw.show_sidebar_brand_with_logo ?? '1'),
    currency: cur !== '' ? cur : 'EUR',
    currency_symbol: String(raw.currency_symbol ?? ''),
    currency_position,
  }
}

export function usePublicBranding() {
  return useQuery<PublicBranding>({
    queryKey: ['branding'],
    queryFn: () => api.get<Record<string, unknown>>('/api/branding').then((r) => mapPublicBranding(r.data)),
    staleTime: 60_000,
    retry: 1,
  })
}

/** Format monétaire UI : symbole global des paramètres (pas le code ISO). */
export function useFormatMoney() {
  const { data: branding } = usePublicBranding()

  return {
    formatMoney: (amount: number, fractionDigits?: { min?: number; max?: number }) =>
      formatMoneyFromBranding(amount, branding, fractionDigits),
    branding,
  }
}

/** Réponses Laravel : clés JSON réelles vs snake_case attendu par le hook. */
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
      qc.invalidateQueries({ queryKey: ['branding'] })
      toast.success('Parametres enregistres')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

/** Mise à jour partielle (clés API snake_case déjà prêtes pour le backend). */
export function useUpdateAppSettingsPartial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put(`${S}/app`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
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
      return api
        .post<{ message: string; logo_url?: string }>(`${S}/app/logo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: (data) => {
      if (data?.logo_url) {
        qc.setQueryData(['settings', 'app'], (old: AppSettings | undefined) =>
          old ? { ...old, logo_url: data.logo_url! } : old,
        )
      }
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
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
      return api
        .post<{ message: string; favicon_url?: string }>(`${S}/app/favicon`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: (data) => {
      if (data?.favicon_url) {
        qc.setQueryData(['settings', 'app'], (old: AppSettings | undefined) =>
          old ? { ...old, favicon_url: data.favicon_url! } : old,
        )
      }
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
      toast.success('Favicon mis a jour')
    },
  })
}

export function useCountriesList(enabled = true) {
  return useQuery({
    queryKey: ['locations', 'countries'],
    queryFn: () =>
      api.get<Record<string, unknown>[]>('/api/locations/countries').then((r) => {
        const rows = r.data
        return Array.isArray(rows) ? rows.map(normalizeCountryRow) : []
      }),
    enabled,
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

export type CreatedLocationCountry = {
  id: number
  name: string
  code: string
  iso2?: string | null
  emoji?: string | null
  is_active?: boolean
}

export type CreateCountryResponse = {
  message: string
  country: CreatedLocationCountry
}

export type CreatedLocationState = {
  id: number
  name: string
  code?: string | null
  country_id: number
  is_active?: boolean
}

export type CreateStateResponse = {
  message: string
  state: CreatedLocationState
}

export type CreatedLocationCity = {
  id: number
  name: string
  state_id: number
  is_active?: boolean
}

export type CreateCityResponse = {
  message: string
  city: CreatedLocationCity
}

/** Invalide les listes pays / régions / villes utilisées par `useLocationCascade`. */
export function invalidateLocationCascadeQueries(
  qc: QueryClient,
  opts?: { countryId?: number; stateId?: number },
) {
  qc.invalidateQueries({ queryKey: ['locations', 'countries'] })
  qc.invalidateQueries({ queryKey: ['locations', 'phone-countries'] })
  qc.invalidateQueries({ queryKey: ['settings', 'locations'] })
  if (opts?.countryId != null) {
    qc.invalidateQueries({ queryKey: ['locations', 'states', opts.countryId] })
  } else {
    qc.invalidateQueries({ queryKey: ['locations', 'states'] })
  }
  if (opts?.stateId != null) {
    qc.invalidateQueries({ queryKey: ['locations', 'cities', opts.stateId] })
  } else {
    qc.invalidateQueries({ queryKey: ['locations', 'cities'] })
  }
}

export function useCreateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; code: string; iso2?: string; emoji?: string; is_active?: boolean }) =>
      api.post<CreateCountryResponse>('/api/settings/locations/countries', { is_active: true, ...payload }).then((r) => r.data),
    onSuccess: () => {
      invalidateLocationCascadeQueries(qc)
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
export const agencyHooks    = useCrudHooks<Agency>('agencies', `${S}/agencies`)
export const shippingModeHooks   = useCrudHooks<ShippingMode>('shipping_modes', `${S}/shipping-modes`)
export const packagingTypeHooks  = useCrudHooks<PackagingType>('packaging_types', `${S}/packaging-types`)
export const transportCompanyHooks = useCrudHooks<TransportCompany>('transport_companies', `${S}/transport-companies`)
export const shipLineHooks       = useCrudHooks<ShipLine>('ship_lines', `${S}/ship-lines`)

/**
 * Ancien nom d’import parfois encore référencé : même donnée que les lignes d’expédition (routes + tarifs).
 * Équivalent à `shipLineHooks.useList()`.
 */
export function useShippingRatesIndex(enabled = true) {
  return shipLineHooks.useList(enabled)
}

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
export const billingExtraHooks = useCrudHooks<BillingExtra>('billing_extras', `${S}/billing-extras`)
export const pricingRuleHooks    = useCrudHooks<PricingRule>('pricing_rules', `${S}/pricing-rules`)
export const zoneHooks           = useCrudHooks<Zone>('zones', `${S}/zones`)
export const paymentMethodHooks  = useCrudHooks<PaymentMethod>('payment_methods', `${S}/payment-methods`)
export const agencyPaymentCoordinateHooks = useCrudHooks<AgencyPaymentCoordinate>('coordinates', `${S}/agency-payment-coordinates`)
export const notificationTemplateHooks = useCrudHooks<NotificationTemplate>('templates', `${S}/notifications`)

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
      invalidateLocationCascadeQueries(qc)
      toast.success('Pays supprime')
    },
  })
}

export function useCreateState() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; country_id: number; code?: string; is_active?: boolean }) =>
      api.post<CreateStateResponse>(`${S}/locations/states`, { is_active: true, ...data }).then((r) => r.data),
    onSuccess: (_d, variables) => {
      invalidateLocationCascadeQueries(qc, { countryId: variables.country_id })
      toast.success('Region creee')
    },
  })
}

export function useDeleteState() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/states/${id}`).then(r => r.data),
    onSuccess: () => {
      invalidateLocationCascadeQueries(qc)
      toast.success('Region supprimee')
    },
  })
}

export function useCreateCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; state_id: number; is_active?: boolean }) =>
      api.post<CreateCityResponse>(`${S}/locations/cities`, { is_active: true, ...data }).then((r) => r.data),
    onSuccess: (_d, variables) => {
      invalidateLocationCascadeQueries(qc, { stateId: variables.state_id })
      toast.success('Ville creee')
    },
  })
}

export function useDeleteCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/cities/${id}`).then(r => r.data),
    onSuccess: () => {
      invalidateLocationCascadeQueries(qc)
      toast.success('Ville supprimee')
    },
  })
}
