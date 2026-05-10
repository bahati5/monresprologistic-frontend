/* ── React Query hooks for Pickups & Regroupements API ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from 'sonner'
import type { Pickup, PickupCreatePayload } from '@/types/operations'
import type { PaginatedData } from '@/types'

// ── Pickups ──
export function usePickups(params: Record<string, unknown> = {}) {
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
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useAssignPickupDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, driver_id }: { id: number; driver_id: number }) =>
      api.post(`/api/pickups/${id}/assign`, { assigned_driver_id: driver_id }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickups'] })
      toast.success('Chauffeur assigne')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdatePickupStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      failure_reason,
      completion_notes,
    }: {
      id: number
      status: string
      failure_reason?: string
      completion_notes?: string
    }) =>
      api
        .post(`/api/pickups/${id}/update-status`, {
          status,
          failure_reason: failure_reason || undefined,
          completion_notes: completion_notes || undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickups'] })
      toast.success('Statut mis a jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

/** Réponse GET /api/regroupements (expéditions disponibles + lots récents). */
export interface RegroupementLotShipmentRow {
  id: number
  public_tracking?: string | null
  tracking_number?: string | null
  recipient_name?: string | null
  weight_kg?: number | null
  route_display?: string | null
  corridor?: {
    origin_country?: string | null
    dest_country?: string | null
    origin_iso2?: string | null
    dest_iso2?: string | null
  }
  status?: { code?: string; name?: string; color_hex?: string | null }
}

export interface RegroupementsIndexData {
  availableShipments?: Array<{ id: number; public_tracking?: string | null }>
  regroupements?: Array<{
    id: number
    batch_number: string
    agency_id?: number
    status?: { code: string; name: string; color_hex?: string | null }
    created_at?: string
    updated_at?: string
    shipments?: RegroupementLotShipmentRow[]
    lot_route?: {
      origin_iso2s: string[]
      dest_iso2s: string[]
      origin_countries: string[]
      dest_countries: string[]
      label: string | null
    }
  }>
  regroupementStatuses?: Array<{ code: string; name: string; color_hex?: string | null }>
}

export function useRegroupementsIndex(enabled = true) {
  return useQuery<RegroupementsIndexData>({
    queryKey: ['regroupements', 'index'],
    queryFn: () => api.get('/api/regroupements').then((r) => r.data),
    enabled,
  })
}

export function useCreateRegroupement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { shipment_ids: number[] }) =>
      api.post('/api/regroupements', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regroupements'] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Lot créé')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateRegroupementStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/regroupements/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regroupements'] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Statut mis à jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useRegroupementsPicker(enabled: boolean) {
  return useQuery<RegroupementsIndexData>({
    queryKey: ['regroupements', 'picker'],
    queryFn: () => api.get('/api/regroupements').then((r) => r.data),
    enabled,
  })
}

export function useAttachShipmentToRegroupement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ regroupementId, shipmentId }: { regroupementId: number; shipmentId: number }) =>
      api
        .post(`/api/regroupements/${regroupementId}/shipments`, { shipment_id: shipmentId })
        .then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['regroupements'] })
      qc.invalidateQueries({ queryKey: ['shipments', String(vars.shipmentId)] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Colis ajouté au regroupement')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useAttachShipmentsToRegroupement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ regroupementId, shipmentIds }: { regroupementId: number; shipmentIds: number[] }) =>
      api
        .post(`/api/regroupements/${regroupementId}/attach-shipments`, { shipment_ids: shipmentIds })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regroupements'] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Expéditions ajoutées au regroupement')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}
