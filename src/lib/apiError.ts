import { AxiosError } from 'axios'

export function getApiErrorMessage(err: unknown, fallback = 'Erreur'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as Record<string, unknown> | undefined
    const msg = data?.message ?? data?.error
    if (typeof msg === 'string' && msg) return msg
    return err.message || fallback
  }
  if (err instanceof Error) return err.message || fallback
  return fallback
}
