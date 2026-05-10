import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { mapAppSettingsFromApi, mapAppSettingsToApi } from '@/lib/appSettingsMap'
import type { AppSettings } from '@/types/settings'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const S = '/api/settings'

export function useAppSettings() {
  return useQuery<AppSettings>({
    queryKey: ['settings', 'app'],
    queryFn: () => api.get(`${S}/app`).then((r) => mapAppSettingsFromApi(r.data)),
  })
}

export function useUpdateAppSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`${S}/app`, mapAppSettingsToApi(data)).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
      toast.success('Parametres enregistres')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useUpdateAppSettingsPartial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.put(`${S}/app`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useSettingsHub() {
  return useQuery({
    queryKey: ['settings', 'hub'],
    queryFn: () => api.get(`${S}`).then((r) => r.data),
  })
}
