import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'

export type CascadeCountry = {
  id: number
  name: string
  code?: string | null
  iso2?: string | null
  emoji?: string | null
}
export type CascadeState = { id: number; name: string; code?: string | null; country_id: number }
export type CascadeCity = { id: number; name: string; state_id: number }

export function useLocationCountries() {
  return useQuery<CascadeCountry[]>({
    queryKey: ['locations', 'countries'],
    queryFn: () => api.get('/api/locations/countries').then((r) => r.data),
  })
}

export function useLocationStates(countryId: number | undefined) {
  return useQuery<CascadeState[]>({
    queryKey: ['locations', 'states', countryId],
    queryFn: () => api.get(`/api/locations/countries/${countryId}/states`).then((r) => r.data),
    enabled: !!countryId && countryId > 0,
  })
}

export function useLocationCities(stateId: number | undefined) {
  return useQuery<CascadeCity[]>({
    queryKey: ['locations', 'cities', stateId],
    queryFn: () => api.get(`/api/locations/states/${stateId}/cities`).then((r) => r.data),
    enabled: !!stateId && stateId > 0,
  })
}
