import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { DEFAULT_PAYMENT_METHODS_NOTE, STATUS_HEX } from '@/constants/shopping'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { parsePercentage, parsePositiveNumber } from '@/lib/shoppingQuoteCalculations'

import type {
  AdminShoppingQuotePayload,
  AssistedQuotePreviewBody,
  AdminShoppingQuoteViewProps,
} from '@/types/shopping'

export function useAdminShoppingQuoteViewState({
  requestId,
  status,
  lines,
  currency = 'EUR',
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
> & {
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

  useEffect(() => {
    onQuoteDataChange?.({ unitPrices, serviceFee, bankFeePercentage, paymentMethodsNote })
  }, [unitPrices, serviceFee, bankFeePercentage, paymentMethodsNote, onQuoteDataChange])

  const [supplierTrackingInput, setSupplierTrackingInput] = useState('')
  const [confirmOrderWithoutTracking, setConfirmOrderWithoutTracking] = useState(false)
  const [confirmConvertOpen, setConfirmConvertOpen] = useState(false)

  const subtotal = useMemo(() => {
    let sum = 0
    for (const line of lines) {
      const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
      sum += u * (line.quantity || 0)
    }
    return sum
  }, [lines, unitPrices])

  const feeAmount = useMemo(() => parsePositiveNumber(serviceFee), [serviceFee])
  const bankPct = useMemo(() => parsePercentage(bankFeePercentage), [bankFeePercentage])
  const baseBeforeBank = subtotal + feeAmount
  const bankFeeAmount = useMemo(
    () => baseBeforeBank * (bankPct / 100),
    [baseBeforeBank, bankPct],
  )
  const grandTotal = subtotal + feeAmount + bankFeeAmount

  const lineTotals = useMemo(() => {
    return lines.map((line) => {
      const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
      const lt = u * (line.quantity || 0)
      return { line, unitPrice: u, lineTotal: lt }
    })
  }, [lines, unitPrices])

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

  const buildPreviewBody = useCallback((): AssistedQuotePreviewBody => {
    return {
      items: lineTotals.map(({ line, unitPrice }) => ({
        id: Number(line.id),
        unit_price: unitPrice,
      })),
      service_fee: feeAmount,
      bank_fee_percentage: bankPct,
      payment_methods_note: paymentMethodsNote.trim() !== '' ? paymentMethodsNote.trim() : null,
    }
  }, [lineTotals, feeAmount, bankPct, paymentMethodsNote])

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
      lines: lineTotals.map(({ line, unitPrice, lineTotal }) => ({
        id: line.id,
        unitPrice,
        lineTotal,
      })),
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
  ])

  const money = (n: number) => formatMoney(n)
  const curLabel =
    currencyDisplay ??
    resolveMoneySymbol({
      currency: currency || brandingCurrency || 'EUR',
      currency_symbol: brandingSymbol,
    })

  return {
    unitPrices,
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
  }
}
