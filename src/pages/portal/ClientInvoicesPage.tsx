import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download } from 'lucide-react'

interface ClientInvoiceRow {
  id: number
  shipment?: { public_tracking?: string }
  amount?: number
  currency?: string
  status?: string
  shipment_id?: number
  created_at?: string
}

export default function ClientInvoicesPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['client-invoices', page],
    queryFn: () => api.get(`/api/client/invoices?page=${page}`).then(r => r.data),
  })

  const invoices: ClientInvoiceRow[] = data?.invoices?.data ?? []
  const meta = data?.invoices

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-orange-600" />
          Mes factures
        </h1>
        <p className="text-muted-foreground text-sm">
          Historique de toutes vos factures Monrespro
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Expédition</th>
                  <th className="px-4 py-3 text-left font-medium">Montant</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                      ))}
                    </tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    Aucune facture pour le moment.
                  </td></tr>
                ) : invoices.map((inv: ClientInvoiceRow) => (
                  <tr key={inv.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">#{inv.id}</td>
                    <td className="px-4 py-3 text-xs">{inv.shipment?.public_tracking ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{inv.amount} {inv.currency ?? ''}</td>
                    <td className="px-4 py-3">
                      <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {inv.status === 'paid' ? 'Payé' : 'En attente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.shipment_id ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`/api/shipments/${inv.shipment_id}/pdf/invoice`} target="_blank" rel="noreferrer">
                            <Download size={14} />
                          </a>
                        </Button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {meta && (meta.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
          <span className="text-sm text-muted-foreground">{page} / {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= (meta.last_page ?? 1)} onClick={() => setPage(p => p + 1)}>Suivant</Button>
        </div>
      )}
    </div>
  )
}
