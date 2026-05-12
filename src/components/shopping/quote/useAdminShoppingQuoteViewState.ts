import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { DEFAULT_PAYMENT_METHODS_NOTE, STATUS_HEX } from '@/constants/shopping'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import {
  normalizeDraftPayload,
  pickNewerDraft,
  readQuoteDraftFromSession,
  writeQuoteDraftToSession,
  type QuoteEditDraftSnapshot,
} from '@/lib/quoteEditDraft'
import { parsePercentage, parsePositiveNumber } from '@/lib/shoppingQuoteCalculations'

import type {
  AdminShoppingQuotePayload,
  AssistedQuotePreviewBody,
  AdminShoppingQuoteViewProps,
} from '@/types/shopping'
import type {
  ActiveQuoteLine,
  ArticleAvailability,
  PurchaseArticle,
} from '@/types/assistedPurchase'

export function useAdminShoppingQuoteViewState({
  requestId,
  status,
  lines,
  articles,
  clientNote,
  currency,
  currencyDisplay,
  canEdit = true,
  isSending = false,
  onSendQuote,
  onRequestEmailPreview,
  initialBankFeePercentage = 3,
  initialPaymentMethodsNote = null,
  markOrderedAction = null,
  pageHeading,
  pageSubheading,
  onQuoteDataChange,
  formatMoney,
  brandingCurrency,
  brandingSymbol,
  quoteServerDraftPayload = null,
  quoteDraftsQuerySettled = true,
  revisionHydration = null,
}: Pick<
  AdminShoppingQuoteViewProps,
  | 'requestId'
  | 'status'
  | 'lines'
  | 'currency'
  | 'currencyDisplay'
  | 'canEdit'
  | 'isSending'
  | 'onSendQuote'
  | 'onRequestEmailPreview'
  | 'initialBankFeePercentage'
  | 'initialPaymentMethodsNote'
  | 'markOrderedAction'
  | 'pageHeading'
  | 'pageSubheading'
  | 'onQuoteDataChange'
  | 'quoteServerDraftPayload'
  | 'quoteDraftsQuerySettled'
  | 'revisionHydration'
> & {
  articles?: PurchaseArticle[]
  clientNote?: string | null
  formatMoney: (n: number) => string
  brandingCurrency?: string
  brandingSymbol: string
}) {
  const [unitPrices, setUnitPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const line of lines) {
      const key = String(line.id)
      if (line.initialUnitPrice != null && Number.isFinite(Number(line.initialUnitPrice))) {
        init[key] = String(line.initialUnitPrice)
      } else {
        init[key] = ''
      }
    }
    return init
  })

  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const line of lines) {
      init[String(line.id)] = String(line.quantity || 1)
    }
    return init
  })

  const [serviceFee, setServiceFee] = useState('')

  const defaultNote =
    initialPaymentMethodsNote != null && String(initialPaymentMethodsNote).trim() !== ''
      ? String(initialPaymentMethodsNote).trim()
      : DEFAULT_PAYMENT_METHODS_NOTE

  const [bankFeePercentage, setBankFeePercentage] = useState(() =>
    Number.isFinite(initialBankFeePercentage) ? String(initialBankFeePercentage) : '3',
  )
  const [paymentMethodsNote, setPaymentMethodsNote] = useState(defaultNote)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [staffMessage, setStaffMessage] = useState('')
  const [activeQuoteLines, setActiveQuoteLines] = useState<ActiveQuoteLine[]>([])
  const [quoteLineTotal, setQuoteLineTotal] = useState<number | null>(null)
  const [quoteLineTotalSecondary, setQuoteLineTotalSecondary] = useState<number | null>(null)
  const [articleAvailabilities, setArticleAvailabilities] = useState<
    Record<number, ArticleAvailability>
  >({})

  const handleAvailabilityChange = useCallback(
    (articleId: number, availability: ArticleAvailability) => {
      setArticleAvailabilities((prev) => ({ ...prev, [articleId]: availability }))
    },
    [],
  )

  const handleQuoteTotalChange = useCallback(
    (total: number, totalSecondary: number | null) => {
      setQuoteLineTotal(total)
      setQuoteLineTotalSecondary(totalSecondary)
    },
    [],
  )

  const handleQuoteLinesChange = useCallback((newLines: ActiveQuoteLine[]) => {
    setActiveQuoteLines(newLines)
  }, [])

  const enrichedArticles = useMemo(() => {
    if (!articles) return []
    return articles.map((a) => ({
      ...a,
      availability: articleAvailabilities[a.id] ?? a.availability,
    }))
  }, [articles, articleAvailabilities])

  const usesDynamicLines = canEdit && (articles?.length ?? 0) > 0

  const [quoteLineEditorReady, setQuoteLineEditorReady] = useState(() => !usesDynamicLines)
  const [prefillDynamicQuoteLines, setPrefillDynamicQuoteLines] = useState<ActiveQuoteLine[] | null>(null)
  const mergeAppliedRef = useRef(false)
  const [draftHydrationDone, setDraftHydrationDone] = useState(() => !canEdit)

  useEffect(() => {
    mergeAppliedRef.current = false
    setDraftHydrationDone(!canEdit)
    setQuoteLineEditorReady(!usesDynamicLines)
    setPrefillDynamicQuoteLines(null)
  }, [requestId, canEdit, usesDynamicLines])

  /** Restaure session / brouillon serveur une fois les lignes articles connues */
  useEffect(() => {
    if (!canEdit) {
      setQuoteLineEditorReady(true)
      setDraftHydrationDone(true)
      return
    }
    if (!quoteDraftsQuerySettled || lines.length === 0) {
      return
    }

    if (!mergeAppliedRef.current) {
      mergeAppliedRef.current = true
      const sessionSnap = readQuoteDraftFromSession(requestId)
      const serverSnap = quoteServerDraftPayload ? normalizeDraftPayload(quoteServerDraftPayload) : null
      const picked = pickNewerDraft(sessionSnap, serverSnap)

      if (picked) {
        const lineIds = new Set(lines.map((l) => String(l.id)))
        setUnitPrices((prev) => {
          const next = { ...prev }
          for (const [k, v] of Object.entries(picked.unitPrices)) {
            if (lineIds.has(k)) next[k] = v
          }
          return next
        })
        setQuantities((prev) => {
          const next = { ...prev }
          for (const [k, v] of Object.entries(picked.quantities)) {
            if (lineIds.has(k)) next[k] = v
          }
          return next
        })
        setServiceFee(picked.serviceFee)
        setBankFeePercentage(picked.bankFeePercentage || '3')
        setPaymentMethodsNote(picked.paymentMethodsNote || defaultNote)
        setEstimatedDelivery(picked.estimatedDelivery)
        setStaffMessage(picked.staffMessage)

        const avail: Record<number, ArticleAvailability> = {}
        for (const [k, v] of Object.entries(picked.articleAvailabilities ?? {})) {
          const id = Number(k)
          if (!Number.isFinite(id)) continue
          avail[id] = {
            status: v.status as ArticleAvailability['status'],
            alternative_note: v.alternative_note ?? '',
          }
        }
        if (Object.keys(avail).length > 0) {
          setArticleAvailabilities(avail)
        }

        if (picked.activeQuoteLines?.length) {
          setPrefillDynamicQuoteLines(picked.activeQuoteLines)
        }
      } else if (revisionHydration) {
        if (revisionHydration.estimatedDelivery.trim() !== '') {
          setEstimatedDelivery(revisionHydration.estimatedDelivery)
        }
        if (revisionHydration.staffMessage.trim() !== '') {
          setStaffMessage(revisionHydration.staffMessage)
        }
      }
    }

    setDraftHydrationDone(true)
    setQuoteLineEditorReady(true)
  }, [
    canEdit,
    quoteDraftsQuerySettled,
    requestId,
    lines,
    quoteServerDraftPayload,
    defaultNote,
    revisionHydration,
  ])

  const draftSnapshot = useMemo((): QuoteEditDraftSnapshot => {
    const availSerialized: Record<string, { status: string; alternative_note: string }> = {}
    for (const [id, a] of Object.entries(articleAvailabilities)) {
      availSerialized[id] = {
        status: a.status,
        alternative_note: a.alternative_note ?? '',
      }
    }
    return {
      v: 1,
      savedAt: new Date().toISOString(),
      unitPrices,
      quantities,
      serviceFee,
      bankFeePercentage,
      paymentMethodsNote,
      estimatedDelivery,
      staffMessage,
      activeQuoteLines,
      articleAvailabilities: availSerialized,
    }
  }, [
    unitPrices,
    quantities,
    serviceFee,
    bankFeePercentage,
    paymentMethodsNote,
    estimatedDelivery,
    staffMessage,
    activeQuoteLines,
    articleAvailabilities,
  ])

  useEffect(() => {
    if (!canEdit || !onQuoteDataChange || !draftHydrationDone) return
    onQuoteDataChange(draftSnapshot)
  }, [canEdit, onQuoteDataChange, draftHydrationDone, draftSnapshot])

  useEffect(() => {
    if (!canEdit || !draftHydrationDone) return
    const t = window.setTimeout(() => {
      writeQuoteDraftToSession(requestId, draftSnapshot)
    }, 450)
    return () => window.clearTimeout(t)
  }, [canEdit, draftHydrationDone, requestId, draftSnapshot])

  const [supplierTrackingInput, setSupplierTrackingInput] = useState('')
  const [confirmOrderWithoutTracking, setConfirmOrderWithoutTracking] = useState(false)
  const [confirmConvertOpen, setConfirmConvertOpen] = useState(false)

  const subtotal = useMemo(() => {
    let sum = 0
    for (const line of lines) {
      const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
      const q = parsePositiveNumber(quantities[String(line.id)] ?? String(line.quantity || 0))
      sum += u * q
    }
    return sum
  }, [lines, unitPrices, quantities])

  const feeAmount = useMemo(() => parsePositiveNumber(serviceFee), [serviceFee])
  const bankPct = useMemo(() => parsePercentage(bankFeePercentage), [bankFeePercentage])
  const baseBeforeBank = subtotal + feeAmount
  const bankFeeAmount = useMemo(
    () => baseBeforeBank * (bankPct / 100),
    [baseBeforeBank, bankPct],
  )
  const grandTotal = usesDynamicLines
    ? (quoteLineTotal ?? subtotal)
    : subtotal + feeAmount + bankFeeAmount

  const lineTotals = useMemo(() => {
    return lines.map((line) => {
      const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
      const q = parsePositiveNumber(quantities[String(line.id)] ?? String(line.quantity || 0))
      const lt = u * q
      return { line, unitPrice: u, quantity: q, lineTotal: lt }
    })
  }, [lines, unitPrices, quantities])

  const defaultSubheading =
    'Vérifiez les liens fournis par le client, saisissez les prix réels constatés sur le site marchand, puis ajoutez vos frais de service avant d’envoyer le devis.'
  const resolvedHeading =
    pageHeading != null && pageHeading.trim() !== '' ? pageHeading.trim() : `Chiffrage de la demande #${requestId}`
  const resolvedSubheading =
    pageSubheading != null && pageSubheading.trim() !== '' ? pageSubheading.trim() : defaultSubheading

  const statusHex = STATUS_HEX[status.code] ?? '#64748b'

  const badgeStyle =
    status.toneClassName == null || status.toneClassName === ''
      ? {
          backgroundColor: `${statusHex}20`,
          color: statusHex,
          borderColor: `${statusHex}55`,
        }
      : undefined

  const handleUnitChange = useCallback((id: string | number, value: string) => {
    setUnitPrices((prev) => ({ ...prev, [String(id)]: value }))
  }, [])

  const handleQuantityChange = useCallback((id: string | number, value: string) => {
    setQuantities((prev) => ({ ...prev, [String(id)]: value }))
  }, [])

  const buildPreviewBody = useCallback((): AssistedQuotePreviewBody => {
    const body: AssistedQuotePreviewBody = {
      items: lineTotals.map(({ line, unitPrice, quantity }) => ({
        id: Number(line.id),
        unit_price: unitPrice,
        quantity,
      })),
      service_fee: feeAmount,
      bank_fee_percentage: bankPct,
      payment_methods_note: paymentMethodsNote.trim() !== '' ? paymentMethodsNote.trim() : null,
    }
    if (usesDynamicLines && activeQuoteLines.length > 0) {
      body.lines = activeQuoteLines.map((dl) => ({
        internal_code: dl.internal_code,
        name: dl.name,
        type: dl.type,
        calculation_base: dl.calculation_base || null,
        value: parseFloat(dl.value) || 0,
        is_visible_to_client: dl.is_visible_to_client,
      }))
      if (estimatedDelivery.trim()) body.estimated_delivery = estimatedDelivery.trim()
      if (staffMessage.trim()) body.staff_message = staffMessage.trim()
    }
    return body
  }, [lineTotals, feeAmount, bankPct, paymentMethodsNote, usesDynamicLines, activeQuoteLines, estimatedDelivery, staffMessage])

  const handlePreviewEmail = useCallback(async () => {
    if (!onRequestEmailPreview || !canEdit) return
    setPreviewLoading(true)
    try {
      const html = await onRequestEmailPreview(buildPreviewBody())
      setPreviewHtml(html)
      setPreviewOpen(true)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Impossible de générer l’aperçu.'))
    } finally {
      setPreviewLoading(false)
    }
  }, [onRequestEmailPreview, canEdit, buildPreviewBody])

  const submitMarkOrdered = useCallback(async () => {
    if (!markOrderedAction) return
    const trimmed = supplierTrackingInput.trim()
    await markOrderedAction.onSubmit(trimmed !== '' ? trimmed : null)
  }, [markOrderedAction, supplierTrackingInput])

  const handleMarkOrderedClick = useCallback(() => {
    if (!markOrderedAction || markOrderedAction.isSubmitting) return
    const trimmed = supplierTrackingInput.trim()
    if (trimmed === '') {
      setConfirmOrderWithoutTracking(true)
      return
    }
    void submitMarkOrdered()
  }, [markOrderedAction, supplierTrackingInput, submitMarkOrdered])

  const handleSubmit = useCallback(async () => {
    if (!onSendQuote || !canEdit) return
    const payload: AdminShoppingQuotePayload = {
      subtotal,
      serviceFee: feeAmount,
      bankFeePercentage: bankPct,
      bankFeeAmount,
      paymentMethodsNote: paymentMethodsNote.trim(),
      total: grandTotal,
      lines: lineTotals.map(({ line, unitPrice, quantity, lineTotal }) => ({
        id: line.id,
        unitPrice,
        quantity,
        lineTotal,
      })),
    }
    if (usesDynamicLines) {
      payload.dynamicLines = activeQuoteLines
      payload.estimatedDelivery = estimatedDelivery.trim() || undefined
      payload.staffMessage = staffMessage.trim() || undefined
      payload.articleAvailabilities = enrichedArticles.map((a) => {
        const raw = a.availability?.status
        let mapped: string = 'exact'
        if (raw && raw !== 'not_checked') {
          mapped = raw === 'available_exact' ? 'exact' : raw
        }
        return {
          id: a.id,
          availability_status: mapped,
          alternative_note: a.availability?.alternative_note || null,
        }
      })
    }
    await onSendQuote(payload)
  }, [
    onSendQuote,
    canEdit,
    subtotal,
    feeAmount,
    bankPct,
    bankFeeAmount,
    paymentMethodsNote,
    grandTotal,
    lineTotals,
    usesDynamicLines,
    activeQuoteLines,
    estimatedDelivery,
    staffMessage,
    enrichedArticles,
  ])

  const money = (n: number) => formatMoney(n)
  const curLabel =
    currencyDisplay ??
    resolveMoneySymbol({
      currency: currency || brandingCurrency || '',
      currency_symbol: brandingSymbol,
    })

  return {
    unitPrices,
    quantities,
    handleQuantityChange,
    serviceFee,
    setServiceFee,
    bankFeePercentage,
    setBankFeePercentage,
    paymentMethodsNote,
    setPaymentMethodsNote,
    previewOpen,
    setPreviewOpen,
    previewHtml,
    previewLoading,
    supplierTrackingInput,
    setSupplierTrackingInput,
    confirmOrderWithoutTracking,
    setConfirmOrderWithoutTracking,
    confirmConvertOpen,
    setConfirmConvertOpen,
    subtotal,
    bankFeeAmount,
    grandTotal,
    handleUnitChange,
    handlePreviewEmail,
    submitMarkOrdered,
    handleMarkOrderedClick,
    handleSubmit,
    money,
    curLabel,
    resolvedHeading,
    resolvedSubheading,
    badgeStyle,
    canEdit,
    isSending,
    onSendQuote,
    onRequestEmailPreview,
    estimatedDelivery,
    setEstimatedDelivery,
    staffMessage,
    setStaffMessage,
    activeQuoteLines,
    quoteLineTotal,
    quoteLineTotalSecondary,
    handleQuoteTotalChange,
    handleQuoteLinesChange,
    handleAvailabilityChange,
    enrichedArticles,
    clientNote: clientNote ?? null,
    usesDynamicLines,
    quoteLineEditorReady,
    prefillDynamicQuoteLines,
  }
}
