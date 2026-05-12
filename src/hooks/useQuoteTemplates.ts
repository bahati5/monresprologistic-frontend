import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type { QuoteTemplate, QuoteTemplateFormData } from '@/types/assistedPurchase'

const BASE_PATH = '/api/quote-templates'
const QUERY_KEY = ['settings', 'quote_templates']

export function useQuoteTemplates(enabled = true) {
  return useQuery<QuoteTemplate[]>({
    queryKey: QUERY_KEY,
    queryFn: () =>
      api.get(BASE_PATH).then((r) => {
        const data = r.data
        if (Array.isArray(data)) return data
        if (data && typeof data === 'object') {
          if (Array.isArray(data.data)) return data.data
          if (Array.isArray(data.templates)) return data.templates
          if (Array.isArray(data.quote_templates)) return data.quote_templates
        }
        return []
      }),
    enabled,
  })
}

export function useCreateQuoteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: QuoteTemplateFormData) =>
      api.post(BASE_PATH, payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Template de devis créé')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de créer le template')),
  })
}

export function useUpdateQuoteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<QuoteTemplateFormData> }) =>
      api.put(`${BASE_PATH}/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Template de devis mis à jour')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de modifier le template')),
  })
}

export function useDeleteQuoteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE_PATH}/${id}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Template de devis supprimé')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de supprimer le template')),
  })
}
