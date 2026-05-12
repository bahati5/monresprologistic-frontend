import { useState, useEffect } from 'react'
import { ListCardsToggle } from '@/components/common/ListCardsToggle'
import { loadViewMode, saveViewMode, type ListOrCards } from '@/lib/listViewMode'
import { motion } from 'framer-motion'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
  useResetUserPassword,
} from '@/hooks/useCrm'
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
  Shield, ChevronLeft, ChevronRight, KeyRound, UserCog, Copy, FilterX,
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import { toast } from 'sonner'
import type { User, UserCreatePayload } from '@/types/crm'

interface UserRow {
  uuid: string
  name?: unknown
  email?: string
  phone?: string | null
  role?: string
  roles?: { uuid?: string; name?: string; code?: string }[]
  is_active?: boolean
  agency_uuid?: string | null
  agency_name?: string | null
  created_at?: string
  [key: string]: unknown
}

interface UsersListPayload {
  data?: UserRow[]
  total?: number
  last_page?: number
  from?: number | null
  to?: number | null
  agencies?: { uuid: string; name: string }[]
  availableRoles?: string[]
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super administrateur',
  agency_admin: 'Administrateur agence',
  operator: 'Opérateur',
  driver: 'Chauffeur',
  customs_agent: 'Agent douanes',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#7c3aed',
  agency_admin: '#dc2626',
  operator: '#2563eb',
  driver: '#d97706',
  customs_agent: '#0d9488',
}

const VIEW_KEY = 'users-list-view'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [agencyFilter, setAgencyFilter] = useState<string>('')
  const listParams = {
    page,
    search: search.trim() || undefined,
    role: roleFilter && roleFilter !== '__all__' ? roleFilter : undefined,
    agency_uuid:
      agencyFilter && agencyFilter !== '__all__' ? agencyFilter : undefined,
  }
  const { data, isLoading } = useUsers(listParams)
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const toggleStatus = useToggleUserActive()
  const resetPassword = useResetUserPassword()

  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<UserRow | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [viewMode, setViewMode] = useState<ListOrCards>(() => loadViewMode(VIEW_KEY))

  const [pwdUser, setPwdUser] = useState<UserRow | null>(null)
  const [pwd, setPwd] = useState({ password: '', password_confirmation: '' })

  const [roleUser, setRoleUser] = useState<UserRow | null>(null)
  const [quickRole, setQuickRole] = useState('')

  useEffect(() => {
    saveViewMode(VIEW_KEY, viewMode)
  }, [viewMode])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter, agencyFilter])

  const users: UserRow[] = (data?.data ?? []) as unknown as UserRow[]
  const pagination = (data || {}) as UsersListPayload
  const agencies = data?.agencies ?? []
  const availableRoles = data?.availableRoles ?? []

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => {
    setEditItem(null)
    const defaultRole = availableRoles.includes('operator') ? 'operator' : (availableRoles[0] ?? 'operator')
    setForm({
      role: defaultRole,
      agency_uuid: agencies.length === 1 ? agencies[0].uuid : '',
    })
    setFormOpen(true)
  }

  const openEdit = (u: UserRow) => {
    setEditItem(u)
    const r = u.roles?.[0]?.name || u.role || 'operator'
    setForm({
      ...u,
      role: r,
      agency_uuid: u.agency_uuid ?? '',
      phone: u.phone ?? '',
    })
    setFormOpen(true)
  }

  const handleSubmit = () => {
    const agencyUuid = (form.agency_uuid as string) || undefined
    if (editItem) {
      updateUser.mutate(
        {
          uuid: editItem.uuid,
          data: {
            name: form.name as string,
            email: form.email as string,
            phone: (form.phone as string) || undefined,
            role: form.role as string,
            agency_uuid: agencyUuid ?? null,
          } as Partial<User>,
        },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createUser.mutate(
        {
          ...(form as unknown as UserCreatePayload),
          agency_uuid: agencyUuid,
        },
        { onSuccess: () => setFormOpen(false) },
      )
    }
  }

  const openQuickRole = (u: UserRow) => {
    setRoleUser(u)
    setQuickRole(u.roles?.[0]?.name || u.role || 'operator')
  }

  const submitQuickRole = () => {
    if (!roleUser) return
    const nameVal = displayLocalized(roleUser.name)
    updateUser.mutate(
      {
        uuid: roleUser.uuid,
        data: {
          name: typeof roleUser.name === 'string' ? roleUser.name : nameVal,
          email: roleUser.email as string,
          phone: roleUser.phone ?? undefined,
          role: quickRole,
          agency_uuid: roleUser.agency_uuid ?? null,
        } as Partial<User>,
      },
      {
        onSuccess: () => {
          setRoleUser(null)
          toast.success('Rôle mis à jour')
        },
      },
    )
  }

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      toast.success('E-mail copié')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const filtersActive =
    (roleFilter && roleFilter !== '__all__') || (agencyFilter && agencyFilter !== '__all__')

  const clearFilters = () => {
    setRoleFilter('')
    setAgencyFilter('')
  }

  const defaultFormRole =
    availableRoles.includes('operator') ? 'operator' : (availableRoles[0] ?? 'operator')

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{pagination.total ?? 0} utilisateur(s) staff</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} className="mr-1.5" />Nouvel utilisateur</Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="relative max-w-md flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher nom ou e-mail…" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Rôle</Label>
            <Select value={roleFilter || '__all__'} onValueChange={v => setRoleFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les rôles</SelectItem>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {agencies.length > 1 && (
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Agence</Label>
              <Select value={agencyFilter || '__all__'} onValueChange={v => setAgencyFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes les agences</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.uuid} value={a.uuid}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {filtersActive && (
            <Button type="button" variant="outline" size="sm" className="h-9 gap-1" onClick={clearFilters}>
              <FilterX size={14} /> Réinitialiser filtres
            </Button>
          )}
        </div>
        <ListCardsToggle mode={viewMode} onModeChange={setViewMode} className="shrink-0" />
      </div>

      {viewMode === 'list' && (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Nom</th>
                    <th className="px-4 py-3 text-left font-medium">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium">Agence</th>
                    <th className="px-4 py-3 text-left font-medium">Rôle</th>
                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                    <th className="px-4 py-3 text-left font-medium">Inscription</th>
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
                  ) : users.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center">
                      <Users size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-muted-foreground">Aucun utilisateur</p>
                    </td></tr>
                  ) : (
                    users.map((u) => {
                      const role = u.roles?.[0]?.name || u.role || 'operator'
                      const roleColor = ROLE_COLORS[role] || '#64748B'
                      return (
                        <tr key={u.uuid} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{displayLocalized(u.name)}</td>
                          <td className="px-4 py-3 text-sm break-all">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[140px] truncate" title={u.agency_name ?? ''}>
                            {u.agency_name ?? '—'}
                          </td>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions utilisateur"><MoreHorizontal size={14} /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => openEdit(u)}><Pencil size={14} className="mr-2" />Modifier le profil</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openQuickRole(u)}><UserCog size={14} className="mr-2" />Changer le rôle…</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setPwdUser(u); setPwd({ password: '', password_confirmation: '' }) }}><KeyRound size={14} className="mr-2" />Réinitialiser le mot de passe…</DropdownMenuItem>
                                {u.email && (
                                  <DropdownMenuItem onClick={() => copyEmail(u.email!)}><Copy size={14} className="mr-2" />Copier l&apos;e-mail</DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleStatus.mutate(u.uuid)}>
                                  {u.is_active !== false ? <><UserX size={14} className="mr-2" />Désactiver le compte</> : <><UserCheck size={14} className="mr-2" />Activer le compte</>}
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
      )}

      <div className={viewMode === 'list' ? 'md:hidden' : undefined}>
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
                const role = u.roles?.[0]?.name || u.role || 'operator'
                const roleColor = ROLE_COLORS[role] || '#64748B'
                return (
                  <Card key={u.uuid}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{displayLocalized(u.name)}</p>
                          <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                          {u.agency_name && (
                            <p className="text-xs text-muted-foreground mt-1 truncate" title={u.agency_name}>{u.agency_name}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Actions"><MoreHorizontal size={14} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openEdit(u)}><Pencil size={14} className="mr-2" />Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openQuickRole(u)}><UserCog size={14} className="mr-2" />Changer le rôle…</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setPwdUser(u); setPwd({ password: '', password_confirmation: '' }) }}><KeyRound size={14} className="mr-2" />Mot de passe…</DropdownMenuItem>
                            {u.email && (
                              <DropdownMenuItem onClick={() => copyEmail(u.email!)}><Copy size={14} className="mr-2" />Copier l&apos;e-mail</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStatus.mutate(u.uuid)}>
                              {u.is_active !== false ? <><UserX size={14} className="mr-2" />Désactiver</> : <><UserCheck size={14} className="mr-2" />Activer</>}
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

      {(pagination.last_page ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.from ?? 0}-{pagination.to ?? 0} sur {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} className="mr-1" />Précédent</Button>
            <span className="text-sm text-muted-foreground px-2">{page} / {pagination.last_page}</span>
            <Button variant="outline" size="sm" disabled={page >= (pagination.last_page ?? 1)} onClick={() => setPage(page + 1)}>Suivant<ChevronRight size={14} className="ml-1" /></Button>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editItem ? 'Modifier les informations du compte utilisateur.' : 'Créer un nouveau compte utilisateur staff.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Nom *</Label><Input value={String(form.name ?? '')} onChange={e => set('name', e.target.value)} /></div>
              <div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={String(form.email ?? '')} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Téléphone</Label><Input value={String(form.phone ?? '')} onChange={e => set('phone', e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={String(form.role ?? defaultFormRole)} onValueChange={v => set('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {agencies.length > 0 && (
              <div className="space-y-2">
                <Label>Agence</Label>
                <Select
                  value={form.agency_uuid ? String(form.agency_uuid) : '__none__'}
                  onValueChange={(v) => set('agency_uuid', v === '__none__' ? '' : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">(Non renseigné)</SelectItem>
                    {agencies.map((a) => (
                      <SelectItem key={a.uuid} value={a.uuid}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!editItem && (
              <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={String(form.password ?? '')} onChange={e => set('password', e.target.value)} autoComplete="new-password" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.name || !form.email || createUser.isPending || updateUser.isPending
                || (!editItem && !form.password)
              }
            >
              {(createUser.isPending || updateUser.isPending) ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdUser} onOpenChange={(o) => { if (!o) setPwdUser(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {pwdUser ? <>Nouveau mot de passe pour <strong>{displayLocalized(pwdUser.name)}</strong>.</> : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input type="password" autoComplete="new-password" value={pwd.password} onChange={e => setPwd(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Confirmation</Label>
              <Input type="password" autoComplete="new-password" value={pwd.password_confirmation} onChange={e => setPwd(p => ({ ...p, password_confirmation: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdUser(null)}>Annuler</Button>
            <Button
              disabled={
                pwd.password.length < 8
                || pwd.password !== pwd.password_confirmation
                || resetPassword.isPending
                || !pwdUser
              }
              onClick={() => {
                if (!pwdUser) return
                resetPassword.mutate(
                  { uuid: pwdUser.uuid, ...pwd },
                  { onSuccess: () => { setPwdUser(null); setPwd({ password: '', password_confirmation: '' }) } },
                )
              }}
            >
              {resetPassword.isPending ? 'Enregistrement…' : 'Appliquer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleUser} onOpenChange={(o) => { if (!o) setRoleUser(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le rôle</DialogTitle>
            <DialogDescription>
              {roleUser ? <>{displayLocalized(roleUser.name)} — {roleUser.email}</> : null}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label>Rôle assigné</Label>
            <Select value={quickRole} onValueChange={setQuickRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleUser(null)}>Annuler</Button>
            <Button onClick={submitQuickRole} disabled={updateUser.isPending || !roleUser}>
              {updateUser.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
