/* ── React Query hooks for CRM: Clients, Recipients, Users, Drivers, Notifications ── */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import type { Client, ClientCreatePayload, Recipient, RecipientCreatePayload, User, UserCreatePayload, Driver, DriverCreatePayload, Notification } from '@/types/crm'
import type { PaginatedData } from '@/types'

// ── Clients ──
export function useClients(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<Client>>({
    queryKey: ['clients', params],
    queryFn: () => api.get('/api/clients', { params }).then(r => r.data?.clients ?? r.data),
  })
}

export function useClient(id: number | string | undefined) {
  return useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/api/clients/${id}`).then(r => r.data?.client ?? r.data),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientCreatePayload) =>
      api.post('/api/clients', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client cree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      api.patch(`/api/clients/${id}`, data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clients', vars.id] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useToggleClientActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/clients/${id}/toggle-active`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Statut modifie')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Recipients ──
export function useRecipients(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<Recipient>>({
    queryKey: ['recipients', params],
    queryFn: () => api.get('/api/recipients', { params }).then(r => r.data?.recipients ?? r.data),
  })
}

export function useCreateRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecipientCreatePayload) =>
      api.post('/api/recipients', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipients'] })
      toast.success('Destinataire cree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdateRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Recipient> }) =>
      api.patch(`/api/recipients/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipients'] })
      toast.success('Destinataire mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useDeleteRecipient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/recipients/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipients'] })
      toast.success('Destinataire supprime')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useAddRecipientAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recipientId, data }: { recipientId: number; data: Record<string, any> }) =>
      api.post(`/api/recipients/${recipientId}/addresses`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipients'] })
      toast.success('Adresse ajoutee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useDeleteRecipientAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (addressId: number) =>
      api.delete(`/api/recipient-addresses/${addressId}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipients'] })
      toast.success('Adresse supprimee')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Users ──
export function useUsers(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<User>>({
    queryKey: ['users', params],
    queryFn: () => api.get('/api/users', { params }).then(r => r.data?.users ?? r.data),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserCreatePayload) =>
      api.post('/api/users', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur cree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      api.patch(`/api/users/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useToggleUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/users/${id}/toggle-active`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Statut modifie')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Drivers ──
export function useDrivers(params: Record<string, any> = {}) {
  return useQuery<PaginatedData<Driver>>({
    queryKey: ['drivers', params],
    queryFn: () => api.get('/api/drivers', { params }).then(r => r.data?.drivers ?? r.data),
  })
}

/** Liste chauffeurs pour assignation (sans permission manage_drivers). */
export function useAssignableDrivers() {
  return useQuery<Pick<Driver, 'id' | 'name' | 'email'>[]>({
    queryKey: ['drivers', 'assignable'],
    queryFn: () =>
      api.get('/api/shipments/assignable-drivers').then((r) => r.data?.drivers ?? []),
    staleTime: 60_000,
  })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DriverCreatePayload) =>
      api.post('/api/drivers', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      qc.invalidateQueries({ queryKey: ['drivers', 'assignable'] })
      toast.success('Chauffeur cree')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Driver> }) =>
      api.patch(`/api/drivers/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      qc.invalidateQueries({ queryKey: ['drivers', 'assignable'] })
      toast.success('Chauffeur mis a jour')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

export function useToggleDriverActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/drivers/${id}/toggle-active`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      qc.invalidateQueries({ queryKey: ['drivers', 'assignable'] })
      toast.success('Statut modifie')
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  })
}

// ── Notifications ──
export function useNotifications(params: Record<string, any> = {}) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', params],
    queryFn: () => api.get('/api/notifications', { params }).then(r => r.data?.notifications ?? r.data),
  })
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/api/notifications/unread-count').then(r => r.data?.count ?? 0),
    refetchInterval: 30000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/notifications/${id}/read`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/notifications/read-all').then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Toutes les notifications marquees comme lues')
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/notifications/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
