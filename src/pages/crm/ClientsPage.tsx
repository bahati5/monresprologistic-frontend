import { useState, useEffect } from 'react'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { motion } from 'framer-motion'
import { useClients, useCreateClient, useUpdateClient, useToggleClientActive } from '@/hooks/useCrm'
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
  Plus, Search, Users, MoreHorizontal, Pencil, UserCheck, UserX,
  Mail, Phone, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'

const VIEW_KEY = 'clients-list-view'

export default function ClientsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useClients({ page, search: search || undefined })
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const toggleStatus = useToggleClientActive()

  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_KEY))

  useEffect(() => {
    saveViewMode(VIEW_KEY, viewMode)
  }, [viewMode])

  const clients = data?.data || []
  const pagination = data || {}

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm({}); setFormOpen(true) }
  const openEdit = (c: any) => { setEditItem(c); setForm({ ...c }); setFormOpen(true) }

  const handleSubmit = () => {
    if (editItem) {
      updateClient.mutate({ id: editItem.id, data: form }, { onSuccess: () => setFormOpen(false) })
    } else {
      createClient.mutate(form as any, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} client(s)</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nouveau client</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, email..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <ListCardsToggle mode={viewMode} onModeChange={setViewMode} />
      </div>

      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Telephone</th>
                    <th className="px-4 py-3 text-left font-medium">Locker</th>
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
                  ) : clients.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center">
                      <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Aucun client</p>
                    </td></tr>
                  ) : (
                    clients.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{displayLocalized(c.name)}</p>
                          {c.company && <p className="text-xs text-muted-foreground">{displayLocalized(c.company)}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm">{c.email || '-'}</td>
                        <td className="px-4 py-3 text-sm">{c.phone || '-'}</td>
                        <td className="px-4 py-3">
                          {c.locker_number ? <Badge variant="outline" className="text-xs font-mono">{c.locker_number}</Badge> : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-xs">
                            {c.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Pencil size={14} className="mr-2" />Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleStatus.mutate(c.id)}>
                                {c.is_active ? <><UserX size={14} className="mr-2" />Desactiver</> : <><UserCheck size={14} className="mr-2" />Activer</>}
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
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-2"><div className="h-4 w-32 animate-pulse rounded bg-muted" /></CardContent></Card>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucun client</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{displayLocalized(c.name)}</p>
                        {c.company ? <p className="text-xs text-muted-foreground">{displayLocalized(c.company)}</p> : null}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal size={14} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}><Pencil size={14} className="mr-2" />Modifier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleStatus.mutate(c.id)}>
                            {c.is_active ? <><UserX size={14} className="mr-2" />Desactiver</> : <><UserCheck size={14} className="mr-2" />Activer</>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {c.email ? (
                      <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Mail size={12} className="shrink-0" />{c.email}</p>
                    ) : null}
                    {c.phone ? (
                      <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><Phone size={12} className="shrink-0" />{c.phone}</p>
                    ) : null}
                    {(c.address || c.city) ? (
                      <p className="text-xs flex items-start gap-1.5 text-muted-foreground"><MapPin size={12} className="shrink-0 mt-0.5" />{[c.address, c.city, c.country].filter(Boolean).join(', ')}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {c.locker_number ? <Badge variant="outline" className="text-xs font-mono">Locker {c.locker_number}</Badge> : null}
                      <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-xs">{c.is_active ? 'Actif' : 'Inactif'}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {(pagination.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{pagination.from}-{pagination.to} sur {pagination.total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={14} className="mr-1" />Precedent
            </Button>
            <span className="text-sm text-muted-foreground px-2">{page} / {pagination.last_page}</span>
            <Button variant="outline" size="sm" disabled={page >= (pagination.last_page ?? 1)} onClick={() => setPage(page + 1)}>
              Suivant<ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editItem ? 'Mettre à jour la fiche client.' : 'Créer un nouveau client CRM.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nom *</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telephone</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
              <div className="space-y-2"><Label>Societe</Label><Input value={form.company || ''} onChange={e => set('company', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Adresse</Label><Input value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Ville</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
              <div className="space-y-2"><Label>Pays</Label><Input value={form.country || ''} onChange={e => set('country', e.target.value)} /></div>
            </div>
            {!editItem && (
              <div className="space-y-2"><Label>Mot de passe</Label><Input type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!form.name || createClient.isPending || updateClient.isPending}>
              {(createClient.isPending || updateClient.isPending) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
