import { CreditCard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { displayLocalized } from '@/lib/localizedString'
import type { ShipmentDetailPaymentsProps } from '@/components/shipments/detail/shipmentDetailPaymentsTypes'

export function ShipmentDetailPaymentDialog({
  shipmentId,
  trackingNumber,
  paymentDialogOpen,
  onPaymentDialogOpenChange,
  paymentForm,
  setPaymentForm,
  shipment,
  formatMoney,
  paymentMethods,
  gateways,
  recordPayment,
  onRecordPayment,
}: Omit<ShipmentDetailPaymentsProps, 'payBadge'>) {
  const calculated = parseFloat(String((shipment as { calculated_price?: string }).calculated_price ?? '0'))
  const paid = parseFloat(String(shipment.amount_paid ?? '0'))
  const remainder = Math.max(0, calculated - paid)

  return (
    <Dialog open={paymentDialogOpen} onOpenChange={onPaymentDialogOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard size={18} /> Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            {trackingNumber || `EXP-${shipmentId}`} — Saisissez le montant et le mode de paiement recu.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatMoney(calculated)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deja paye</span>
            <span className="font-medium text-emerald-600">{formatMoney(paid)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5">
            <span className="font-medium">Reste a payer</span>
            <span className="font-bold">{formatMoney(remainder)}</span>
          </div>
        </div>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label>Montant *</Label>
            <Input
              type="number"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder={`Solde: ${formatMoney(remainder)}`}
            />
          </div>
          <div className="space-y-2">
            <Label>Methode de paiement *</Label>
            <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((p) => ({ ...p, method: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {!paymentMethods || paymentMethods.length === 0 ? (
                  <>
                    <SelectItem value="cash">Especes</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                  </>
                ) : (
                  paymentMethods
                    .filter((m) => m.is_active)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.code || String(m.id)}>
                        {displayLocalized(m.name as unknown)}
                      </SelectItem>
                    ))
                )}
                {gateways?.wire_transfer?.is_active && (
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                )}
                {(!paymentMethods || paymentMethods.length === 0) && <SelectItem value="other">Autre</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference (optionnelle)</Label>
            <Input
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
              placeholder="Ref. transaction"
            />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={paymentForm.note}
              onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onPaymentDialogOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={onRecordPayment}
            disabled={!paymentForm.amount || !paymentForm.method || recordPayment.isPending}
          >
            {recordPayment.isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
