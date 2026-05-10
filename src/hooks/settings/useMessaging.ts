import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type { SmtpConfig, TwilioConfig } from '@/types/settings'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

const S = '/api/settings'

function encFromApi(v: string | undefined): SmtpConfig['encryption'] {
  const s = String(v ?? 'tls').toLowerCase()
  return s === 'ssl' || s === 'none' ? s : 'tls'
}

export function mapSmtpConfigFromApi(body: { settings?: Record<string, string> }): SmtpConfig {
  const o = body.settings ?? (body as Record<string, string>)
  const portRaw = o.smtp_port
  const port = portRaw != null && String(portRaw) !== '' ? Number(portRaw) : 587

  return {
    host: String(o.smtp_host ?? ''),
    port: Number.isFinite(port) ? port : 587,
    encryption: encFromApi(o.smtp_security),
    username: String(o.smtp_user ?? ''),
    password: String(o.smtp_password ?? ''),
    from_email: String(o.smtp_from_email ?? ''),
    from_name: String(o.smtp_from_name ?? ''),
  }
}

export function mapSmtpConfigToApi(form: SmtpConfig): Record<string, string> {
  return {
    smtp_host: form.host,
    smtp_port: String(form.port),
    smtp_security: form.encryption,
    smtp_user: form.username,
    smtp_password: form.password,
    smtp_from_email: form.from_email,
    smtp_from_name: form.from_name,
  }
}

export function mapTwilioConfigFromApi(body: { settings?: Record<string, string> }): TwilioConfig {
  const o = body.settings ?? (body as Record<string, string>)
  const on = (v: string | undefined) => {
    const s = String(v ?? '').toLowerCase()
    return s === '1' || s === 'true' || s === 'yes' || s === 'on'
  }

  return {
    account_sid: String(o.twilio_sid ?? ''),
    auth_token: String(o.twilio_token ?? ''),
    from_number: String(o.twilio_number ?? ''),
    is_active: on(o.twilio_enabled),
    whatsapp_number: String(o.whatsapp_number ?? ''),
    whatsapp_active: on(o.whatsapp_enabled),
  }
}

export function mapTwilioConfigToApi(form: TwilioConfig): Record<string, string | boolean> {
  return {
    twilio_sid: form.account_sid,
    twilio_token: form.auth_token,
    twilio_number: form.from_number,
    twilio_enabled: form.is_active ? '1' : '0',
    whatsapp_number: form.whatsapp_number,
    whatsapp_enabled: form.whatsapp_active ? '1' : '0',
  }
}

export function useSmtpConfig() {
  return useQuery<SmtpConfig>({
    queryKey: ['settings', 'smtp'],
    queryFn: () => api.get(`${S}/smtp-config`).then((r) => mapSmtpConfigFromApi(r.data)),
  })
}

export function useUpdateSmtpConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SmtpConfig) => {
      const payload = mapSmtpConfigToApi(data)
      if (payload.smtp_password === '') {
        delete payload.smtp_password
      }
      return api.put(`${S}/smtp-config`, payload).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'smtp'] })
      toast.success('Configuration SMTP enregistree')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useTestSmtpConfig() {
  return useMutation({
    mutationFn: (to: string) =>
      api.post<{ message: string }>(`${S}/smtp-config/test`, { to }).then((r) => r.data),
    onSuccess: (d) => toast.success(d.message),
    onError: (err: Error) => toast.error(getApiErrorMessage(err, 'Echec du test SMTP')),
  })
}

export function useTwilioConfig() {
  return useQuery<TwilioConfig>({
    queryKey: ['settings', 'twilio'],
    queryFn: () => api.get(`${S}/twilio-config`).then((r) => mapTwilioConfigFromApi(r.data)),
  })
}

export function useUpdateTwilioConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TwilioConfig) => {
      const payload = mapTwilioConfigToApi(data)
      if (payload.twilio_token === '') {
        delete payload.twilio_token
      }
      return api.put(`${S}/twilio-config`, payload).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'twilio'] })
      toast.success('Configuration Twilio enregistree')
    },
    onError: (err: Error) => toast.error(getApiErrorMessage(err)),
  })
}

export function useTestTwilioConfig() {
  return useMutation({
    mutationFn: (payload: { to?: string; channel?: 'sms' | 'whatsapp' }) =>
      api
        .post<{ message: string; account_status?: string; sid?: string }>(
          `${S}/twilio-config/test`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: (d) => toast.success(d.message),
    onError: (err: Error) => toast.error(getApiErrorMessage(err, 'Echec du test Twilio')),
  })
}
