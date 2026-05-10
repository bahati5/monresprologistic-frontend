import { useState, useEffect } from 'react'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { motion } from 'framer-motion'
import { useUsers, useCreateUser, useUpdateUser, useToggleUserActive } from '@/hooks/useCrm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, Users, MoreHorizontal, Pencil, UserCheck, UserX,
  Shield, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import type { User, UserCreatePayload } from '@/types/crm'

interface UserRow {
  id: number
  name?: unknown
  email?: string
  role?: string
  roles?: { name?: string }[]
  is_active?: boolean
  created_at?: string
  [key: string]: unknown
}

interface UsersListPayload {
  data?: UserRow[]
  total?: number
  last_page?: number
  from?: number
  to?: number
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  employee: 'Employe',
  client: 'Client',
  driver: 'Chauffeur',
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#dc2626',
  employee: '#2563eb',
  client: '#059669',
  driver: '#d97706',
}

const VIEW_KEY = 'users-list-view'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isLoading } = useUsers({ page, search: search || undefined })
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const toggleStatus = useToggleUserActive()

  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<UserRow | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_KEY))

  useEffect(() => {
    saveViewMode(VIEW_KEY, viewMode)
  }, [viewMode])

  const users: UserRow[] = (data?.data ?? []) as unknown as UserRow[]
  const pagination = (data || {}) as UsersListPayload

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm({ role: 'employee' }); setFormOpen(true) }
  const openEdit = (u: UserRow) => { setEditItem(u); setForm({ ...u, role: u.roles?.[0]?.name || u.role || 'employee' }); setFormOpen(true) }

  const handleSubmit = () => {
    if (editItem) {
      updateUser.mutate({ id: editItem.id, data: form as Partial<User> }, { onSuccess: () => setFormOpen(false) })
    } else {
      createUser.mutate(form as unknown as UserCreatePayload, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} utilisateur(s)</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nouvel utilisateur</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
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
                    <th className="px-4 py-3 text-left font-medium">Nom</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                    <th className="px-4 py-3 text-left font-medium">Inscription</th>
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
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center">
                      <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Aucun utilisateur</p>
                    </td></tr>
                  ) : (
                    users.map((u) => {
                      const role = u.roles?.[0]?.name || u.role || 'client'
                      const roleColor = ROLE_COLORS[role] || '#64748B'
                      return (
                        <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{displayLocalized(u.name)}</td>
                          <td className="px-4 py-3 text-sm">{u.email}</td>
                          <td className="px-4 py-3">
                            <Badge className="text-xs" style={{ backgroundColor: roleColor + '20', color: roleColor, borderColor: roleColor + '40' }}>
                              <Shield size={10} className="mr-1" />{ROLE_LABELS[role] || role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.is_active !== false ? 'default' : 'secondary'} className="text-xs">
                              {u.is_active !== false ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(u)}><Pencil size={14} className="mr-2" />Modifier</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleStatus.mutate(u.id)}>
                                  {u.is_active !== false ? <><UserX size={14} className="mr-2" />Desactiver</> : <><UserCheck size={14} className="mr-2" />Activer</>}
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
      ) : (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-2"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></CardContent></Card>
              ))}
            </div>
          ) : users.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucun utilisateur</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => {
                const role = u.roles?.[0]?.name || u.role || 'client'
                const roleColor = ROLE_COLORS[role] || '#64748B'
                return (
                  <Card key={u.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{displayLocalized(u.name)}</p>
                          <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal size={14} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(u)}><Pencil size={14} className="mr-2" />Modifier</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStatus.mutate(u.id)}>
                              {u.is_active !== false ? <><UserX size={14} className="mr-2" />Desactiver</> : <><UserCheck size={14} className="mr-2" />Activer</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Badge className="text-xs w-fit" style={{ backgroundColor: roleColor + '20', color: roleColor, borderColor: roleColor + '40' }}>
                        <Shield size={10} className="mr-1" />{ROLE_LABELS[role] || role}
                      </Badge>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={u.is_active !== false ? 'default' : 'secondary'} className="text-xs">
                          {u.is_active !== false ? 'Actif' : 'Inactif'}
                        </Badge>
                        <span className="text-xs text-muted-foreground self-center">
                          Inscrit le {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

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
            <DialogTitle>{editItem ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editItem ? 'Modifier les informations du compte utilisateur.' : 'Créer un nouveau compte utilisateur.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nom *</Label><Input value={String(form.name ?? '')} onChange={e => set('name', e.target.value)} /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={String(form.email ?? '')} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Telephone</Label><Input value={String(form.phone ?? '')} onChange={e => set('phone', e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={String(form.role ?? 'employee')} onValueChange={v => set('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="employee">Employe</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="driver">Chauffeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editItem && (
              <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={String(form.password ?? '')} onChange={e => set('password', e.target.value)} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.email || createUser.isPending || updateUser.isPending}>
              {(createUser.isPending || updateUser.isPending) ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
