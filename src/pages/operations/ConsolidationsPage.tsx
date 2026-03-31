import { useState } from 'react'
import { motion } from 'framer-motion'
import { useConsolidations, useCreateConsolidation, useUpdateConsolidationStatus } from '@/hooks/useOperations'
import { STATUS_COLORS } from '@/lib/animations'
import { displayLocalized } from '@/lib/localizedString'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, Package, MoreHorizontal, RefreshCw, Layers } from 'lucide-react'

export default function ConsolidationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useConsolidations({ page, search: search || undefined })
  const createConsolidation = useCreateConsolidation()
  const updateStatus = useUpdateConsolidationStatus()

  const [createOpen, setCreateOpen] = useState(false)
  const [statusDialog, setStatusDialog] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [form, setForm] = useState<Record<string, any>>({})

  const items = data?.data || []
  const pagination = data || {}

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleCreate = () => {
    createConsolidation.mutate(form as any, {
      onSuccess: () => { setCreateOpen(false); setForm({}) },
    })
  }

  const handleUpdateStatus = () => {
    if (!statusDialog || !selectedStatus) return
    updateStatus.mutate(
      { id: statusDialog, status_id: Number(selectedStatus) },
      { onSuccess: () => { setStatusDialog(null); setSelectedStatus('') } },
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consolidations</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} consolidation(s)</p>
        </div>
        <Button onClick={() => { setForm({}); setCreateOpen(true) }}>
          <Plus size={16} className="mr-1.5" />Nouvelle consolidation
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Reference</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Expeditions</th>
                  <th className="px-4 py-3 text-left font-medium">Poids total</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">{[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    ))}</tr>
                  ))
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <Layers size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucune consolidation</p>
                  </td></tr>
                ) : (
                  items.map((c: any) => {
                    const stColor = STATUS_COLORS[c.status?.code] || c.status?.color || '#64748B'
                    return (
                      <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">#{c.id}</td>
                        <td className="px-4 py-3 font-medium">{c.reference || '-'}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{c.type || 'standard'}</Badge></td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            <Package size={10} className="mr-1" />{c.shipments_count ?? c.shipments?.length ?? 0}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{c.total_weight ? `${c.total_weight} kg` : '-'}</td>
                        <td className="px-4 py-3">
                          <Badge className="text-xs" style={{ backgroundColor: stColor + '20', color: stColor, borderColor: stColor + '40' }}>
                            {displayLocalized(c.status?.name)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setStatusDialog(c.id); setSelectedStatus('') }}>
                                <RefreshCw size={14} className="mr-2" />Changer statut
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

      {(pagination.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
          <span className="text-sm text-muted-foreground">{page} / {pagination.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= (pagination.last_page ?? 1)} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle consolidation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type || 'standard'} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="groupage">Groupage</SelectItem>
                  <SelectItem value="container">Container</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Reference</Label><Input value={form.reference || ''} onChange={e => set('reference', e.target.value)} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createConsolidation.isPending}>{createConsolidation.isPending ? 'Creation...' : 'Creer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Changer le statut</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger><SelectValue placeholder="Nouveau statut..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Brouillon</SelectItem>
                <SelectItem value="2">En preparation</SelectItem>
                <SelectItem value="3">Scellee</SelectItem>
                <SelectItem value="4">En transit</SelectItem>
                <SelectItem value="5">Arrivee</SelectItem>
                <SelectItem value="6">Terminee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Annuler</Button>
            <Button onClick={handleUpdateStatus} disabled={!selectedStatus || updateStatus.isPending}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
