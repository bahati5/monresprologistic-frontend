import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import type { Shipment, ShipmentListFilters } from '@/types/shipment'
import type { PaginatedData } from '@/types'

export function useShipments(filters: ShipmentListFilters = {}) {
  return useQuery<PaginatedData<Shipment>>({
    queryKey: ['shipments', filters],
    queryFn: () =>
      api.get('/api/shipments', { params: filters }).then((r) => r.data?.shipments ?? r.data),
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

export function useShipmentCreateOptions() {
  return useQuery({
    queryKey: ['shipments', 'create-options'],
    queryFn: () => api.get('/api/shipments/create').then((r) => r.data),
  })
}

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

export function usePreviewQuote() {
  return useQuery({
    queryKey: ['shipments', 'preview-quote'],
    queryFn: () => api.post('/api/shipments/preview-quote').then((r) => r.data),
    enabled: false,
  })
}
