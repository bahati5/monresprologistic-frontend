/* ── React Query hooks for Inbound: ShipmentNotices, PurchaseOrders, CustomerPackages ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import type { ShipmentNotice, ShipmentNoticeCreatePayload, PurchaseOrder, PurchaseOrderCreatePayload, CustomerPackage, CustomerPackageCreatePayload } from '@/types/inbound'
import type { PaginatedData } from '@/types'

// ── Shipment Notices ──
export function useShipmentNotices(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<ShipmentNotice>>({
    queryKey: ['shipment-notices', params],
    queryFn: () => api.get('/api/shipment-notices', { params }).then(r => r.data?.shipment_notices ?? r.data),
  })
}

export function useShipmentNotice(id: number | string | undefined) {
  return useQuery<ShipmentNotice>({
    queryKey: ['shipment-notices', id],
    queryFn: () => api.get(`/api/shipment-notices/${id}`).then(r => r.data?.shipment_notice ?? r.data),
    enabled: !!id,
  })
}

export function useCreateShipmentNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShipmentNoticeCreatePayload | FormData) => {
      const isFormData = payload instanceof FormData
      return api.post('/api/shipment-notices', payload, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipment-notices'] })
      toast.success('Colis attendu enregistré')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdateShipmentNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ShipmentNotice> }) =>
      api.put(`/api/shipment-notices/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipment-notices', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipment-notices'] })
      toast.success('Avis mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useDeleteShipmentNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/shipment-notices/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipment-notices'] })
      toast.success('Avis supprime')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useReceiveShipmentNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) =>
      api.post(`/api/shipment-notices/${id}/receive`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipment-notices'] })
      qc.invalidateQueries({ queryKey: ['customer-packages'] })
      toast.success('Colis receptionne')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Purchase Orders ──
export function usePurchaseOrders(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<PurchaseOrder>>({
    queryKey: ['purchase-orders', params],
    queryFn: () => api.get('/api/purchase-orders', { params }).then(r => r.data?.purchase_orders ?? r.data),
  })
}

export function usePurchaseOrder(id: number | string | undefined) {
  return useQuery<PurchaseOrder>({
    queryKey: ['purchase-orders', id],
    queryFn: () => api.get(`/api/purchase-orders/${id}`).then(r => r.data?.purchase_order ?? r.data),
    enabled: !!id,
  })
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PurchaseOrderCreatePayload) =>
      api.post('/api/purchase-orders', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Ordre d\'achat cree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useQuotePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { quote_amount: number; commission_amount: number; shipping_amount: number } }) =>
      api.post(`/api/purchase-orders/${id}/quote`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders', vars.id] })
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Devis envoye')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useMarkPurchaseOrderPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/purchase-orders/${id}/mark-paid`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Ordre marque comme paye')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useMarkPurchaseOrderPurchased() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/purchase-orders/${id}/mark-purchased`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Commande effectuee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useConvertPurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/purchase-orders/${id}/convert`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      qc.invalidateQueries({ queryKey: ['customer-packages'] })
      toast.success('Converti en colis client')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Customer Packages ──
export function useCustomerPackages(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<CustomerPackage>>({
    queryKey: ['customer-packages', params],
    queryFn: () => api.get('/api/customer-packages', { params }).then(r => r.data?.customer_packages ?? r.data),
  })
}

export function useCustomerPackage(id: number | string | undefined) {
  return useQuery<CustomerPackage>({
    queryKey: ['customer-packages', id],
    queryFn: () => api.get(`/api/customer-packages/${id}`).then(r => r.data?.customer_package ?? r.data),
    enabled: !!id,
  })
}

export function useCreateCustomerPackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CustomerPackageCreatePayload) =>
      api.post('/api/customer-packages', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer-packages'] })
      toast.success('Colis client cree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdateCustomerPackageStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      api.post(`/api/customer-packages/${id}/update-status`, { status, notes }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['customer-packages', vars.id] })
      qc.invalidateQueries({ queryKey: ['customer-packages'] })
      toast.success('Statut mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}
