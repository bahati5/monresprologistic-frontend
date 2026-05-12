import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from 'sonner'
import type { SavTicketListResponse, SavTicket, SavTicketMessage, SavQuickReply, SavAnalytics } from '@/types/sav'

export function useSavTickets(params: Record<string, unknown> = {}) {
  return useQuery<SavTicketListResponse>({
    queryKey: ['sav', 'tickets', params],
    queryFn: () => api.get('/api/sav/tickets', { params }).then(r => r.data),
  })
}

export function useSavTicket(uuid: string) {
  return useQuery<{ ticket: SavTicket }>({
    queryKey: ['sav', 'ticket', uuid],
    queryFn: () => api.get(`/api/sav/tickets/${uuid}`).then(r => r.data),
    enabled: !!uuid,
  })
}

export function useCreateSavTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/api/sav/tickets', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sav', 'tickets'] })
      toast.success('Ticket SAV créé')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateSavTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, ...payload }: Record<string, unknown> & { uuid: string }) =>
      api.patch(`/api/sav/tickets/${uuid}`, payload).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sav', 'tickets'] })
      qc.invalidateQueries({ queryKey: ['sav', 'ticket', vars.uuid] })
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  })
}

export function useAssignSavTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, user_id }: { uuid: string; user_id?: number }) =>
      api.post(`/api/sav/tickets/${uuid}/assign`, { user_id }).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sav', 'tickets'] })
      qc.invalidateQueries({ queryKey: ['sav', 'ticket', vars.uuid] })
      toast.success('Ticket assigné')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateSavTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, status }: { uuid: string; status: string }) =>
      api.post(`/api/sav/tickets/${uuid}/status`, { status }).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sav', 'tickets'] })
      qc.invalidateQueries({ queryKey: ['sav', 'ticket', vars.uuid] })
      toast.success('Statut mis à jour')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  })
}

export function useReplySavTicket() {
  const qc = useQueryClient()
  return useMutation<{ message: SavTicketMessage }, unknown, { uuid: string; body: string; is_internal?: boolean }>({
    mutationFn: ({ uuid, ...payload }) =>
      api.post(`/api/sav/tickets/${uuid}/reply`, payload).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sav', 'ticket', vars.uuid] })
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  })
}

export function useSavQuickReplies() {
  return useQuery<{ quick_replies: SavQuickReply[] }>({
    queryKey: ['sav', 'quick-replies'],
    queryFn: () => api.get('/api/sav/quick-replies').then(r => r.data),
  })
}

export function useSavAnalytics(params: Record<string, unknown> = {}) {
  return useQuery<SavAnalytics>({
    queryKey: ['analytics', 'sav', params],
    queryFn: () => api.get('/api/analytics/sav', { params }).then(r => r.data),
  })
}

export function useShipmentAnalytics(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['analytics', 'shipments', params],
    queryFn: () => api.get('/api/analytics/shipments', { params }).then(r => r.data),
  })
}

export function useFinanceAnalytics(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['analytics', 'finance', params],
    queryFn: () => api.get('/api/analytics/finance', { params }).then(r => r.data),
  })
}
