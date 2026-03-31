import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  isProcessing?: boolean
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', icon: Banknote },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  { value: 'bank_transfer', label: 'Virement bancaire', icon: Building2 },
  { value: 'card', label: 'Carte bancaire', icon: CreditCard },
]

function formatCurrency(amount: number | string | null | undefined, settings: any) {
  if (!amount && amount !== 0) return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const decimals = settings?.decimals ?? 2
  const symbol = settings?.currency_symbol ?? '€'
  const position = settings?.symbol_position ?? 'prefix'
  const formatted = num.toFixed(decimals)
  return position === 'suffix' ? `${formatted} ${symbol}` : `${symbol}${formatted}`
}

export function CheckoutStep({
  shipment,
  docSettings,
  onPaymentRecorded,
  onRecordPayment,
  isProcessing,
}: CheckoutStepProps) {
  const [method, setMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    if (parsedAmount > remaining) {
      toast.error(`Le montant ne peut pas dépasser le restant dû (${formatCurrency(remaining, docSettings)})`)
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

  return (
    <div className="space-y-4">
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
              <p className="text-2xl font-bold">{formatCurrency(totalPrice, docSettings)}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Montant payé</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(amountPaid, docSettings)}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Reste à payer</p>
              <p className={`text-2xl font-bold ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {formatCurrency(remaining, docSettings)}
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
                    <span className="font-medium">{formatCurrency(shipment.pricing_snapshot.base_quote, docSettings)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.packaging_fee != null && parseFloat(shipment.pricing_snapshot.packaging_fee) > 0 && (
                  <div className="flex justify-between">
                    <span>Emballage</span>
                    <span className="font-medium">{formatCurrency(shipment.pricing_snapshot.packaging_fee, docSettings)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.insurance_amount != null && parseFloat(shipment.pricing_snapshot.insurance_amount) > 0 && (
                  <div className="flex justify-between">
                    <span>Assurance</span>
                    <span className="font-medium">{formatCurrency(shipment.pricing_snapshot.insurance_amount, docSettings)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.customs_amount != null && parseFloat(shipment.pricing_snapshot.customs_amount) > 0 && (
                  <div className="flex justify-between">
                    <span>Droits de douane</span>
                    <span className="font-medium">{formatCurrency(shipment.pricing_snapshot.customs_amount, docSettings)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.tax_amount != null && parseFloat(shipment.pricing_snapshot.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span className="font-medium">{formatCurrency(shipment.pricing_snapshot.tax_amount, docSettings)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.manual_fee != null && parseFloat(shipment.pricing_snapshot.manual_fee) > 0 && (
                  <div className="flex justify-between">
                    <span>{shipment.pricing_snapshot.manual_fee_label || 'Frais supplémentaires'}</span>
                    <span className="font-medium">{formatCurrency(shipment.pricing_snapshot.manual_fee, docSettings)}</span>
                  </div>
                )}
                {shipment.pricing_snapshot.discount_amount != null && parseFloat(shipment.pricing_snapshot.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Remise</span>
                    <span className="font-medium">-{formatCurrency(shipment.pricing_snapshot.discount_amount, docSettings)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice, docSettings)}</span>
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
              {PAYMENT_METHODS.map((pm) => {
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

      {/* Continue to dispatch */}
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
          Passer à l'expédition
        </Button>
      </div>
    </div>
  )
}
