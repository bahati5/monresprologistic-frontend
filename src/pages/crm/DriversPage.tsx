import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDrivers, useCreateDriver, useUpdateDriver, useToggleDriverActive } from '@/hooks/useCrm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Truck, MoreHorizontal, Pencil, UserCheck, UserX,
  Phone, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'

export default function DriversPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useDrivers({ page, search: search || undefined })
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()
  const toggleStatus = useToggleDriverActive()

  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  const drivers = Array.isArray(data) ? data : data?.data || []
  const pagination = Array.isArray(data) ? {} : data || {}

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm({}); setFormOpen(true) }
  const openEdit = (d: any) => { setEditItem(d); setForm({ ...d }); setFormOpen(true) }

  const handleSubmit = () => {
    if (editItem) {
      updateDriver.mutate({ id: editItem.id, data: form }, { onSuccess: () => setFormOpen(false) })
    } else {
      createDriver.mutate(form as any, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chauffeurs</h1>
          <p className="text-sm text-muted-foreground">{(pagination as any).total ?? drivers.length} chauffeur(s)</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nouveau chauffeur</Button>
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
                  <th className="px-4 py-3 text-left font-medium">Chauffeur</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Telephone</th>
                  <th className="px-4 py-3 text-left font-medium">Vehicule</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">{[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                    ))}</tr>
                  ))
                ) : drivers.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center">
                    <Truck size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucun chauffeur</p>
                  </td></tr>
                ) : (
                  drivers.map((d: any) => (
                    <tr key={d.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{displayLocalized(d.name)}</td>
                      <td className="px-4 py-3 text-sm">{d.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {d.phone ? <span className="flex items-center gap-1"><Phone size={12} />{d.phone}</span> : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{d.vehicle_type || d.license_plate || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={d.is_active !== false ? 'default' : 'secondary'} className="text-xs">
                          {d.is_active !== false ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(d)}><Pencil size={14} className="mr-2" />Modifier</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStatus.mutate(d.id)}>
                              {d.is_active !== false ? <><UserX size={14} className="mr-2" />Desactiver</> : <><UserCheck size={14} className="mr-2" />Activer</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {((pagination as any).last_page ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{(pagination as any).from}-{(pagination as any).to} sur {(pagination as any).total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} className="mr-1" />Precedent</Button>
            <span className="text-sm text-muted-foreground px-2">{page} / {(pagination as any).last_page}</span>
            <Button variant="outline" size="sm" disabled={page >= ((pagination as any).last_page ?? 1)} onClick={() => setPage(page + 1)}>Suivant<ChevronRight size={14} className="ml-1" /></Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nom *</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telephone *</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
              <div className="space-y-2"><Label>Plaque immatriculation</Label><Input value={form.license_plate || ''} onChange={e => set('license_plate', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Type de vehicule</Label><Input value={form.vehicle_type || ''} onChange={e => set('vehicle_type', e.target.value)} placeholder="Camionnette, Moto..." /></div>
            {!editItem && (
              <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!form.name || createDriver.isPending || updateDriver.isPending}>
              {(createDriver.isPending || updateDriver.isPending) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
