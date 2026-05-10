import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

export function useCreateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/api/shipments', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Expédition créée')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err, 'Erreur lors de la création')),
  })
}

export function useUpdateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Record<string, unknown> }) =>
      api.patch(`/api/shipments/${id}`, payload).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', String(vars.id)] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Expédition mise à jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour')),
  })
}

export function useDuplicateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sourceId: number) =>
      api
        .post(`/api/shipments/${sourceId}/duplicate`)
        .then((r) => r.data as { id: number; public_tracking?: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] })
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err, 'Erreur lors de la duplication')),
  })
}

export function usePreviewQuoteMutation() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/api/shipments/preview-quote', payload).then((r) => r.data),
  })
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      api.post(`/api/shipments/${id}/update-status`, { status, notes }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Statut mis a jour')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useAssignDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, driver_id }: { id: number; driver_id: number }) =>
      api.post(`/api/shipments/${id}/assign-driver`, { driver_id }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      toast.success('Chauffeur assigne')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useAcceptShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; driver_id?: number; notes?: string }) =>
      api.post(`/api/shipments/${id}/accept`, data).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Expedition acceptee')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useDeliverShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; delivery_notes?: string; signature?: File }) => {
      const fd = new FormData()
      if (data.delivery_notes) fd.append('delivery_notes', data.delivery_notes)
      if (data.signature) fd.append('signature', data.signature)
      return api.post(`/api/shipments/${id}/deliver`, fd).then((r) => r.data)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Livraison enregistree')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useArchiveSignedForm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData()
      fd.append('signed_form', file)
      return api.post(`/api/shipments/${id}/archive-signed-form`, fd).then((r) => r.data)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      qc.invalidateQueries({ queryKey: ['shipments'] })
      toast.success('Formulaire signe archive')
    },
    onError: (err: Error) =>
      toast.error(getApiErrorMessage(err, "Erreur lors de l'archivage du formulaire")),
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      amount,
      method,
      reference,
      note,
    }: {
      id: number
      amount: number
      method: string
      reference?: string
      note?: string
    }) =>
      api
        .post(`/api/shipments/${id}/record-payment`, {
          amount,
          payment_method: method,
          reference: reference || undefined,
          notes: note || undefined,
        })
        .then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments', vars.id] })
      toast.success('Paiement enregistre')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}
