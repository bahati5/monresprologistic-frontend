import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'

export function useRefundWorkflowMutations(
  detailId: number | null,
  setRejectId: (id: number | null) => void,
) {
  const qc = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/refunds/${id}/approve`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['refunds'] })
      void qc.invalidateQueries({ queryKey: ['refund', detailId] })
      toast.success('Remboursement approuvé')
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Erreur'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejection_reason }: { id: number; rejection_reason: string }) =>
      api.post(`/api/refunds/${id}/reject`, { rejection_reason }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['refunds'] })
      void qc.invalidateQueries({ queryKey: ['refund', detailId] })
      toast.success('Remboursement rejeté')
      setRejectId(null)
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Erreur'),
  })

  const processMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/refunds/${id}/process`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['refunds'] })
      void qc.invalidateQueries({ queryKey: ['refund', detailId] })
      toast.success('Remboursement traité')
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Erreur'),
  })

  const completeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/refunds/${id}/complete`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['refunds'] })
      void qc.invalidateQueries({ queryKey: ['refund', detailId] })
      toast.success('Remboursement terminé')
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Erreur'),
  })

  return { approveMutation, rejectMutation, processMutation, completeMutation }
}
