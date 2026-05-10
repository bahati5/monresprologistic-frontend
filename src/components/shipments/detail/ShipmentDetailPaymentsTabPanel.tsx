import { CreditCard } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { paymentMethodDisplayLabel } from '@/lib/shipmentDetailWorkflow'
import type { PayBadge } from '@/components/shipments/detail/shipmentDetailPaymentsTypes'
import type { Shipment, ShipmentPayment } from '@/types/shipment'

export function ShipmentDetailPaymentsTabPanel({
  shipment,
  formatMoney,
  paymentMethods,
  payBadge,
}: {
  shipment: Shipment
  formatMoney: (n: number) => string
  paymentMethods: { code?: string | null; id: number; name: unknown; is_active?: boolean }[] | undefined
  payBadge: PayBadge
}) {
  const payments = shipment.payments ?? []

  return (
    <TabsContent value="payments" className="mt-4">
      <Card>
        <CardContent className="py-6 space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Synthèse</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Sous-total</p>
                <p className="text-lg font-semibold tabular-nums mt-0.5">
                  {shipment.subtotal != null ? formatMoney(Number(shipment.subtotal)) : '—'}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Taxes</p>
                <p className="text-lg font-semibold tabular-nums mt-0.5">
                  {shipment.tax_total != null ? formatMoney(Number(shipment.tax_total)) : '—'}
                </p>
              </div>
              <div className="rounded-lg border bg-blue-500/5 p-3">
                <p className="text-xs text-muted-foreground">Total dû</p>
                <p className="text-lg font-semibold tabular-nums text-blue-700 dark:text-blue-400 mt-0.5">
                  {shipment.total != null ? formatMoney(Number(shipment.total)) : '—'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Statut de paiement</p>
                <Badge className="mt-2 text-xs font-semibold px-2.5 py-0.5 border" style={payBadge.style}>
                  {payBadge.label}
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-muted-foreground">Déjà payé : </span>
                <span className="font-semibold tabular-nums text-emerald-600">
                  {formatMoney(Number(shipment.amount_paid ?? 0))}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground">Solde : </span>
                <span
                  className={`font-semibold tabular-nums ${(shipment.balance_due ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                >
                  {shipment.balance_due != null ? formatMoney(Number(shipment.balance_due)) : '—'}
                </span>
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Historique des paiements</p>
            {payments.length > 0 ? (
              <ul className="space-y-3">
                {payments.map((p: ShipmentPayment) => {
                  const methodLabel = paymentMethodDisplayLabel(String(p.method || ''), paymentMethods)
                  return (
                    <li key={p.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-base font-semibold tabular-nums">{formatMoney(Number(p.amount))}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.created_at
                            ? new Date(p.created_at).toLocaleString('fr-FR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </p>
                      </div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Mode : </span>
                        <span className="font-medium">{methodLabel}</span>
                      </p>
                      {p.reference ? (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Référence : </span>
                          {p.reference}
                        </p>
                      ) : null}
                      {p.note ? (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Note : </span>
                          {p.note}
                        </p>
                      ) : null}
                      {p.recorded_by ? (
                        <p className="text-xs text-muted-foreground">Enregistré par {p.recorded_by}</p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : shipment.payment_status === 'paid' ||
              shipment.payment_status === 'partial' ||
              Number(shipment.amount_paid ?? 0) > 0 ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Paiement reflété sur l&apos;expédition, sans ligne détaillée
                </p>
                <p className="text-sm text-muted-foreground">
                  Le solde indique {formatMoney(Number(shipment.amount_paid ?? 0))} enregistré
                  {shipment.paid_at ? (
                    <>
                      {' '}
                      (dernière mise à jour :{' '}
                      {new Date(shipment.paid_at).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                      )
                    </>
                  ) : null}
                  . Les prochains encaissements via &laquo; Caisse / paiement &raquo; apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground rounded-lg border border-dashed">
                <CreditCard size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Aucun paiement enregistré</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
