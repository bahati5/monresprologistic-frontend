/* ── React Query hooks for Shipments API ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import type { Shipment, ShipmentCreatePayload, ShipmentListFilters } from '@/types/shipment'
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
    queryFn: () => api.get(`/api/shipments/${id}`).then(r => r.data?.shipment ?? r.data),
    enabled: !!id,
  })
}

export function useCreateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShipmentCreatePayload) =>
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
    mutationFn: (payload: Partial<ShipmentCreatePayload>) =>
      api.post('/api/shipments/preview-quote', payload).then(r => r.data),
  })
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status_id, note }: { id: number; status_id: number; note?: string }) =>
      api.post(`/api/shipments/${id}/update-status`, { status_id, note }).then(r => r.data),
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
    mutationFn: ({ id, ...data }: { id: number; amount: number; method: string; reference?: string; note?: string }) =>
      api.post(`/api/shipments/${id}/record-payment`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      toast.success('Paiement enregistre')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useShipmentAcceptance(id: number | string | undefined) {
  return useQuery({
    queryKey: ['shipments', id, 'acceptance'],
    queryFn: () => api.get(`/api/shipments/${id}/acceptance`).then(r => r.data),
    enabled: !!id,
  })
}

// ── Wizard helpers ──
export function useSearchClients(search: string) {
  return useQuery({
    queryKey: ['wizard', 'clients', search],
    queryFn: () => api.get('/api/shipment-wizard/search-clients', { params: { search } }).then(r => r.data),
    enabled: search.length >= 2,
  })
}

export function useSearchRecipients(search: string, clientId?: number) {
  return useQuery({
    queryKey: ['wizard', 'recipients', search, clientId],
    queryFn: () => api.get('/api/shipment-wizard/search-recipients', { params: { search, client_id: clientId } }).then(r => r.data),
    enabled: search.length >= 2,
  })
}

export function useWizardAgencies() {
  return useQuery({
    queryKey: ['wizard', 'agencies'],
    queryFn: () => api.get('/api/shipment-wizard/agencies').then(r => r.data),
  })
}

export function useQuickCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; email: string; phone?: string }) =>
      api.post('/api/shipment-wizard/quick-create-client', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wizard', 'clients'] }),
  })
}

export function useQuickCreateRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; phone?: string; email?: string; client_id?: number }) =>
      api.post('/api/shipment-wizard/quick-create-recipient', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wizard', 'recipients'] }),
  })
}
