import { useState, useEffect } from 'react'
import { usePaymentGateways, paymentMethodHooks, useFormatMoney } from '@/hooks/useSettings'
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { CheckoutCompanyCoverageCard } from '@/components/workflow/checkout/CheckoutCompanyCoverageCard'
import { CheckoutCompletionBar } from '@/components/workflow/checkout/CheckoutCompletionBar'
import { CheckoutDigitalFormBanner } from '@/components/workflow/checkout/CheckoutDigitalFormBanner'
import { CheckoutInvoiceSummaryCard } from '@/components/workflow/checkout/CheckoutInvoiceSummaryCard'
import {
  CheckoutPaymentFormCard,
  type CheckoutPaymentMethodItem,
} from '@/components/workflow/checkout/CheckoutPaymentFormCard'

interface CheckoutStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipment: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  docSettings: any
  onPaymentRecorded: () => void
  onRecordPayment: (data: { amount: number; method: string; reference?: string; note?: string }) => Promise<void>
  onInvoiceOptionsSaved?: () => void
  onViewForm?: () => void
  isProcessing?: boolean
}

export function CheckoutStep({
  shipment,
  docSettings,
  onPaymentRecorded,
  onRecordPayment,
  onInvoiceOptionsSaved,
  onViewForm,
}: CheckoutStepProps) {
  const { data: gateways } = usePaymentGateways()
  const { data: paymentMethods } = paymentMethodHooks.useList()
  const { formatMoney, branding } = useFormatMoney()
  const dec = Math.min(Math.max(Number(docSettings?.decimals ?? 2) || 2, 0), 8)
  const fractionDigits = { min: dec, max: dec } as const

  function fmt(amount: number | string | null | undefined) {
    if (amount !== 0 && !amount) return '—'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (!Number.isFinite(num)) return '—'
    return formatMoney(num, fractionDigits)
  }

  const [method, setMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [companyCoverageDraft, setCompanyCoverageDraft] = useState('')
  const [savingCoverage, setSavingCoverage] = useState(false)

  const shipmentId = shipment?.id as number | undefined

  useEffect(() => {
    const v = shipment?.company_coverage_amount
    setCompanyCoverageDraft(v != null && v !== '' ? String(v) : '')
  }, [shipment?.company_coverage_amount, shipmentId])

  const availableMethods: CheckoutPaymentMethodItem[] = [
    { value: 'cash', label: 'Espèces', icon: Banknote, active: true },
    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, active: true },
    { value: 'bank_transfer', label: 'Virement bancaire', icon: Building2, active: !!gateways?.wire_transfer?.is_active },
    { value: 'card', label: 'Carte bancaire', icon: CreditCard, active: true },
    ...(paymentMethods?.filter(m => m.is_active && !['cash', 'mobile_money', 'bank_transfer', 'card'].includes(m.code || ''))
      .map(m => ({ value: m.code || String(m.id), label: m.name as unknown as string, icon: Banknote, active: true })) || []),
  ].filter(m => m.active)

  const totalPrice = parseFloat(shipment?.calculated_price || '0')
  const amountPaid = parseFloat(shipment?.amount_paid || '0')
  const remaining = Math.max(0, totalPrice - amountPaid)
  const paymentStatus = shipment?.payment_status || 'unpaid'
  const isFullyPaid = paymentStatus === 'paid' || remaining <= 0

  const handleAmountFill = () => {
    setAmount(remaining.toFixed(docSettings?.decimals ?? 2))
  }

  const handleSubmit = async () => {
    if (!method) {
      toast.error('Veuillez sélectionner un mode de paiement')
      return
    }
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Veuillez saisir un montant valide')
      return
    }
    if (parsedAmount > remaining + 0.01) {
      toast.error(`Le montant ne peut pas dépasser le restant dû (${fmt(remaining)})`)
      return
    }

    setSubmitting(true)
    try {
      await onRecordPayment({
        amount: parsedAmount,
        method,
        reference: reference || undefined,
        note: note || undefined,
      })
      toast.success('Paiement enregistré avec succès')
      setAmount('')
      setReference('')
      setNote('')
      setMethod('')
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string } | undefined)?.message || 'Erreur lors de l\'enregistrement du paiement',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {onViewForm ? <CheckoutDigitalFormBanner onViewForm={onViewForm} /> : null}
      <CheckoutCompanyCoverageCard
        shipmentId={shipmentId}
        companyCoverageDraft={companyCoverageDraft}
        setCompanyCoverageDraft={setCompanyCoverageDraft}
        savingCoverage={savingCoverage}
        setSavingCoverage={setSavingCoverage}
        branding={branding}
        onInvoiceOptionsSaved={onInvoiceOptionsSaved}
      />
      <CheckoutInvoiceSummaryCard
        shipment={shipment}
        fmt={fmt}
        totalPrice={totalPrice}
        amountPaid={amountPaid}
        remaining={remaining}
        isFullyPaid={isFullyPaid}
        paymentStatus={paymentStatus}
      />
      {!isFullyPaid && (
        <CheckoutPaymentFormCard
          availableMethods={availableMethods}
          method={method}
          setMethod={setMethod}
          amount={amount}
          setAmount={setAmount}
          reference={reference}
          setReference={setReference}
          note={note}
          setNote={setNote}
          submitting={submitting}
          handleAmountFill={handleAmountFill}
          handleSubmit={() => void handleSubmit()}
        />
      )}
      <CheckoutCompletionBar isFullyPaid={isFullyPaid} onPaymentRecorded={onPaymentRecorded} />
    </div>
  )
}
