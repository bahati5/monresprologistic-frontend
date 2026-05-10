import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const S = '/api/settings'

export function usePaymentGateways() {
  return useQuery({
    queryKey: ['settings', 'payment-gateways'],
    queryFn: () => api.get(`${S}/payment-gateways`).then((r) => r.data),
  })
}

export function useUpdatePaymentGateways() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`${S}/payment-gateways`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'payment-gateways'] })
      toast.success('Passerelles mises a jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}
