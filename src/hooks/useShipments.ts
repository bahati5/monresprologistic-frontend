/* ── React Query hooks for Shipments API ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import type { Shipment, ShipmentListFilters } from '@/types/shipment'
import type { PaginatedData } from '@/types'

export function useShipments(filters: ShipmentListFilters = {}) {
  return useQuery<PaginatedData<Shipment>>({
    queryKey: ['shipments', filters],
    queryFn: () => api.get('/api/shipments', { params: filters }).then(r => r.data?.shipments ?? r.data),
  })
}

export function useShipment(id: number | string | undefined) {
  return useQuery<Shipment>({
    queryKey: ['shipments', id],
    queryFn: () =>
      api.get(`/api/shipments/${id}`).then((r) => {
        const d = r.data
        const ship = (d?.shipment ?? d) as Shipment
        return {
          ...ship,
          workflow_steps: d?.workflow_steps ?? ship.workflow_steps,
          available_transitions: d?.available_transitions ?? ship.available_transitions,
        }
      }),
    enabled: !!id,
  })
}

/** Options assistant (modes, emballages, % défaut facturation, etc.) — GET /api/shipments/create */
export function useShipmentCreateOptions() {
  return useQuery({
    queryKey: ['shipments', 'create-options'],
    queryFn: () => api.get('/api/shipments/create').then((r) => r.data),
  })
}

/** Lignes d'expédition actives couvrant origine + destination (wizard). */
export function useShipLinesForRoute(originId: string, destId: string) {
  return useQuery({
    queryKey: ['shipment-wizard', 'ship-lines-route', originId, destId],
    queryFn: () =>
      api
        .get('/api/shipment-wizard/ship-lines-for-route', {
          params: { origin_country_id: originId, dest_country_id: destId },
        })
        .then((r) => r.data),
    enabled: Boolean(originId && destId),
  })
}

export function useCreateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/api/shipments', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Expedition creee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur lors de la creation'),
  })
}

export function usePreviewQuote() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/api/shipments/preview-quote', payload).then(r => r.data),
  })
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      api.post(`/api/shipments/${id}/update-status`, { status, notes }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Statut mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useAssignDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, driver_id }: { id: number; driver_id: number }) =>
      api.post(`/api/shipments/${id}/assign-driver`, { driver_id }).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      toast.success('Chauffeur assigne')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useAcceptShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; driver_id?: number; notes?: string }) =>
      api.post(`/api/shipments/${id}/accept`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Expedition acceptee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useDeliverShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; delivery_notes?: string; signature?: File }) => {
      const fd = new FormData()
      if (data.delivery_notes) fd.append('delivery_notes', data.delivery_notes)
      if (data.signature) fd.append('signature', data.signature)
      return api.post(`/api/shipments/${id}/deliver`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Livraison enregistree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount, method, reference, note }: { id: number; amount: number; method: string; reference?: string; note?: string }) =>
      api.post(`/api/shipments/${id}/record-payment`, {
        amount,
        payment_method: method,
        reference: reference || undefined,
        notes: note || undefined,
      }).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      toast.success('Paiement enregistre')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Wizard helpers ──

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
        .then(r => r.data),
    enabled: q.length >= 2,
  })
}

export function useSearchClients(search: string) {
  const q = search.trim()
  return useQuery({
    queryKey: ['wizard', 'clients', q],
    queryFn: () => api.get('/api/shipment-wizard/search-clients', { params: { q } }).then(r => r.data),
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
        .then(r => r.data),
    enabled: q.length >= 2 && clientId != null && clientId > 0,
  })
}

export function useWizardAgencies() {
  return useQuery({
    queryKey: ['wizard', 'agencies'],
    queryFn: () => api.get('/api/shipment-wizard/agencies').then(r => r.data),
  })
}

/** Destinataire wizard : carnet du client expéditeur (`client_profile_id`). */
export function useWizardCreateRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/shipment-wizard/quick-create-recipient', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wizard', 'recipients'] })
      qc.invalidateQueries({ queryKey: ['wizard', 'profiles'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

