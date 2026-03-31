/* ── React Query hooks for Pickups & Consolidations API ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import type { Pickup, PickupCreatePayload, Consolidation, ConsolidationCreatePayload } from '@/types/operations'
import type { PaginatedData } from '@/types'

// ── Pickups ──
export function usePickups(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<Pickup>>({
    queryKey: ['pickups', params],
    queryFn: () => api.get('/api/pickups', { params }).then(r => r.data?.pickups ?? r.data),
  })
}

export function useCreatePickup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PickupCreatePayload) =>
      api.post('/api/pickups', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickups'] })
      toast.success('Ramassage cree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useAssignPickupDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, driver_id }: { id: number; driver_id: number }) =>
      api.post(`/api/pickups/${id}/assign`, { driver_id }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickups'] })
      toast.success('Chauffeur assigne')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdatePickupStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status_id, note }: { id: number; status_id: number; note?: string }) =>
      api.post(`/api/pickups/${id}/update-status`, { status_id, note }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickups'] })
      toast.success('Statut mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Consolidations ──
export function useConsolidations(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<Consolidation>>({
    queryKey: ['consolidations', params],
    queryFn: () => api.get('/api/consolidations', { params }).then(r => r.data?.consolidations ?? r.data),
  })
}

export function useCreateConsolidation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConsolidationCreatePayload) =>
      api.post('/api/consolidations', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consolidations'] })
      toast.success('Consolidation creee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdateConsolidationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status_id, note }: { id: number; status_id: number; note?: string }) =>
      api.patch(`/api/consolidations/${id}/status`, { status_id, note }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consolidations'] })
      toast.success('Statut mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}
