import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiError'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────

export type FormDraftType =
  | 'shipment'
  | 'pre_alert'
  | 'assisted_purchase'
  | 'quote'
  | 'refund_request'
  | 'pickup'

export interface FormDraft {
  id: number
  form_type: FormDraftType
  form_type_label: string
  payload: Record<string, unknown>
  metadata: Record<string, unknown> | null
  last_saved_at: string
  expires_at: string
  created_at: string
}

interface AutoSaveOptions {
  interval?: number
  metadata?: Record<string, unknown>
  enabled?: boolean
}

// ─── Query hooks ─────────────────────────────────

export function useDrafts(formType?: FormDraftType) {
  return useQuery<FormDraft[]>({
    queryKey: ['drafts', formType],
    queryFn: () =>
      api
        .get('/api/drafts', { params: formType ? { form_type: formType } : {} })
        .then((r) => r.data?.data ?? []),
  })
}

export function useAllDrafts() {
  return useQuery<FormDraft[]>({
    queryKey: ['drafts'],
    queryFn: () => api.get('/api/drafts').then((r) => r.data?.data ?? []),
  })
}

export function useDraft(id: number | undefined) {
  return useQuery<FormDraft>({
    queryKey: ['drafts', id],
    queryFn: () => api.get(`/api/drafts/${id}`).then((r) => r.data?.data),
    enabled: !!id,
  })
}

// ─── Mutation hooks ──────────────────────────────

export function useCreateDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      form_type: FormDraftType
      payload: Record<string, unknown>
      metadata?: Record<string, unknown>
    }) => api.post('/api/drafts', data).then((r) => r.data?.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] })
    },
    onError: (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'Erreur de sauvegarde du brouillon')),
  })
}

export function useUpdateDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
      metadata,
    }: {
      id: number
      payload?: Record<string, unknown>
      metadata?: Record<string, unknown>
    }) => api.patch(`/api/drafts/${id}`, { payload, metadata }).then((r) => r.data?.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}

export function useDeleteDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/drafts/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drafts'] })
    },
  })
}

// ─── Check existing draft ────────────────────────

export function useCheckExistingDraft(formType: FormDraftType, enabled = true) {
  return useQuery<FormDraft | null>({
    queryKey: ['drafts', 'check', formType],
    queryFn: async () => {
      const res = await api.get('/api/drafts', {
        params: { form_type: formType },
      })
      const drafts: FormDraft[] = res.data?.data ?? []
      return drafts.length > 0 ? drafts[0] : null
    },
    enabled,
    staleTime: 0,
  })
}

// ─── Auto-save hook ──────────────────────────────

export function useDraftAutoSave(
  formType: FormDraftType,
  formData: Record<string, unknown> | null,
  options: AutoSaveOptions = {},
) {
  const { interval = 30_000, metadata, enabled = true } = options

  const [draftId, setDraftId] = useState<number | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const lastSavedPayloadRef = useRef<string | null>(null)
  const formDataRef = useRef(formData)
  const metadataRef = useRef(metadata)
  formDataRef.current = formData
  metadataRef.current = metadata

  const createDraft = useCreateDraft()
  const updateDraft = useUpdateDraft()

  const saveDraft = useCallback(async () => {
    const data = formDataRef.current
    if (!data || !enabled) return

    const serialized = JSON.stringify(data)
    if (lastSavedPayloadRef.current && serialized === lastSavedPayloadRef.current) return

    setIsSaving(true)
    try {
      if (draftId) {
        const result = await updateDraft.mutateAsync({
          id: draftId,
          payload: data,
          metadata: metadataRef.current,
        })
        setLastSavedAt(result?.last_saved_at ?? new Date().toISOString())
      } else {
        const result = await createDraft.mutateAsync({
          form_type: formType,
          payload: data,
          metadata: metadataRef.current,
        })
        if (result?.id) {
          setDraftId(result.id)
          setLastSavedAt(result.last_saved_at ?? new Date().toISOString())
        }
      }
      lastSavedPayloadRef.current = serialized
    } catch {
      // silently fail for autosave
    } finally {
      setIsSaving(false)
    }
  }, [draftId, formType, enabled, createDraft, updateDraft])

  // Auto-save on interval
  useEffect(() => {
    if (!enabled || !formData) return

    const timer = setInterval(saveDraft, interval)
    return () => clearInterval(timer)
  }, [enabled, formData, interval, saveDraft])

  const loadDraft = useCallback(
    (draft: FormDraft) => {
      setDraftId(draft.id)
      setLastSavedAt(draft.last_saved_at)
      lastSavedPayloadRef.current = JSON.stringify(draft.payload)
    },
    [],
  )

  const discardDraft = useCallback(async () => {
    if (draftId) {
      try {
        await api.delete(`/api/drafts/${draftId}`)
      } catch {
        // ignore
      }
    }
    setDraftId(null)
    setLastSavedAt(null)
    lastSavedPayloadRef.current = null
  }, [draftId])

  const clearAfterSubmit = useCallback(async () => {
    if (draftId) {
      try {
        await api.delete(`/api/drafts/${draftId}`)
      } catch {
        // ignore
      }
    }
    setDraftId(null)
    setLastSavedAt(null)
    lastSavedPayloadRef.current = null
  }, [draftId])

  return {
    draftId,
    lastSavedAt,
    isSaving,
    saveDraftManually: saveDraft,
    loadDraft,
    discardDraft,
    clearAfterSubmit,
  }
}
