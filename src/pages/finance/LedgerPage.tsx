import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/api/client'
import { useFormatMoney } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'

interface LedgerRow {
  id: number
  type: string
  amount: number
  currency?: string
  description?: string
  reference_type?: string
  reference_id?: number
  invoice_id?: number
  invoice?: { invoice_number?: string }
  created_at: string
}

function getMonthPresets() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const from = new Date(y, m, 1).toISOString().slice(0, 10)
  const to = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  return { from, to }
}

export default function LedgerPage() {
  const { formatMoney } = useFormatMoney()
  const defaults = getMonthPresets()
  const [dateFrom, setDateFrom] = useState(defaults.from)
  const [dateTo, setDateTo] = useState(defaults.to)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'ledger', { page, date_from: dateFrom, date_to: dateTo, type: typeFilter || undefined }],
    queryFn: () => api.get('/api/finance/ledger', {
      params: { page, per_page: 40, date_from: dateFrom || undefined, date_to: dateTo || undefined, type: typeFilter || undefined },
    }).then(r => r.data),
  })

  const entries: LedgerRow[] = data?.entries?.data ?? []
  const pagination = data?.entries ?? {}
  const totalPages = pagination.last_page ?? 1

  const totalDebit = entries
    .filter(e => Number(e.amount) < 0)
    .reduce((s, e) => s + Math.abs(Number(e.amount)), 0)
  const totalCredit = entries
    .filter(e => Number(e.amount) > 0)
    .reduce((s, e) => s + Number(e.amount), 0)
  const solde = totalCredit - totalDebit

  const setPresetMonth = (offset: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() + offset)
    const y = d.getFullYear()
    const m = d.getMonth()
    setDateFrom(new Date(y, m, 1).toISOString().slice(0, 10))
    setDateTo(new Date(y, m + 1, 0).toISOString().slice(0, 10))
    setPage(1)
  }

  const exportUrl = `/api/finance/ledger/export?date_from=${dateFrom}&date_to=${dateTo}${typeFilter ? `&type=${typeFilter}` : ''}`

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen size={24} /> Grand Livre
          </h1>
          <p className="text-sm text-muted-foreground">Comptabilité — Suivi des transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={exportUrl} target="_blank" rel="noopener">
              <Download size={14} className="mr-1.5" /> Exporter CSV
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Solde */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-950/30">
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground mb-1">Solde période</p>
            <p className={`text-3xl font-bold tabular-nums ${solde >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {solde >= 0 ? '+ ' : '- '}{formatMoney(Math.abs(solde))}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-end gap-4">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPresetMonth(0)}>Ce mois</Button>
          <Button size="sm" variant="outline" onClick={() => setPresetMonth(-1)}>Mois dernier</Button>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Du</Label>
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="h-8 text-sm w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Au</Label>
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="h-8 text-sm w-36" />
        </div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Tous types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="payment">Encaissement</SelectItem>
            <SelectItem value="refund">Remboursement</SelectItem>
            <SelectItem value="credit_note">Avoir</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
            Aucune écriture pour cette période.
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
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium">Référence</th>
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                      <th className="text-right px-4 py-3 font-medium text-red-600">Débit</th>
                      <th className="text-right px-4 py-3 font-medium text-emerald-600">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(entry => {
                      const amount = Number(entry.amount)
                      const isDebit = amount < 0
                      return (
                        <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize text-xs font-medium">{entry.type?.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {entry.invoice?.invoice_number || (entry.reference_type ? `${entry.reference_type?.split('\\').pop()}-${entry.reference_id}` : '—')}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                            {entry.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-red-600">
                            {isDebit ? formatMoney(Math.abs(amount)) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-600">
                            {!isDebit ? formatMoney(amount) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/20 font-semibold">
                      <td colSpan={4} className="px-4 py-3 text-right">TOTAUX</td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600">{formatMoney(totalDebit)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{formatMoney(totalCredit)}</td>
                    </tr>
                    <tr className="bg-muted/30 font-bold">
                      <td colSpan={4} className="px-4 py-3 text-right">SOLDE NET</td>
                      <td colSpan={2} className={`px-4 py-3 text-right tabular-nums ${solde >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatMoney(Math.abs(solde))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-3 md:hidden">
            {entries.map((entry) => {
              const amount = Number(entry.amount)
              const isDebit = amount < 0
              return (
                <Card key={entry.id}>
                  <CardContent className="space-y-2 p-4 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="capitalize text-xs font-medium">{entry.type?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="font-mono text-xs break-all">
                      {entry.invoice?.invoice_number || (entry.reference_type ? `${entry.reference_type?.split('\\').pop()}-${entry.reference_id}` : '—')}
                    </p>
                    <p className="text-xs text-muted-foreground break-words">{entry.description || '—'}</p>
                    <dl className="grid grid-cols-2 gap-2 border-t pt-2 text-sm">
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Débit</dt>
                        <dd className="font-medium tabular-nums text-red-600">{isDebit ? formatMoney(Math.abs(amount)) : '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Crédit</dt>
                        <dd className="font-medium tabular-nums text-emerald-600">{!isDebit ? formatMoney(amount) : '—'}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )
            })}
            <Card className="border-t-2">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Total débits</span>
                  <span className="tabular-nums text-red-600">{formatMoney(totalDebit)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total crédits</span>
                  <span className="tabular-nums text-emerald-600">{formatMoney(totalCredit)}</span>
                </div>
                <div className={`flex justify-between border-t pt-2 font-bold ${solde >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  <span>Solde net</span>
                  <span className="tabular-nums">{formatMoney(Math.abs(solde))}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} / {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
