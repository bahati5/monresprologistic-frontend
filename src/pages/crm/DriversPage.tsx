import { useState, useEffect } from 'react'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { motion } from 'framer-motion'
import { useDrivers, useCreateDriver, useUpdateDriver, useToggleDriverActive } from '@/hooks/useCrm'
import type { Driver, DriverCreatePayload } from '@/types/crm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Truck, MoreHorizontal, Pencil, UserCheck, UserX,
  Phone, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'

interface DriverRow {
  id: number
  name?: unknown
  email?: string | null
  phone?: string | null
  vehicle_type?: string | null
  license_plate?: string | null
  is_active?: boolean
  [key: string]: unknown
}

interface DriversListPayload {
  data?: DriverRow[]
  total?: number
  last_page?: number
  from?: number
  to?: number
}

const VIEW_KEY = 'drivers-list-view'

export default function DriversPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useDrivers({ page, search: search || undefined })
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()
  const toggleStatus = useToggleDriverActive()

  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<DriverRow | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_KEY))

  useEffect(() => {
    saveViewMode(VIEW_KEY, viewMode)
  }, [viewMode])

  const drivers: DriverRow[] = (Array.isArray(data) ? data : data?.data ?? []) as DriverRow[]
  const pagination = (Array.isArray(data) ? {} : data) as DriversListPayload

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm({}); setFormOpen(true) }
  const openEdit = (d: DriverRow) => { setEditItem(d); setForm({ ...d }); setFormOpen(true) }

  const handleSubmit = () => {
    if (editItem) {
      const dataPayload: Partial<Driver> = {
        name: form.name != null ? String(form.name) : undefined,
        email: form.email != null ? String(form.email) : undefined,
        phone: form.phone != null ? String(form.phone) : undefined,
        vehicle_type: form.vehicle_type != null ? String(form.vehicle_type) : undefined,
        vehicle_plate: form.license_plate != null ? String(form.license_plate) : undefined,
      }
      updateDriver.mutate({ id: editItem.id, data: dataPayload }, { onSuccess: () => setFormOpen(false) })
    } else {
      const pwd = String(form.password ?? '')
      const payload: DriverCreatePayload = {
        name: String(form.name ?? ''),
        email: String(form.email ?? ''),
        phone: form.phone != null ? String(form.phone) : undefined,
        password: pwd,
        password_confirmation: pwd,
        vehicle_type: form.vehicle_type != null ? String(form.vehicle_type) : undefined,
        vehicle_plate: form.license_plate != null ? String(form.license_plate) : undefined,
      }
      createDriver.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chauffeurs</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? drivers.length} chauffeur(s)</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nouveau chauffeur</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <ListCardsToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {viewMode === 'list' && (
        <Card className="hidden md:block">
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
                    drivers.map((d) => (
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
      )}

      <div className={viewMode === 'list' ? 'md:hidden' : undefined}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-2"><div className="h-4 w-32 animate-pulse rounded bg-muted" /></CardContent></Card>
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Truck size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucun chauffeur</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{displayLocalized(d.name)}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal size={14} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(d)}><Pencil size={14} className="mr-2" />Modifier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleStatus.mutate(d.id)}>
                            {d.is_active !== false ? <><UserX size={14} className="mr-2" />Desactiver</> : <><UserCheck size={14} className="mr-2" />Activer</>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {d.email ? <p className="text-xs text-muted-foreground break-all">{d.email}</p> : null}
                    {d.phone ? <p className="text-xs flex items-center gap-1 text-muted-foreground"><Phone size={12} />{d.phone}</p> : null}
                    <p className="text-xs text-muted-foreground">
                      Véhicule : {d.vehicle_type || d.license_plate || '—'}
                    </p>
                    <Badge variant={d.is_active !== false ? 'default' : 'secondary'} className="text-xs w-fit">
                      {d.is_active !== false ? 'Actif' : 'Inactif'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>

      {(pagination.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{pagination.from}-{pagination.to} sur {pagination.total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} className="mr-1" />Precedent</Button>
            <span className="text-sm text-muted-foreground px-2">{page} / {pagination.last_page}</span>
            <Button variant="outline" size="sm" disabled={page >= (pagination.last_page ?? 1)} onClick={() => setPage(page + 1)}>Suivant<ChevronRight size={14} className="ml-1" /></Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editItem ? 'Mettre à jour le profil chauffeur.' : 'Ajouter un chauffeur au CRM.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nom *</Label><Input value={String(form.name ?? '')} onChange={e => set('name', e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={String(form.email ?? '')} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telephone *</Label><Input value={String(form.phone ?? '')} onChange={e => set('phone', e.target.value)} /></div>
              <div className="space-y-2"><Label>Plaque immatriculation</Label><Input value={String(form.license_plate ?? '')} onChange={e => set('license_plate', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Type de vehicule</Label><Input value={String(form.vehicle_type ?? '')} onChange={e => set('vehicle_type', e.target.value)} placeholder="Camionnette, Moto..." /></div>
            {!editItem && (
              <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={String(form.password ?? '')} onChange={e => set('password', e.target.value)} /></div>
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
