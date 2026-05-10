import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { formatMoneyFromBranding } from '@/lib/formatCurrency'
import type { AppSettings, PublicBranding } from '@/types/settings'
import { toast } from 'sonner'

function truthySetting(v: unknown): boolean {
  return v === '1' || v === 1 || v === true || v === 'true'
}

export function mapPublicBranding(raw: Record<string, unknown>): PublicBranding {
  const strOrNull = (v: unknown): string | null => {
    if (v == null || v === '') return null
    const s = String(v).trim()
    return s === '' ? null : s
  }

  const cur = String(raw.currency ?? '').trim()
  const posRaw = String(raw.currency_position ?? raw.symbol_position ?? 'after').toLowerCase()
  const currency_position: 'before' | 'after' =
    posRaw === 'before' || posRaw === 'prefix' ? 'before' : 'after'

  return {
    logo_url: strOrNull(raw.logo_url),
    favicon_url: strOrNull(raw.favicon_url),
    site_name: String(raw.site_name ?? ''),
    hub_brand_name: String(raw.hub_brand_name ?? ''),
    show_sidebar_brand_with_logo: truthySetting(raw.show_sidebar_brand_with_logo ?? '1'),
    currency: cur !== '' ? cur : 'EUR',
    currency_symbol: String(raw.currency_symbol ?? ''),
    currency_position,
  }
}

export function usePublicBranding() {
  return useQuery<PublicBranding>({
    queryKey: ['branding'],
    queryFn: () =>
      api.get<Record<string, unknown>>('/api/branding').then((r) => mapPublicBranding(r.data)),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useFormatMoney() {
  const { data: branding } = usePublicBranding()

  return {
    formatMoney: (amount: number, fractionDigits?: { min?: number; max?: number }) =>
      formatMoneyFromBranding(amount, branding, fractionDigits),
    branding,
  }
}

export function useUploadLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('logo', file)
      return api
        .post<{ message: string; logo_url?: string }>('/api/settings/app/logo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: (data) => {
      if (data?.logo_url) {
        qc.setQueryData(['settings', 'app'], (old: AppSettings | undefined) =>
          old ? { ...old, logo_url: data.logo_url! } : old,
        )
      }
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
      toast.success('Logo mis a jour')
    },
  })
}

export function useUploadFavicon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('favicon', file)
      return api
        .post<{ message: string; favicon_url?: string }>('/api/settings/app/favicon', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: (data) => {
      if (data?.favicon_url) {
        qc.setQueryData(['settings', 'app'], (old: AppSettings | undefined) =>
          old ? { ...old, favicon_url: data.favicon_url! } : old,
        )
      }
      qc.invalidateQueries({ queryKey: ['settings', 'app'] })
      qc.invalidateQueries({ queryKey: ['branding'] })
      toast.success('Favicon mis a jour')
    },
  })
}
