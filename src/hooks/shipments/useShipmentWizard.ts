import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

export interface ProfileSearchResult {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  country_id?: number | null
  has_account: boolean
  locker_number: string | null
  is_related: boolean
}

export function useSearchProfiles(search: string, excludeId?: number, relatedTo?: number) {
  const q = search.trim()
  return useQuery<ProfileSearchResult[]>({
    queryKey: ['wizard', 'profiles', q, excludeId, relatedTo],
    queryFn: () =>
      api
        .get('/api/shipment-wizard/search-profiles', {
          params: {
            q,
            exclude_id: excludeId || undefined,
            related_to: relatedTo || undefined,
          },
        })
        .then((r) => r.data),
    enabled: q.length >= 2,
  })
}

export function useSearchClients(search: string) {
  const q = search.trim()
  return useQuery({
    queryKey: ['wizard', 'clients', q],
    queryFn: () =>
      api.get('/api/shipment-wizard/search-clients', { params: { q } }).then((r) => r.data),
    enabled: q.length >= 2,
  })
}

export function useSearchRecipients(search: string, clientId?: number) {
  const q = search.trim()
  return useQuery({
    queryKey: ['wizard', 'recipients', q, clientId],
    queryFn: () =>
      api
        .get('/api/shipment-wizard/search-recipients', { params: { q, client_id: clientId } })
        .then((r) => r.data),
    enabled: q.length >= 2 && clientId != null && clientId > 0,
  })
}

export function useWizardAgencies() {
  return useQuery({
    queryKey: ['wizard', 'agencies'],
    queryFn: () => api.get('/api/shipment-wizard/agencies').then((r) => r.data),
  })
}

export function useWizardCreateRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/shipment-wizard/quick-create-recipient', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wizard', 'recipients'] })
      qc.invalidateQueries({ queryKey: ['wizard', 'profiles'] })
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}
