import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/api/client'
import { useFormatMoney } from '@/hooks/useSettings'
import { downloadApiPdf } from '@/lib/openPdf'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search, Receipt, MoreHorizontal, Download, Eye,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  pending: { label: 'En attente', variant: 'outline' },
  sent: { label: 'Envoyee', variant: 'default' },
  paid: { label: 'Payee', variant: 'default' },
  partial: { label: 'Partielle', variant: 'outline' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulee', variant: 'secondary' },
}

function useInvoices(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['finance', 'invoices', params],
    queryFn: () => api.get('/api/finance/invoices', { params }).then((r) => r.data),
  })
}

interface InvoiceRow {
  id: number
  invoice_number?: string
  status?: string
  user?: { name?: string }
  shipment_id?: number
  shipment?: { tracking_number?: string }
  amount?: number
  created_at?: string
}

export default function InvoicesPage() {
  const { formatMoney } = useFormatMoney()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useInvoices({
    page,
    search: search || undefined,
    status: statusFilter || undefined,
  })

  const invoicesRaw = data?.invoices
  const invoices = Array.isArray(invoicesRaw?.data) ? invoicesRaw.data : (Array.isArray(invoicesRaw) ? invoicesRaw : [])
  const pagination = invoicesRaw?.meta ?? invoicesRaw ?? {}
  const totalPages = pagination.last_page ?? 1
  const total = pagination.total ?? invoices.length

  const handleSearch = () => {
    setPage(1)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt size={24} /> Facturation
          </h1>
          <p className="text-sm text-muted-foreground">{total} facture(s)</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher par numero, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payee</SelectItem>
              <SelectItem value="partial">Partielle</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="cancelled">Annulee</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Search size={14} className="mr-1.5" /> Rechercher
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucune facture trouvee.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium">N° Facture</th>
                    <th className="text-left px-4 py-3 font-medium">Client</th>
                    <th className="text-left px-4 py-3 font-medium">Expedition</th>
                    <th className="text-right px-4 py-3 font-medium">Montant</th>
                    <th className="text-center px-4 py-3 font-medium">Statut</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: InvoiceRow) => {
                    const st = STATUS_MAP[inv.status ?? ''] ?? { label: String(inv.status ?? ''), variant: 'outline' as const }
                    return (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                          {inv.invoice_number || `#${inv.id}`}
                        </td>
                        <td className="px-4 py-3">
                          {inv.user?.name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {inv.shipment_id ? (
                            <Link
                              to={`/shipments/${inv.shipment_id}`}
                              className="text-primary hover:underline text-xs font-mono"
                            >
                              {inv.shipment?.tracking_number || `EXP-${inv.shipment_id}`}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatMoney(Number(inv.amount || 0))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {inv.shipment_id && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/shipments/${inv.shipment_id}`}>
                                    <Eye size={14} className="mr-2" /> Voir expedition
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {inv.shipment_id && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    downloadApiPdf(
                                      `/api/shipments/${inv.shipment_id}/pdf/invoice`,
                                      `facture-${inv.invoice_number || inv.id}.pdf`,
                                    )
                                  }
                                >
                                  <Download size={14} className="mr-2" /> Telecharger PDF
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} sur {totalPages} ({total} resultat{total !== 1 ? 's' : ''})
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
