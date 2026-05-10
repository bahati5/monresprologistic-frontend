import { Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface CheckoutInvoiceSummaryCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipment: any
  fmt: (amount: number | string | null | undefined) => string
  totalPrice: number
  amountPaid: number
  remaining: number
  isFullyPaid: boolean
  paymentStatus: string
}

export function CheckoutInvoiceSummaryCard({
  shipment,
  fmt,
  totalPrice,
  amountPaid,
  remaining,
  isFullyPaid,
  paymentStatus,
}: CheckoutInvoiceSummaryCardProps) {
  return (
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
  )
}
