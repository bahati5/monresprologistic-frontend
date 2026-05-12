import type { LucideIcon } from 'lucide-react'
import { CreditCard, Coins, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface CheckoutPaymentMethodItem {
  value: string
  label: string
  icon: LucideIcon
  active: boolean
}

interface CheckoutPaymentFormCardProps {
  availableMethods: CheckoutPaymentMethodItem[]
  method: string
  setMethod: (v: string) => void
  amount: string
  setAmount: (v: string) => void
  reference: string
  setReference: (v: string) => void
  note: string
  setNote: (v: string) => void
  submitting: boolean
  handleAmountFill: () => void
  handleSubmit: () => void
}

export function CheckoutPaymentFormCard({
  availableMethods,
  method,
  setMethod,
  amount,
  setAmount,
  reference,
  setReference,
  note,
  setNote,
  submitting,
  handleAmountFill,
  handleSubmit,
}: CheckoutPaymentFormCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard size={20} /> Enregistrer un paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <Coins size={18} />
            )}
            Enregistrer le paiement
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
