import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const S = '/api/settings'

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

export type PhoneCountryApiRow = {
  id: number
  name: string
  iso2?: string | null
  phonecode: string
  emoji?: string | null
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

export function usePhoneCountries() {
  return useQuery<PhoneCountryApiRow[]>({
    queryKey: ['locations', 'phone-countries'],
    queryFn: () =>
      api
        .get<PhoneCountryApiRow[]>('/api/locations/phone-countries')
        .then((r) => (Array.isArray(r.data) ? r.data : [])),
    staleTime: 60 * 60 * 1000,
  })
}

export function useLocations() {
  return useQuery({
    queryKey: ['settings', 'locations'],
    queryFn: () => api.get(`${S}/locations`).then((r) => r.data),
  })
}

export function useCreateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      code: string
      iso2?: string
      emoji?: string
      is_active?: boolean
    }) =>
      api
        .post<CreateCountryResponse>('/api/settings/locations/countries', {
          is_active: true,
          ...payload,
        })
        .then((r) => r.data),
    onSuccess: () => {
      invalidateLocationCascadeQueries(qc)
      toast.success('Pays ajoute')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeleteCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/countries/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateLocationCascadeQueries(qc)
      toast.success('Pays supprime')
    },
  })
}

export function useCreateState() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      country_id: number
      code?: string
      is_active?: boolean
    }) =>
      api
        .post<CreateStateResponse>(`${S}/locations/states`, { is_active: true, ...data })
        .then((r) => r.data),
    onSuccess: (_d, variables) => {
      invalidateLocationCascadeQueries(qc, { countryId: variables.country_id })
      toast.success('Region creee')
    },
  })
}

export function useDeleteState() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/states/${id}`).then((r) => r.data),
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
      api
        .post<CreateCityResponse>(`${S}/locations/cities`, { is_active: true, ...data })
        .then((r) => r.data),
    onSuccess: (_d, variables) => {
      invalidateLocationCascadeQueries(qc, { stateId: variables.state_id })
      toast.success('Ville creee')
    },
  })
}

export function useDeleteCity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${S}/locations/cities/${id}`).then((r) => r.data),
    onSuccess: () => {
      invalidateLocationCascadeQueries(qc)
      toast.success('Ville supprimee')
    },
  })
}
