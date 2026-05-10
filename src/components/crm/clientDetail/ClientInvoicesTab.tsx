import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import type { ClientInvoiceRow } from '@/types/clientDetail'
import { formatDateTime } from './clientDetailFormatters'

export interface ClientInvoicesTabProps {
  invoices: { data: ClientInvoiceRow[]; meta: { total: number } }
  formatMoney: (amount: number) => string
}

export function ClientInvoicesTab({ invoices, formatMoney }: ClientInvoicesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" /> Factures
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices?.data?.length ? (
          <div className="space-y-2">
            {invoices.data.map((inv) => {
              const dt = formatDateTime(inv.created_at)
              const payStyle = inv.status === 'paid'
                ? { backgroundColor: '#10b98118', color: '#10b981', borderColor: '#10b98140' }
                : inv.status === 'pending'
                  ? { backgroundColor: '#f59e0b18', color: '#f59e0b', borderColor: '#f59e0b40' }
                  : { backgroundColor: '#ef444418', color: '#ef4444', borderColor: '#ef444440' }
              return (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    <div>
                      <p className="font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {dt.date} à {dt.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {inv.shipment_id && (
                      <Link
                        to={`/shipments/${inv.shipment_id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Expédition liée
                      </Link>
                    )}
                    <span className="font-medium">{formatMoney(inv.amount)}</span>
                    <Badge
                      className="text-xs font-semibold px-2 py-0.5 border"
                      style={payStyle}
                    >
                      {inv.status === 'paid' ? 'Payée' : inv.status === 'pending' ? 'En attente' : 'Annulée'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune facture</p>
        )}
      </CardContent>
    </Card>
  )
}
