import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import type { QuoteLineTemplate, QuoteLineTemplateFormData } from '@/types/assistedPurchase'

const BASE_PATH = '/api/quote-line-templates'
const QUERY_KEY = ['settings', 'quote_line_templates']

export function useQuoteLineTemplates(enabled = true) {
  return useQuery<QuoteLineTemplate[]>({
    queryKey: QUERY_KEY,
    queryFn: () =>
      api.get(BASE_PATH).then((r) => {
        const data = r.data
        if (Array.isArray(data)) return data
        if (data && typeof data === 'object') {
          if (Array.isArray(data.data)) return data.data
          if (Array.isArray(data.templates)) return data.templates
          if (Array.isArray(data.quote_line_templates)) return data.quote_line_templates
        }
        return []
      }),
    enabled,
  })
}

export function useActiveQuoteLineTemplates() {
  const query = useQuoteLineTemplates()
  const active = (query.data ?? []).filter((t) => t.is_active)
  return { ...query, data: active }
}

export function useCreateQuoteLineTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: QuoteLineTemplateFormData) =>
      api.post(BASE_PATH, payload).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Ligne de devis créée')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de créer la ligne')),
  })
}

export function useUpdateQuoteLineTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<QuoteLineTemplateFormData & { display_order: number; is_active: boolean }> }) =>
      api.put(`${BASE_PATH}/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Ligne de devis mise à jour')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de modifier la ligne')),
  })
}

export function useDeleteQuoteLineTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`${BASE_PATH}/${id}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Ligne de devis supprimée')
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de supprimer la ligne')),
  })
}

export function useReorderQuoteLineTemplates() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: number[]) =>
      api
        .post(`${BASE_PATH}/reorder`, {
          order: orderedIds.map((id, display_order) => ({ id, display_order })),
        })
        .then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible de réordonner les lignes')),
  })
}
