import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type { QuoteCurrencySettings } from '@/types/assistedPurchase'

const QUERY_KEY = ['settings', 'quote_currency']

const DEFAULTS: QuoteCurrencySettings = {
  primary_currency: '',
  secondary_currency_enabled: false,
  secondary_currency: '',
  secondary_currency_rate_mode: 'manual',
  secondary_currency_rate: 0,
  secondary_currency_rate_updated_at: null,
}

export function useQuoteCurrencySettings() {
  return useQuery<QuoteCurrencySettings>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/api/settings/quote-currency')
      const data = res.data?.settings ?? res.data
      return { ...DEFAULTS, ...data }
    },
  })
}

export function useUpdateQuoteCurrencySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<QuoteCurrencySettings>) =>
      api.put('/api/settings/quote-currency', payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Configuration des devises mise à jour')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de sauvegarder')),
  })
}
