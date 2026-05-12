import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type {
  QuoteFollowUpSettings,
  QuoteDashboardMetrics,
  QuoteDashboardRow,
} from '@/types/assistedPurchase'

export function useQuoteFollowUpSettings() {
  return useQuery<QuoteFollowUpSettings>({
    queryKey: ['settings', 'quote_followup'],
    queryFn: async () => {
      const res = await api.get('/api/settings/quote-follow-up')
      const data = res.data?.settings ?? res.data
      return {
        quote_validity_days: data?.validity_days ?? data?.quote_validity_days ?? 7,
        reminder_1_delay_days: data?.reminder_1_delay_days ?? 2,
        reminder_2_delay_days: data?.reminder_2_delay_days ?? 5,
        auto_reminders_enabled: data?.auto_reminders_enabled ?? true,
      }
    },
  })
}

export function useUpdateQuoteFollowUpSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: QuoteFollowUpSettings) =>
      api
        .put('/api/settings/quote-follow-up', {
          validity_days: payload.quote_validity_days,
          reminder_1_delay_days: payload.reminder_1_delay_days,
          reminder_2_delay_days: payload.reminder_2_delay_days,
          auto_reminders_enabled: payload.auto_reminders_enabled,
        })
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['settings', 'quote_followup'] })
      toast.success('Paramètres de relance mis à jour')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de sauvegarder')),
  })
}

export function useQuoteDashboardMetrics() {
  return useQuery<QuoteDashboardMetrics>({
    queryKey: ['quotes', 'dashboard', 'metrics'],
    queryFn: () =>
      api.get('/api/assisted-purchases/dashboard/metrics').then((r) => r.data),
    refetchInterval: 60_000,
  })
}

export function useQuoteDashboardList(filter: string) {
  return useQuery<QuoteDashboardRow[]>({
    queryKey: ['quotes', 'dashboard', 'list', filter],
    queryFn: () =>
      api.get('/api/assisted-purchases/dashboard', { params: { filter } }).then((r) => {
        const data = r.data
        if (Array.isArray(data)) return data
        if (Array.isArray(data?.data)) return data.data
        if (Array.isArray(data?.quotes)) return data.quotes
        return []
      }),
    refetchInterval: 60_000,
  })
}

export function useProlongQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) =>
      api.post(`/api/assisted-purchases/${id}/prolong`, { days }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['quotes', 'dashboard'] })
      void qc.invalidateQueries({ queryKey: ['assisted-purchase', String(id)] })
      void qc.invalidateQueries({ queryKey: ['purchases'] })
      toast.success('Devis prolongé')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de prolonger le devis')),
  })
}

export function useCancelReminders() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/assisted-purchases/${id}/cancel-reminders`).then((r) => r.data),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: ['quotes', 'dashboard'] })
      void qc.invalidateQueries({ queryKey: ['assisted-purchase', String(id)] })
      toast.success('Relances annulées')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible d\'annuler les relances')),
  })
}

export function useMarkQuoteAccepted() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      api.post(`/api/assisted-purchases/${id}/accept`, { note }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['quotes', 'dashboard'] })
      void qc.invalidateQueries({ queryKey: ['assisted-purchase', String(id)] })
      void qc.invalidateQueries({ queryKey: ['purchases'] })
      toast.success('Devis marqué comme accepté')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible d\'accepter le devis')),
  })
}

export function useMarkQuoteRefused() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason, note }: { id: number; reason: string; note?: string }) =>
      api.post(`/api/assisted-purchases/${id}/refuse`, { reason, note }).then((r) => r.data),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ['quotes', 'dashboard'] })
      void qc.invalidateQueries({ queryKey: ['assisted-purchase', String(id)] })
      void qc.invalidateQueries({ queryKey: ['purchases'] })
      toast.success('Devis marqué comme refusé')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de refuser le devis')),
  })
}

export function useAssistedPurchaseAnalytics(from: string, to: string) {
  return useQuery({
    queryKey: ['analytics', 'assisted-purchase', from, to],
    queryFn: () =>
      api.get('/api/analytics/assisted-purchase', { params: { from, to } }).then((r) => r.data),
    enabled: !!from && !!to,
  })
}
