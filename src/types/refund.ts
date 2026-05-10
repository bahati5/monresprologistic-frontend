import api from '@/api/client'

export interface Refund {
  id: number
  reference_code: string
  amount: number
  currency: string
  status: string
  status_label: string
  status_color: string
  reason: string
  rejection_reason?: string
  has_request_proof?: boolean
  client?: { id: number; name: string }
  reviewer?: { id: number; name: string }
  processor?: { id: number; name: string }
  created_at: string
  reviewed_at?: string | null
  processed_at?: string | null
  completed_at?: string | null
}

export type RefundListStatus = { code: string; name: string }

export const REFUND_STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  processed: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
}

export async function downloadRefundRequestProof(refundId: number) {
  const res = await api.get(`/api/refunds/${refundId}/request-proof`, { responseType: 'blob' })
  const disp = res.headers['content-disposition'] as string | undefined
  let filename = 'preuve-demande'
  if (disp) {
    const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disp)
    if (m?.[1]) filename = decodeURIComponent(m[1].replace(/"/g, ''))
  }
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
