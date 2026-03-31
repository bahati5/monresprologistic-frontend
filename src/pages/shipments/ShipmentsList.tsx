import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useShipments } from '@/hooks/useShipments'
import { statusHooks } from '@/hooks/useSettings'
import { STATUS_COLORS } from '@/lib/animations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Eye, MoreHorizontal, FileText, Printer,
  Copy, Package, Truck, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { displayLocalized } from '@/lib/localizedString'
import { openApiPdf } from '@/lib/openPdf'

export default function ShipmentsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || '1')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status_id') || '')

  const filters = {
    page,
    per_page: 25,
    search: searchParams.get('search') || undefined,
    status_id: statusFilter ? Number(statusFilter) : undefined,
  }

  const { data, isLoading } = useShipments(filters)
  const { data: allStatuses } = statusHooks.useList()

  const shipments = data?.data || []
  const pagination = data || {}
  const shipmentStatuses = (allStatuses || []).filter((st: any) => st.entity_type === 'shipment')

  const doSearch = () => {
    const p: Record<string, string> = { page: '1' }
    if (search) p.search = search
    if (statusFilter) p.status_id = statusFilter
    setSearchParams(p)
  }

  const goPage = (p: number) => {
    const params: Record<string, string> = { page: String(p) }
    if (search) params.search = search
    if (statusFilter) params.status_id = statusFilter
    setSearchParams(params)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expeditions</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} expedition(s) au total</p>
        </div>
        <Link to="/shipments/create">
          <Button><Plus size={16} className="mr-1.5" />Nouvelle expedition</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par tracking, client..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setTimeout(doSearch, 0) }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {shipmentStatuses.map((st: any) => (
              <SelectItem key={st.id} value={String(st.id)}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                  {displayLocalized(st.name)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={doSearch}>Rechercher</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Tracking</th>
                  <th className="px-4 py-3 text-left font-medium">Expediteur</th>
                  <th className="px-4 py-3 text-left font-medium">Destinataire</th>
                  <th className="px-4 py-3 text-left font-medium">Mode</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                      ))}
                    </tr>
                  ))
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Aucune expedition trouvee</p>
                    </td>
                  </tr>
                ) : (
                  shipments.map((s: any) => {
                    const stCode = s.status?.code || ''
                    const stColor = STATUS_COLORS[stCode] || s.status?.color_hex || s.status?.color || '#64748B'
                    const tracking = s.tracking_number || s.public_tracking
                    const senderLabel =
                      s.sender_name
                      || s.sender?.name
                      || s.sender_client?.display_name
                      || s.client?.name
                      || [s.sender_client?.first_name, s.sender_client?.last_name].filter(Boolean).join(' ')
                    const recipientLabel =
                      s.recipient_name
                      || s.delivery_recipient?.name
                      || s.recipient?.name
                    const recipientCity =
                      s.recipient_city
                      || s.delivery_recipient?.city
                    const modeLabel = s.shipping_mode ?? s.service_type?.name
                    const amount = s.total ?? s.calculated_price
                    return (
                      <tr key={s.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate(`/shipments/${s.id}`)}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium">{tracking || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{displayLocalized(senderLabel)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{displayLocalized(recipientLabel)}</p>
                          {recipientCity ? <p className="text-xs text-muted-foreground">{recipientCity}</p> : null}
                        </td>
                        <td className="px-4 py-3">
                          {modeLabel ? (
                            <Badge variant="outline" className="text-xs"><Truck size={10} className="mr-1" />{displayLocalized(modeLabel)}</Badge>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className="text-xs font-semibold"
                            style={{ backgroundColor: stColor + '20', color: stColor, borderColor: stColor + '40' }}
                          >
                            {displayLocalized(s.status?.name)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {amount != null && amount !== ''
                            ? `${Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${s.currency ? ` ${s.currency}` : ''}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(s.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/shipments/${s.id}`)}>
                                <Eye size={14} className="mr-2" />Voir detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(String(tracking || '')); toast.success('Copie') }}>
                                <Copy size={14} className="mr-2" />Copier tracking
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void openApiPdf(`/api/shipments/${s.id}/pdf/invoice`)}>
                                <FileText size={14} className="mr-2" />PDF Facture
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void openApiPdf(`/api/shipments/${s.id}/pdf/label`)}>
                                <Printer size={14} className="mr-2" />PDF Etiquette
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination + plage (toujours si total connu) */}
      {(pagination.total ?? 0) > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {(pagination.from ?? 1)}–{(pagination.to ?? shipments.length)} sur {pagination.total}
            {(pagination.last_page ?? 1) > 1 && ` · Page ${page} / ${pagination.last_page}`}
          </p>
          {(pagination.last_page ?? 1) > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                <ChevronLeft size={14} className="mr-1" />Precedent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= (pagination.last_page ?? 1)} onClick={() => goPage(page + 1)}>
                Suivant<ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
