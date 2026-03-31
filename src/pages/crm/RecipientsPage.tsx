import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRecipients, useCreateRecipient, useUpdateRecipient, useDeleteRecipient } from '@/hooks/useCrm'
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
  Plus, Search, MapPin, MoreHorizontal, Pencil, Trash2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'

export default function RecipientsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useRecipients({ page, search: search || undefined })
  const createRecipient = useCreateRecipient()
  const updateRecipient = useUpdateRecipient()
  const deleteRecipient = useDeleteRecipient()

  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  const recipients = data?.data || []
  const pagination = (data || {}) as any

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm({}); setFormOpen(true) }
  const openEdit = (r: any) => { setEditItem(r); setForm({ ...r }); setFormOpen(true) }

  const handleSubmit = () => {
    if (editItem) {
      updateRecipient.mutate({ id: editItem.id, data: form }, { onSuccess: () => setFormOpen(false) })
    } else {
      createRecipient.mutate(form as any, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Destinataires</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} destinataire(s)</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nouveau destinataire</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, ville..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Nom</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Telephone</th>
                  <th className="px-4 py-3 text-left font-medium">Ville</th>
                  <th className="px-4 py-3 text-left font-medium">Pays</th>
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
                ) : recipients.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center">
                    <MapPin size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Aucun destinataire</p>
                  </td></tr>
                ) : (
                  recipients.map((r: any) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{displayLocalized(r.name)}</td>
                      <td className="px-4 py-3 text-sm">{r.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">{r.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm">{r.city || '-'}</td>
                      <td className="px-4 py-3">
                        {r.country ? <Badge variant="outline" className="text-xs">{r.country}</Badge> : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(r)}><Pencil size={14} className="mr-2" />Modifier</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteRecipient.mutate(r.id)}>
                              <Trash2 size={14} className="mr-2" />Supprimer
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
            <DialogTitle>{editItem ? 'Modifier le destinataire' : 'Nouveau destinataire'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editItem ? 'Mettre à jour les coordonnées du destinataire.' : 'Créer un destinataire dans le CRM.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nom *</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telephone *</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
              <div className="space-y-2"><Label>Ville</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Adresse</Label><Input value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
            <div className="space-y-2"><Label>Pays</Label><Input value={form.country || ''} onChange={e => set('country', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!form.name || createRecipient.isPending || updateRecipient.isPending}>
              {(createRecipient.isPending || updateRecipient.isPending) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
