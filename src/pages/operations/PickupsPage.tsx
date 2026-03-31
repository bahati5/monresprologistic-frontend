import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePickups, useCreatePickup, useAssignPickupDriver, useUpdatePickupStatus } from '@/hooks/useOperations'
import { useAssignableDrivers } from '@/hooks/useCrm'
import { useSearchClients } from '@/hooks/useShipments'
import { STATUS_COLORS } from '@/lib/animations'
import { displayLocalized } from '@/lib/localizedString'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Package, MoreHorizontal, UserPlus, RefreshCw, MapPin, Calendar, Truck,
} from 'lucide-react'

export default function PickupsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = usePickups({ page, search: search || undefined })
  const createPickup = useCreatePickup()
  const assignDriver = useAssignPickupDriver()
  const updateStatus = useUpdatePickupStatus()
  const { data: driversRaw } = useAssignableDrivers()
  const { data: clientsRaw } = useSearchClients('')

  const [createOpen, setCreateOpen] = useState(false)
  const [driverDialog, setDriverDialog] = useState<number | null>(null)
  const [statusDialog, setStatusDialog] = useState<number | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [form, setForm] = useState<Record<string, any>>({})

  const pickups = data?.data || []
  const pagination = data || {}
  const driverList = driversRaw ?? []
  const clientList = Array.isArray(clientsRaw) ? clientsRaw : (clientsRaw as any)?.clients || []

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleCreate = () => {
    createPickup.mutate(form as any, {
      onSuccess: () => { setCreateOpen(false); setForm({}) },
    })
  }

  const handleAssignDriver = () => {
    if (!driverDialog || !selectedDriverId) return
    assignDriver.mutate(
      { id: driverDialog, driver_id: Number(selectedDriverId) },
      { onSuccess: () => { setDriverDialog(null); setSelectedDriverId('') } },
    )
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
          <h1 className="text-2xl font-bold tracking-tight">Ramassages</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} ramassage(s)</p>
        </div>
        <Button onClick={() => { setForm({}); setCreateOpen(true) }}>
          <Plus size={16} className="mr-1.5" />Nouveau ramassage
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
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Adresse</th>
                  <th className="px-4 py-3 text-left font-medium">Chauffeur</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-left font-medium">Date prevue</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">{[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    ))}</tr>
                  ))
                ) : pickups.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center">
                    <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucun ramassage</p>
                  </td></tr>
                ) : (
                  pickups.map((p: any) => {
                    const stColor = STATUS_COLORS[p.status?.code] || p.status?.color || '#64748B'
                    return (
                      <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">#{p.id}</td>
                        <td className="px-4 py-3 font-medium">{displayLocalized(p.client?.name || p.user?.name)}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1"><MapPin size={12} className="text-muted-foreground" />{p.address || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          {p.driver ? (
                            <Badge variant="outline" className="text-xs"><Truck size={10} className="mr-1" />{displayLocalized(p.driver.name)}</Badge>
                          ) : <span className="text-xs text-muted-foreground">Non assigne</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="text-xs" style={{ backgroundColor: stColor + '20', color: stColor, borderColor: stColor + '40' }}>
                            {displayLocalized(p.status?.name)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setDriverDialog(p.id); setSelectedDriverId('') }}>
                                <UserPlus size={14} className="mr-2" />Assigner chauffeur
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setStatusDialog(p.id); setSelectedStatus('') }}>
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

      {/* Create Pickup Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau ramassage</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={String(form.client_id || '')} onValueChange={v => set('client_id', Number(v))}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>{clientList.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{displayLocalized(c.name)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Adresse de collecte</Label>
              <Input value={form.address || ''} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Ville</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
              <div className="space-y-2"><Label>Date prevue</Label><Input type="date" value={form.scheduled_at || ''} onChange={e => set('scheduled_at', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createPickup.isPending}>{createPickup.isPending ? 'Creation...' : 'Creer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={!!driverDialog} onOpenChange={() => setDriverDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un chauffeur</DialogTitle>
            <DialogDescription className="sr-only">Choisissez le chauffeur à assigner à ce ramassage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger><SelectValue placeholder="Choisir un chauffeur..." /></SelectTrigger>
              <SelectContent>{driverList.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{displayLocalized(d.name)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialog(null)}>Annuler</Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriverId || assignDriver.isPending}>Assigner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription className="sr-only">Sélectionnez le nouveau statut du ramassage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger><SelectValue placeholder="Nouveau statut..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">En attente</SelectItem>
                <SelectItem value="2">Assigne</SelectItem>
                <SelectItem value="3">En cours</SelectItem>
                <SelectItem value="4">Termine</SelectItem>
                <SelectItem value="5">Annule</SelectItem>
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
