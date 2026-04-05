import { useState, useEffect } from 'react'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFormatMoney, usePaymentGateways, paymentMethodHooks } from '@/hooks/useSettings'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  CreditCard, DollarSign, CheckCircle, Loader2, Receipt,
  Banknote, Smartphone, Building2, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface CheckoutStepProps {
  shipment: any
  docSettings: any
  onPaymentRecorded: () => void
  onRecordPayment: (data: { amount: number; method: string; reference?: string; note?: string }) => Promise<void>
  /** Après enregistrement du montant de prise en charge (facture PDF). */
  onInvoiceOptionsSaved?: () => void
  isProcessing?: boolean
}

export function CheckoutStep({
  shipment,
  docSettings,
  onPaymentRecorded,
  onRecordPayment,
  onInvoiceOptionsSaved,
  isProcessing,
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

  // Combined available methods
  const availableMethods = [
    { value: 'cash', label: 'Espèces', icon: Banknote, active: true },
    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, active: true },
    { value: 'bank_transfer', label: 'Virement bancaire', icon: Building2, active: !!gateways?.wire_transfer?.is_active },
    { value: 'card', label: 'Carte bancaire', icon: CreditCard, active: true },
    // Show others if defined in settings
    ...(paymentMethods?.filter(m => m.is_active && !['cash', 'mobile_money', 'bank_transfer', 'card'].includes(m.code || ''))
      .map(m => ({ value: m.code || String(m.id), label: m.name as unknown as string, icon: Banknote, active: true })) || [])
  ].filter(m => m.active)

  const totalPrice = parseFloat(shipment?.calculated_price || '0')
  const amountPaid = parseFloat(shipment?.amount_paid || '0')
  const remaining = Math.max(0, totalPrice - amountPaid)
  const paymentStatus = shipment?.payment_status || 'unpaid'
  const isFullyPaid = paymentStatus === 'paid' || remaining <= 0

  // Auto-fill amount with remaining
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
    if (parsedAmount > remaining + 0.01) { // 1 cent safety
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
      // Reset form
      setAmount('')
      setReference('')
      setNote('')
      setMethod('')
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l\'enregistrement du paiement')
    } finally {
      setSubmitting(false)
    }
  }

  const saveCompanyCoverage = async (resetToDefault: boolean) => {
    if (!shipmentId) {
      toast.error('Expédition introuvable')
      return
    }
    setSavingCoverage(true)
    try {
      const payload =
        resetToDefault
          ? { company_coverage_amount: null }
          : (() => {
              const t = companyCoverageDraft.trim()
              if (t === '') return { company_coverage_amount: null }
              const n = Number(t)
              if (Number.isNaN(n) || n < 0) {
                throw new Error('Montant de prise en charge invalide')
              }
              return { company_coverage_amount: n }
            })()
      await api.patch(`/api/shipments/${shipmentId}/invoice-options`, payload)
      toast.success(resetToDefault ? 'Prise en charge : défaut des paramètres' : 'Prise en charge enregistrée pour la facture')
      onInvoiceOptionsSaved?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement'
      toast.error(msg)
    } finally {
      setSavingCoverage(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Prise en charge entreprise (facture PDF)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Montant indicatif affiché sur la facture à côté de la valeur déclarée par le client. Laisser vide pour
            utiliser le défaut défini dans Paramètres → Général → Factures expéditions.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5 min-w-[200px]">
              <Label htmlFor="checkout-company-coverage">
                Montant (
                {resolveMoneySymbol(
                  branding ?? { currency: 'EUR', currency_symbol: '' },
                )}
                )
              </Label>
              <Input
                id="checkout-company-coverage"
                type="number"
                min={0}
                step="0.01"
                placeholder="Défaut paramètres"
                value={companyCoverageDraft}
                onChange={(e) => setCompanyCoverageDraft(e.target.value)}
                disabled={!shipmentId || savingCoverage}
              />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!shipmentId || savingCoverage}
              onClick={() => void saveCompanyCoverage(false)}
            >
              {savingCoverage ? <Loader2 size={14} className="animate-spin" /> : null}
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!shipmentId || savingCoverage}
              onClick={() => {
                setCompanyCoverageDraft('')
                void saveCompanyCoverage(true)
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt size={20} /> Résumé de la facturation
            </CardTitle>
            <Badge
              variant={isFullyPaid ? 'default' : 'secondary'}
              className={isFullyPaid ? 'bg-emerald-500 text-white' : ''}
            >
              {isFullyPaid ? 'Payé' : paymentStatus === 'partial' ? 'Paiement partiel' : 'Impayé'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Montant total</p>
              <p className="text-2xl font-bold">{fmt(totalPrice)}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Montant payé</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(amountPaid)}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Reste à payer</p>
              <p className={`text-2xl font-bold ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {fmt(remaining)}
              </p>
            </div>
          </div>

          {/* Pricing breakdown */}
          {shipment?.pricing_snapshot && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <h4 className="font-medium text-muted-foreground">Détail des frais</h4>
                {shipment.pricing_snapshot.base_quote != null && (
                  <div className="flex justify-between">
                    <span>Frais de base</span>
                    <span className="font-medium">{fmt(shipment.pricing_snapshot.base_quote)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.packaging_fee != null && parseFloat(shipment.pricing_snapshot.packaging_fee) > 0 && (
                  <div className="flex justify-between">
                    <span>Emballage</span>
                    <span className="font-medium">{fmt(shipment.pricing_snapshot.packaging_fee)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.insurance_amount != null && parseFloat(shipment.pricing_snapshot.insurance_amount) > 0 && (
                  <div className="flex justify-between">
                    <span>Assurance</span>
                    <span className="font-medium">{fmt(shipment.pricing_snapshot.insurance_amount)}</span>
                  </div>
                )}
                {(shipment.pricing_snapshot.customs_duty_amount != null || shipment.pricing_snapshot.customs_amount != null) &&
                  parseFloat(shipment.pricing_snapshot.customs_duty_amount ?? shipment.pricing_snapshot.customs_amount ?? '0') > 0 && (
                  <div className="flex justify-between">
                    <span>Droits de douane</span>
                    <span className="font-medium">
                      {fmt(
                        shipment.pricing_snapshot.customs_duty_amount ?? shipment.pricing_snapshot.customs_amount,
                      )}
                    </span>
                  </div>
                )}
                {shipment.pricing_snapshot.tax_amount != null && parseFloat(shipment.pricing_snapshot.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span className="font-medium">{fmt(shipment.pricing_snapshot.tax_amount)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.manual_fee != null && parseFloat(shipment.pricing_snapshot.manual_fee) > 0 && (
                  <div className="flex justify-between">
                    <span>{shipment.pricing_snapshot.manual_fee_label || 'Frais supplémentaires'}</span>
                    <span className="font-medium">{fmt(shipment.pricing_snapshot.manual_fee)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.discount_amount != null && parseFloat(shipment.pricing_snapshot.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Remise</span>
                    <span className="font-medium">-{fmt(shipment.pricing_snapshot.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment form */}
      {!isFullyPaid && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard size={20} /> Enregistrer un paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment method selector */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {availableMethods.map((pm) => {
                const Icon = pm.icon
                const selected = method === pm.value
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setMethod(pm.value)}
                    className={`
                      flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all
                      ${selected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300'
                        : 'border-muted hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground'}
                    `}
                  >
                    <Icon size={24} />
                    <span className="text-sm font-medium">{pm.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant</Label>
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={handleAmountFill}
                  >
                    Tout payer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Référence (optionnel)</Label>
                <Input
                  id="reference"
                  placeholder="N° transaction, reçu..."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Textarea
                id="note"
                placeholder="Observations sur le paiement..."
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !method || !amount}
                size="lg"
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <DollarSign size={18} />
                )}
                Enregistrer le paiement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          {!isFullyPaid && (
            <p className="text-sm text-amber-600 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Le paiement complet est requis pour continuer
            </p>
          )}
        </div>
        <Button
          onClick={onPaymentRecorded}
          size="lg"
          className="gap-2"
          disabled={!isFullyPaid}
        >
          <CheckCircle size={18} />
          Terminer et ouvrir l&apos;expédition
        </Button>
      </div>
    </div>
  )
}
