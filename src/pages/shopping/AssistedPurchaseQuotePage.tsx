import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from '@/stores/authStore'
import { displayLocalized } from '@/lib/localizedString'
import { Button } from '@/components/ui/button'
import {
  AdminShoppingQuoteView,
  type AdminShoppingQuotePayload,
  type AdminQuoteLine,
  type AssistedQuotePreviewBody,
  type ReadonlyQuoteFinancialDetails,
  type ShoppingQuoteClientDetail,
} from '@/components/shopping/AdminShoppingQuoteView'
import { usePublicBranding } from '@/hooks/useSettings'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

function buildShoppingQuoteClient(p: Record<string, unknown>): ShoppingQuoteClientDetail {
  const u = p.user as Record<string, unknown> | undefined
  const prof = u?.profile as Record<string, unknown> | undefined
  const city = prof?.city as { name?: unknown } | undefined
  const state = prof?.state as { name?: unknown } | undefined
  const country = prof?.country as { name?: unknown } | undefined

  const name = displayLocalized(u?.name) || 'Client'
  const email = typeof u?.email === 'string' && u.email.trim() ? u.email.trim() : undefined

  const phoneUser = typeof u?.phone === 'string' && u.phone.trim() ? u.phone.trim() : ''
  const phoneProf =
    prof && typeof prof.phone === 'string' && String(prof.phone).trim()
      ? String(prof.phone).trim()
      : ''
  const phone = phoneUser || phoneProf || undefined

  const phoneSecondary =
    prof && typeof prof.phone_secondary === 'string' && String(prof.phone_secondary).trim()
      ? String(prof.phone_secondary).trim()
      : undefined

  const locker =
    u && typeof u.locker_number === 'string' && String(u.locker_number).trim()
      ? String(u.locker_number).trim()
      : undefined

  const addressLine =
    prof && typeof prof.address === 'string' && String(prof.address).trim()
      ? String(prof.address).trim()
      : undefined

  const landmark =
    prof && typeof prof.landmark === 'string' && String(prof.landmark).trim()
      ? String(prof.landmark).trim()
      : undefined

  const zip = prof && prof.zip_code != null && String(prof.zip_code).trim() ? String(prof.zip_code).trim() : ''
  const cityName = displayLocalized(city?.name)
  const cityLine = [zip, cityName].filter(Boolean).join(' ').trim() || undefined
  const stateN = displayLocalized(state?.name) || undefined
  const countryN = displayLocalized(country?.name) || undefined

  return {
    name,
    email,
    phone,
    phoneSecondary,
    lockerNumber: locker,
    addressLine,
    landmark,
    cityLine,
    state: stateN,
    country: countryN,
  }
}

function purchaseStatusCode(p: Record<string, unknown>): string {
  const s = p.status
  if (typeof s === 'string') return s
  if (s && typeof s === 'object' && 'value' in (s as object)) {
    const v = (s as { value?: string }).value
    if (typeof v === 'string') return v
  }
  return ''
}

type PurchaseItemRow = {
  id?: unknown
  url?: unknown
  name?: unknown
  display_label?: unknown
  options?: unknown
  quantity?: unknown
  unit_price?: unknown
  merchant?: unknown
}

function itemMerchantForQuoteLine(it: PurchaseItemRow): AdminQuoteLine['merchant'] {
  const m = it.merchant
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  const idRaw = o.id
  const id =
    typeof idRaw === 'number' && Number.isFinite(idRaw)
      ? idRaw
      : typeof idRaw === 'string' && idRaw.trim() !== ''
        ? Number(idRaw)
        : undefined
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim() : null
  const logo_url = typeof o.logo_url === 'string' && o.logo_url.trim() ? o.logo_url.trim() : null
  if (id == null && !name && !logo_url) return null
  return {
    id: id != null && Number.isFinite(id) ? id : undefined,
    name,
    logo_url,
  }
}

function fallbackArticleLabelFromUrl(url: string): string {
  const t = url.trim()
  if (!t) return 'Article'
  try {
    const u = new URL(t)
    const host = u.hostname.replace(/^www\./i, '')
    if (/amzn\.|^amazon\./i.test(host)) return `Produit (${host})`
    return host ? `Produit (${host})` : 'Article'
  } catch {
    return 'Article'
  }
}

function buildQuoteLines(p: Record<string, unknown>, canEdit: boolean, quoteNum: number): AdminQuoteLine[] {
  const rawItems = p.items as PurchaseItemRow[] | undefined
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.map((it) => {
      const qty = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 1
      const unitFromItem = it.unit_price != null && it.unit_price !== '' ? Number(it.unit_price) : NaN
      let initialUnitPrice: number | null = null
      if (Number.isFinite(unitFromItem)) {
        initialUnitPrice = unitFromItem
      } else if (canEdit && rawItems.length === 1 && p.price_displayed != null) {
        initialUnitPrice = Number(p.price_displayed)
      } else if (!canEdit && rawItems.length === 1 && Number.isFinite(quoteNum) && qty > 0) {
        initialUnitPrice = quoteNum / qty
      }
      const urlStr = String(it.url ?? '')
      return {
        id: it.id as string | number,
        articleLabel:
          (typeof it.display_label === 'string' && it.display_label.trim()) ||
          (typeof it.name === 'string' && it.name.trim()) ||
          (typeof p.article_label === 'string' && p.article_label.trim()) ||
          fallbackArticleLabelFromUrl(urlStr) ||
          'Article',
        optionsLabel: typeof it.options === 'string' ? it.options : null,
        productUrl: String(it.url ?? ''),
        quantity: qty,
        initialUnitPrice: Number.isFinite(initialUnitPrice ?? NaN) ? initialUnitPrice : null,
        merchant: itemMerchantForQuoteLine(it),
      }
    })
  }

  const qty = typeof p.quantity === 'number' ? p.quantity : Number(p.quantity) || 1
  const legacyUrl = String(p.product_url ?? '')
  return [
    {
      id: p.id as string | number,
      articleLabel:
        (typeof p.article_label === 'string' && p.article_label.trim()) ||
        fallbackArticleLabelFromUrl(legacyUrl) ||
        'Article',
      optionsLabel: typeof p.line_notes === 'string' ? p.line_notes : null,
      productUrl: String(p.product_url ?? ''),
      quantity: qty,
      initialUnitPrice:
        canEdit && p.price_displayed != null
          ? Number(p.price_displayed)
          : Number.isFinite(quoteNum) && qty > 0
            ? quoteNum / qty
            : null,
    },
  ]
}

function parseBankFeePercentage(p: Record<string, unknown>): number {
  const v = p.bank_fee_percentage
  if (v != null && v !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 3
}

function computeReadonlyQuoteDetails(p: Record<string, unknown>): ReadonlyQuoteFinancialDetails {
  const rawItems = p.items as PurchaseItemRow[] | undefined
  let sub = 0
  if (Array.isArray(rawItems)) {
    for (const it of rawItems) {
      const u = Number(it.unit_price) || 0
      const q = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 0
      sub += u * q
    }
  }
  const svc = Number(p.service_fee) || 0
  const pct = parseBankFeePercentage(p)
  const bank = (sub + svc) * (pct / 100)
  const totalField = p.total_amount ?? p.quote_amount
  const total = totalField != null && totalField !== '' ? Number(totalField) : sub + svc + bank
  const note = typeof p.payment_methods_note === 'string' ? p.payment_methods_note : null
  return {
    subtotal: sub,
    serviceFee: svc,
    bankFeeAmount: bank,
    bankFeePercentage: pct,
    paymentMethodsNote: note,
    total: Number.isFinite(total) ? total : sub + svc + bank,
  }
}

export default function AssistedPurchaseQuotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const appCurrency = branding?.currency?.trim() ? branding.currency.trim() : 'EUR'

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))

  const { data, isLoading, isError } = useQuery({
    queryKey: ['assisted-purchase', id],
    queryFn: () => api.get<{ purchase: Record<string, unknown> }>(`/api/assisted-purchases/${id}`).then((r) => r.data),
    enabled: Boolean(id) && isStaff,
  })

  const markOrderedMutation = useMutation({
    mutationFn: (supplier_tracking_number: string | null) =>
      api.post<{ message?: string; purchase?: Record<string, unknown> }>(
        `/api/assisted-purchases/${id}/mark-ordered`,
        { supplier_tracking_number },
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Commande fournisseur enregistrée. Le client a été notifié.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible d’enregistrer la commande fournisseur.'))
    },
  })

  const quoteMutation = useMutation({
    mutationFn: (payload: {
      items: { id: number; unit_price: number }[]
      service_fee: number
      bank_fee_percentage: number
      payment_methods_note: string | null
    }) => api.post(`/api/assisted-purchases/${id}/quote`, payload),
    onSuccess: () => {
      toast.success('Devis enregistré. Le client a été notifié.')
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
      void queryClient.invalidateQueries({ queryKey: ['purchases'] })
      navigate('/purchase-orders')
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg || 'Impossible d’enregistrer le devis.')
    },
  })

  if (!isStaff) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (!id) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl border bg-card animate-pulse" />
        <div className="h-64 rounded-xl border bg-card animate-pulse" />
      </div>
    )
  }

  if (isError || !data?.purchase) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Demande introuvable ou accès refusé.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/purchase-orders">Retour à la liste</Link>
        </Button>
      </div>
    )
  }

  const p = data.purchase
  const statusCode = purchaseStatusCode(p)
  const statusLabel =
    typeof p.status_label === 'string' && p.status_label.trim()
      ? p.status_label
      : statusCode
  const toneClassName = typeof p.status_color === 'string' ? p.status_color : undefined

  const canEdit = statusCode === 'pending_quote'
  const displayCurrency =
    !canEdit && typeof p.quote_currency === 'string' && p.quote_currency.trim() !== ''
      ? p.quote_currency.trim()
      : appCurrency
  const totalField = p.total_amount ?? p.quote_amount
  const quoteNum =
    totalField != null && totalField !== '' ? Number(totalField) : NaN
  const readonlyFinancial =
    !canEdit && Number.isFinite(quoteNum)
      ? {
          total: quoteNum,
          hint: 'Le client a reçu le lien de paiement par e-mail et notification.',
        }
      : null

  const lines = buildQuoteLines(p, canEdit, quoteNum)
  const initialBankPct = parseBankFeePercentage(p)
  const initialPaymentNote =
    typeof p.payment_methods_note === 'string' && p.payment_methods_note.trim() !== ''
      ? p.payment_methods_note.trim()
      : null
  const readonlyDetails = !canEdit ? computeReadonlyQuoteDetails(p) : null

  const handleSend = async (payload: AdminShoppingQuotePayload) => {
    await quoteMutation.mutateAsync({
      items: payload.lines.map((l) => ({
        id: Number(l.id),
        unit_price: l.unitPrice,
      })),
      service_fee: payload.serviceFee,
      bank_fee_percentage: payload.bankFeePercentage,
      payment_methods_note: payload.paymentMethodsNote.trim() !== '' ? payload.paymentMethodsNote.trim() : null,
    })
  }

  const handleEmailPreview = async (body: AssistedQuotePreviewBody) => {
    const { data } = await api.post<{ html: string }>(`/api/assisted-purchases/${id}/quote-preview`, body)
    return data.html
  }

  return (
    <AdminShoppingQuoteView
      key={String(p.id)}
      requestId={String(p.id)}
      status={{ code: statusCode, label: statusLabel, toneClassName }}
      client={buildShoppingQuoteClient(p)}
      lines={lines}
      currency={displayCurrency}
      canEdit={canEdit}
      readonlyFinancialSummary={readonlyFinancial}
      readonlyQuoteDetails={readonlyDetails}
      initialBankFeePercentage={initialBankPct}
      initialPaymentMethodsNote={initialPaymentNote}
      isSending={quoteMutation.isPending}
      onSendQuote={handleSend}
      onRequestEmailPreview={canEdit ? handleEmailPreview : undefined}
      headerActions={
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link to="/purchase-orders">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </Link>
        </Button>
      }
      markOrderedAction={
        statusCode === 'paid'
          ? {
              isSubmitting: markOrderedMutation.isPending,
              onSubmit: async (supplierTrackingNumber) => {
                await markOrderedMutation.mutateAsync(supplierTrackingNumber)
              },
            }
          : null
      }
      orderedSupplierTracking={
        statusCode === 'ordered' &&
        typeof p.supplier_tracking_number === 'string' &&
        p.supplier_tracking_number.trim() !== ''
          ? p.supplier_tracking_number.trim()
          : null
      }
    />
  )
}
