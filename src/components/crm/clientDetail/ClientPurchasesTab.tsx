import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, ChevronRight } from 'lucide-react'
import {
  normalizeShipmentStatusCode,
  shipmentStatusLabelFr,
} from '@/lib/shipmentDisplay'
import type { ClientAssistedPurchaseRow } from '@/types/clientDetail'
import { formatDateTime } from './clientDetailFormatters'
import { StatusBadge } from './ClientDetailStatusBadge'

export interface ClientPurchasesTabProps {
  assistedPurchases: { data: ClientAssistedPurchaseRow[]; meta: { total: number } }
  formatMoney: (amount: number) => string
}

export function ClientPurchasesTab({ assistedPurchases, formatMoney }: ClientPurchasesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> Achats assistés
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assistedPurchases?.data?.length ? (
          <div className="space-y-2">
            {assistedPurchases.data.map((p) => {
              const dt = formatDateTime(p.created_at)
              return (
                <Link key={p.id} to={`/purchase-orders/${p.id}`} className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium">Demande #{p.id}</p>
                        {p.total_amount != null && (
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(p.total_amount)} {p.currency}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium">{dt.date}</p>
                        <p className="text-xs text-muted-foreground">{dt.time}</p>
                      </div>
                      {p.converted_shipment_id && (
                        <Link
                          to={`/shipments/${p.converted_shipment_id}`}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Expédition liée
                        </Link>
                      )}
                      <StatusBadge
                        status={p.status}
                        label={p.status_label ?? shipmentStatusLabelFr(normalizeShipmentStatusCode(p.status))}
                      />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun achat assisté</p>
        )}
      </CardContent>
    </Card>
  )
}
