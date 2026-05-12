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
  ChevronLeft, ChevronRight, FileText, Plus, AlertTriangle,
} from 'lucide-react'

const STATUS_TABS = [
  { value: '', label: 'Toutes', color: '' },
  { value: 'pending', label: 'En attente', color: 'text-amber-600' },
  { value: 'paid', label: 'Payées', color: 'text-emerald-600' },
  { value: 'overdue', label: 'En retard', color: 'text-red-600' },
  { value: 'cancelled', label: 'Annulées', color: 'text-gray-500' },
]

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon?: string }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  pending: { label: 'En attente', variant: 'outline', icon: '⏳' },
  sent: { label: 'Envoyée', variant: 'default' },
  paid: { label: 'Payée', variant: 'default', icon: '✅' },
  partial: { label: 'Partielle', variant: 'outline' },
  overdue: { label: 'En retard', variant: 'destructive', icon: '❌' },
  cancelled: { label: 'Annulée', variant: 'secondary' },
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
  due_at?: string
  paid_at?: string
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

  const kpiInvoiced = invoices.reduce((s: number, i: InvoiceRow) => s + Number(i.amount || 0), 0)
  const kpiPaid = invoices.filter((i: InvoiceRow) => i.status === 'paid').reduce((s: number, i: InvoiceRow) => s + Number(i.amount || 0), 0)
  const kpiPending = invoices.filter((i: InvoiceRow) => !['paid', 'cancelled', 'draft'].includes(i.status ?? '')).reduce((s: number, i: InvoiceRow) => s + Number(i.amount || 0), 0)

  const isOverdue = (inv: InvoiceRow) => {
    if (!inv.due_at || inv.status === 'paid' || inv.status === 'cancelled') return false
    return new Date(inv.due_at) < new Date()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt size={24} /> Facturation
          </h1>
          <p className="text-sm text-muted-foreground">{total} facture(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/finance/ledger/export" target="_blank" rel="noopener"><FileText size={14} className="mr-1.5" /> Exporter</a>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Facturé', value: formatMoney(kpiInvoiced), color: 'text-foreground', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Encaissé', value: formatMoney(kpiPaid), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'En attente', value: formatMoney(kpiPending), color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
        ].map(k => (
          <Card key={k.label} className={k.bg}>
            <CardContent className="py-5 text-center">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
          >
            <span className={statusFilter !== tab.value ? tab.color : ''}>{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par numéro, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          />
        </div>
      </div>

      {/* Invoice table */}
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
            <p className="text-muted-foreground">Aucune facture trouvée.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium">N° Facture</th>
                      <th className="text-left px-4 py-3 font-medium">Client</th>
                      <th className="text-left px-4 py-3 font-medium">Expédition</th>
                      <th className="text-right px-4 py-3 font-medium">Montant</th>
                      <th className="text-center px-4 py-3 font-medium">Statut</th>
                      <th className="text-left px-4 py-3 font-medium">Échéance</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: InvoiceRow) => {
                      const st = STATUS_MAP[inv.status ?? ''] ?? { label: String(inv.status ?? ''), variant: 'outline' as const }
                      const overdue = isOverdue(inv)
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
                            <Badge variant={st.variant}>
                              {st.icon && <span className="mr-1">{st.icon}</span>}{st.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {inv.due_at ? (
                              <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                                {overdue && <AlertTriangle className="h-3 w-3" />}
                                {new Date(inv.due_at).toLocaleDateString('fr-FR')}
                              </span>
                            ) : '—'}
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
                                      <Eye size={14} className="mr-2" /> Voir expédition
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
                                    <Download size={14} className="mr-2" /> Télécharger PDF
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

          <div className="min-w-0 space-y-3 md:hidden">
            {invoices.map((inv: InvoiceRow) => {
              const st = STATUS_MAP[inv.status ?? ''] ?? { label: String(inv.status ?? ''), variant: 'outline' as const }
              const overdue = isOverdue(inv)
              return (
                <Card key={inv.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-semibold">{inv.invoice_number || `#${inv.id}`}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" aria-label="Actions facture">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {inv.shipment_id && (
                            <DropdownMenuItem asChild>
                              <Link to={`/shipments/${inv.shipment_id}`}>
                                <Eye size={14} className="mr-2" /> Voir expédition
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
                              <Download size={14} className="mr-2" /> Télécharger PDF
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Client</dt>
                        <dd className="break-words font-medium">{inv.user?.name || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Expédition</dt>
                        <dd>
                          {inv.shipment_id ? (
                            <Link
                              to={`/shipments/${inv.shipment_id}`}
                              className="text-primary text-xs font-mono hover:underline break-all"
                            >
                              {inv.shipment?.tracking_number || `EXP-${inv.shipment_id}`}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Montant</dt>
                        <dd className="font-semibold tabular-nums">{formatMoney(Number(inv.amount || 0))}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Statut</dt>
                        <dd>
                          <Badge variant={st.variant}>
                            {st.icon && <span className="mr-1">{st.icon}</span>}
                            {st.label}
                          </Badge>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Échéance</dt>
                        <dd className="text-xs">
                          {inv.due_at ? (
                            <span className={`inline-flex items-center gap-1 ${overdue ? 'font-semibold text-red-600' : 'text-muted-foreground'}`}>
                              {overdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                              {new Date(inv.due_at).toLocaleDateString('fr-FR')}
                            </span>
                          ) : (
                            '—'
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Date</dt>
                        <dd className="text-xs text-muted-foreground">
                          {inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '—'}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} sur {totalPages} ({total} résultat{total !== 1 ? 's' : ''})
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
