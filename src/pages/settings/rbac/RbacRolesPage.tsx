import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  Users,
  KeyRound,
  FolderTree,
} from 'lucide-react'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiError'
import type { Permission, PermissionGroup, Role } from '@/types/rbac'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function notify(message: string, kind: 'success' | 'error' = 'success') {
  if (kind === 'error') console.error(message)
  else console.log(message)
  window.alert(message)
}

function rbacNavClass(active: boolean) {
  return cn(
    'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
  )
}

/** Clé React + segment d’URL `/api/rbac/roles/{…}` (uuid si présent, sinon nom Spatie unique). */
function roleRouteKey(role: Pick<Role, 'uuid' | 'name'>): string {
  const u = role.uuid
  if (typeof u === 'string' && u.length > 0) {
    return u
  }
  return role.name
}

function RbacSubNav() {
  const { pathname } = useLocation()
  const rolesActive = pathname === '/users/roles'

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-4">
      <Link to="/users/roles" className={rbacNavClass(rolesActive)}>
        Rôles
      </Link>
      <Link to="/users/navigation" className={rbacNavClass(pathname === '/users/navigation')}>
        Navigation
      </Link>
    </nav>
  )
}

function groupPermissionsByModule(perms: Permission[]): Map<string, Permission[]> {
  const map = new Map<string, Permission[]>()
  for (const p of perms) {
    const mod =
      p.module ||
      (p.name.includes('.') ? p.name.split('.')[0] : 'legacy')
    const list = map.get(mod) ?? []
    list.push(p)
    map.set(mod, list)
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

function computeEffectivePermissionSet(
  direct: Set<string>,
  selectedGroupUuids: Set<string>,
  allGroups: PermissionGroup[],
): Set<string> {
  const out = new Set(direct)
  for (const g of allGroups) {
    if (selectedGroupUuids.has(g.uuid)) {
      for (const name of g.permissions ?? []) {
        out.add(name)
      }
    }
  }
  return out
}

type RolePayload = {
  name: string
  code?: string
  description: string
  level: number
  permissions: string[]
  permission_groups: string[]
}

function RoleFormFields({
  name,
  setName,
  code,
  setCode,
  description,
  setDescription,
  level,
  setLevel,
  readOnlyMeta,
}: {
  name: string
  setName: (v: string) => void
  code: string
  setCode: (v: string) => void
  description: string
  setDescription: (v: string) => void
  level: number
  setLevel: (v: number) => void
  readOnlyMeta?: boolean
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="role-name">Nom</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={readOnlyMeta}
          placeholder="Ex. Gestionnaire agence"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role-code">Code</Label>
        <Input
          id="role-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={readOnlyMeta}
          placeholder="ex. agency_manager"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role-level">Niveau</Label>
        <Input
          id="role-level"
          type="number"
          min={0}
          value={Number.isFinite(level) ? level : 0}
          onChange={(e) => setLevel(Number.parseInt(e.target.value, 10) || 0)}
          disabled={readOnlyMeta}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="role-desc">Description</Label>
        <Textarea
          id="role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={readOnlyMeta}
          rows={3}
          placeholder="Objet du rôle…"
        />
      </div>
    </div>
  )
}

function PermissionDualPicker({
  allPermissions,
  directNames,
  setDirectNames,
  leftFilter,
  setLeftFilter,
  rightFilter,
  setRightFilter,
}: {
  allPermissions: Permission[]
  directNames: Set<string>
  setDirectNames: (next: Set<string>) => void
  leftFilter: string
  setLeftFilter: (v: string) => void
  rightFilter: string
  setRightFilter: (v: string) => void
}) {
  const [leftSel, setLeftSel] = useState<Set<string>>(new Set())
  const [rightSel, setRightSel] = useState<Set<string>>(new Set())

  const available = useMemo(
    () => allPermissions.filter((p) => !directNames.has(p.name)),
    [allPermissions, directNames],
  )
  const assigned = useMemo(
    () => allPermissions.filter((p) => directNames.has(p.name)).sort((a, b) => a.name.localeCompare(b.name)),
    [allPermissions, directNames],
  )

  const availableGrouped = useMemo(() => groupPermissionsByModule(available), [available])
  const filteredLeft = useMemo(() => {
    const q = leftFilter.trim().toLowerCase()
    if (!q) return availableGrouped
    const next = new Map<string, Permission[]>()
    for (const [mod, list] of availableGrouped) {
      const hit = list.filter((p) => p.name.toLowerCase().includes(q) || mod.toLowerCase().includes(q))
      if (hit.length) next.set(mod, hit)
    }
    return next
  }, [availableGrouped, leftFilter])

  const filteredRight = useMemo(() => {
    const q = rightFilter.trim().toLowerCase()
    if (!q) return assigned
    return assigned.filter((p) => p.name.toLowerCase().includes(q))
  }, [assigned, rightFilter])

  const toggleLeft = (name: string) => {
    setLeftSel((prev) => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  }

  const toggleRight = (name: string) => {
    setRightSel((prev) => {
      const n = new Set(prev)
      if (n.has(name)) n.delete(name)
      else n.add(name)
      return n
    })
  }

  const addSelected = () => {
    if (!leftSel.size) return
    const n = new Set(directNames)
    for (const x of leftSel) n.add(x)
    setDirectNames(n)
    setLeftSel(new Set())
  }

  const removeSelected = () => {
    if (!rightSel.size) return
    const n = new Set(directNames)
    for (const x of rightSel) n.delete(x)
    setDirectNames(n)
    setRightSel(new Set())
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Permissions directes</Label>
        <p className="text-xs text-muted-foreground">
          Sélectionnez des permissions à gauche, puis ajoutez-les. Les groupes ci-dessous ajoutent aussi des droits effectifs.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="flex-1 min-w-0 rounded-lg border bg-card/50">
          <div className="border-b p-2">
            <Input
              placeholder="Filtrer les disponibles…"
              value={leftFilter}
              onChange={(e) => setLeftFilter(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <ScrollArea className="h-[240px] sm:h-[280px]">
            <div className="space-y-3 p-3">
              {[...filteredLeft.entries()].map(([mod, list]) => (
                <div key={mod}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{mod}</p>
                  <div className="space-y-1.5">
                    {list.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                      >
                        <Checkbox
                          checked={leftSel.has(p.name)}
                          onCheckedChange={() => toggleLeft(p.name)}
                          className="mt-0.5"
                        />
                        <span className="break-all leading-snug">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {!filteredLeft.size && (
                <p className="text-center text-sm text-muted-foreground py-8">Aucune permission disponible</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-row justify-center gap-2 lg:flex-col lg:justify-center lg:px-1">
          <Button type="button" size="icon" variant="secondary" onClick={addSelected} disabled={!leftSel.size} title="Ajouter">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="secondary" onClick={removeSelected} disabled={!rightSel.size} title="Retirer">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 min-w-0 rounded-lg border bg-card/50">
          <div className="border-b p-2">
            <Input
              placeholder="Filtrer les assignées…"
              value={rightFilter}
              onChange={(e) => setRightFilter(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <ScrollArea className="h-[240px] sm:h-[280px]">
            <div className="space-y-1.5 p-3">
              {filteredRight.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <Checkbox
                    checked={rightSel.has(p.name)}
                    onCheckedChange={() => toggleRight(p.name)}
                    className="mt-0.5"
                  />
                  <span className="break-all leading-snug">{p.name}</span>
                </label>
              ))}
              {!filteredRight.length && (
                <p className="text-center text-sm text-muted-foreground py-8">Aucune permission directe</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

function GroupPicker({
  groups,
  selectedUuids,
  toggleUuid,
}: {
  groups: PermissionGroup[]
  selectedUuids: Set<string>
  toggleUuid: (uuid: string, on: boolean) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Groupes de permissions</Label>
        <p className="text-xs text-muted-foreground">Cochez les groupes à attacher au rôle.</p>
      </div>
      <ScrollArea className="h-[200px] rounded-lg border bg-card/50">
        <div className="space-y-2 p-3">
          {groups.map((g) => (
            <label
              key={g.uuid ?? g.code}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50',
                !g.is_active && 'opacity-60',
              )}
            >
              <Checkbox
                checked={selectedUuids.has(g.uuid)}
                onCheckedChange={(v) => toggleUuid(g.uuid, v === true)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{g.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {g.code}
                  </Badge>
                  {!g.is_active && (
                    <Badge variant="secondary" className="text-[10px]">
                      Inactif
                    </Badge>
                  )}
                </div>
                {g.description && <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {g.permissions_count ?? g.permissions?.length ?? 0} permission(s) dans le groupe
                </p>
              </div>
            </label>
          ))}
          {!groups.length && <p className="text-center text-sm text-muted-foreground py-8">Aucun groupe défini</p>}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function RbacRolesPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)

  const rolesQuery = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: async () => {
      const { data } = await api.get<{ roles: Role[] }>('/api/rbac/roles')
      return data.roles ?? []
    },
  })

  const permissionsQuery = useQuery({
    queryKey: ['rbac-permissions'],
    queryFn: async () => {
      const { data } = await api.get<{ permissions: Permission[] }>('/api/rbac/permissions')
      return data.permissions ?? []
    },
  })

  const groupsQuery = useQuery({
    queryKey: ['rbac-permission-groups'],
    queryFn: async () => {
      const { data } = await api.get<{ groups: PermissionGroup[] }>('/api/rbac/permission-groups')
      return data.groups ?? []
    },
  })

  const detailQuery = useQuery({
    queryKey: ['rbac-role', editingUuid],
    enabled: editOpen && !!editingUuid,
    queryFn: async () => {
      const { data } = await api.get<{ role: Role }>(`/api/rbac/roles/${editingUuid}`)
      return data.role
    },
  })

  const openEdit = (routeKey: string) => {
    setEditingUuid(routeKey)
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingUuid(null)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <RbacSubNav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Rôles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Définissez les rôles, leurs permissions directes et les groupes associés.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Créer un rôle
        </Button>
      </div>

      {rolesQuery.isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {getApiErrorMessage(rolesQuery.error, 'Impossible de charger les rôles.')}
        </div>
      )}

      {rolesQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {!rolesQuery.isLoading && !rolesQuery.isError && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(rolesQuery.data ?? []).map((role) => (
            <Card
              key={roleRouteKey(role)}
              role="button"
              tabIndex={0}
              className="cursor-pointer text-left outline-none transition-shadow hover:ring-2 hover:ring-primary/25 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openEdit(roleRouteKey(role))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openEdit(roleRouteKey(role))
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-lg leading-tight">{role.name}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs">{role.code}</CardDescription>
                  </div>
                  {role.is_system ? (
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Système
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 gap-1">
                      <Shield className="h-3 w-3" />
                      Personnalisé
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="line-clamp-2 text-muted-foreground">{role.description?.trim() || '—'}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5" />
                    {role.permissions_count ?? role.permissions?.length ?? 0} permissions
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {role.users_count ?? 0} utilisateur(s)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FolderTree className="h-3.5 w-3.5" />
                    {typeof role.groups_count === 'number' ? `${role.groups_count} groupe(s)` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Pencil className="h-3 w-3" />
                  Cliquez pour modifier
                </div>
              </CardContent>
            </Card>
          ))}
          {!rolesQuery.data?.length && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-12">
              Aucun rôle pour le moment.
            </p>
          )}
        </div>
      )}

      <CreateRoleDialog
        key={createOpen ? 'create-open' : 'create-closed'}
        open={createOpen}
        onOpenChange={setCreateOpen}
        allPermissions={permissionsQuery.data ?? []}
        allGroups={groupsQuery.data ?? []}
        permissionsLoading={permissionsQuery.isLoading}
        groupsLoading={groupsQuery.isLoading}
        onCreated={() => void qc.invalidateQueries({ queryKey: ['rbac-roles'] })}
      />

      <EditRoleDialog
        key={editingUuid ?? 'none'}
        open={editOpen}
        onOpenChange={(o) => {
          if (!o) closeEdit()
          else setEditOpen(true)
        }}
        roleUuid={editingUuid}
        role={detailQuery.data}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        error={detailQuery.error}
        allPermissions={permissionsQuery.data ?? []}
        allGroups={groupsQuery.data ?? []}
        permissionsLoading={permissionsQuery.isLoading}
        groupsLoading={groupsQuery.isLoading}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: ['rbac-roles'] })
          void qc.invalidateQueries({ queryKey: ['rbac-role', editingUuid] })
        }}
        onDeleted={() => {
          closeEdit()
          void qc.invalidateQueries({ queryKey: ['rbac-roles'] })
        }}
      />
    </div>
  )
}

function buildPayload(
  name: string,
  code: string,
  description: string,
  level: number,
  direct: Set<string>,
  groupUuids: Set<string>,
): RolePayload {
  const trimmedCode = code.trim()
  return {
    name: name.trim(),
    ...(trimmedCode ? { code: trimmedCode } : {}),
    description: description.trim(),
    level,
    permissions: [...direct],
    permission_groups: [...groupUuids],
  }
}

function CreateRoleDialog({
  open,
  onOpenChange,
  allPermissions,
  allGroups,
  permissionsLoading,
  groupsLoading,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  allPermissions: Permission[]
  allGroups: PermissionGroup[]
  permissionsLoading: boolean
  groupsLoading: boolean
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState(0)
  const [direct, setDirect] = useState<Set<string>>(new Set())
  const [groupUuids, setGroupUuids] = useState<Set<string>>(new Set())
  const [leftFilter, setLeftFilter] = useState('')
  const [rightFilter, setRightFilter] = useState('')

  const effective = useMemo(
    () => computeEffectivePermissionSet(direct, groupUuids, allGroups),
    [direct, groupUuids, allGroups],
  )

  const createMut = useMutation({
    mutationFn: async (payload: RolePayload) => api.post('/api/rbac/roles', payload),
    onSuccess: () => {
      notify('Rôle créé avec succès.', 'success')
      onCreated()
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      notify(getApiErrorMessage(err, 'Échec de la création.'), 'error')
    },
  })

  const toggleGroup = useCallback((uuid: string, on: boolean) => {
    setGroupUuids((prev) => {
      const n = new Set(prev)
      if (on) n.add(uuid)
      else n.delete(uuid)
      return n
    })
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      notify('Le nom est requis.', 'error')
      return
    }
    createMut.mutate(buildPayload(name, code, description, level, direct, groupUuids))
  }

  const dataLoading = permissionsLoading || groupsLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Créer un rôle</DialogTitle>
          <DialogDescription>Renseignez les informations et les droits du nouveau rôle.</DialogDescription>
        </DialogHeader>
        {dataLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <RoleFormFields
              name={name}
              setName={setName}
              code={code}
              setCode={setCode}
              description={description}
              setDescription={setDescription}
              level={level}
              setLevel={setLevel}
            />
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">Permissions effectives : </span>
              <span className="text-muted-foreground">{effective.size} permission(s)</span>
              <span className="text-muted-foreground"> (directes + groupes)</span>
            </div>
            <PermissionDualPicker
              allPermissions={allPermissions}
              directNames={direct}
              setDirectNames={setDirect}
              leftFilter={leftFilter}
              setLeftFilter={setLeftFilter}
              rightFilter={rightFilter}
              setRightFilter={setRightFilter}
            />
            <GroupPicker groups={allGroups} selectedUuids={groupUuids} toggleUuid={toggleGroup} />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditRoleDialog({
  open,
  onOpenChange,
  roleUuid,
  role,
  isLoading,
  isError,
  error,
  allPermissions,
  allGroups,
  permissionsLoading,
  groupsLoading,
  onSaved,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  roleUuid: string | null
  role: Role | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
  allPermissions: Permission[]
  allGroups: PermissionGroup[]
  permissionsLoading: boolean
  groupsLoading: boolean
  onSaved: () => void
  onDeleted: () => void
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [code, setCode] = useState(role?.code ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [level, setLevel] = useState(role?.level ?? 0)
  const [direct, setDirect] = useState<Set<string>>(() => new Set(role?.permissions ?? []))
  const [groupUuids, setGroupUuids] = useState<Set<string>>(() => new Set((role?.groups ?? []).map((g) => g.uuid)))
  const [leftFilter, setLeftFilter] = useState('')
  const [rightFilter, setRightFilter] = useState('')

  const effective = useMemo(
    () => computeEffectivePermissionSet(direct, groupUuids, allGroups),
    [direct, groupUuids, allGroups],
  )

  const updateMut = useMutation({
    mutationFn: async (payload: RolePayload) => api.put(`/api/rbac/roles/${roleUuid}`, payload),
    onSuccess: () => {
      notify('Rôle mis à jour.', 'success')
      onSaved()
    },
    onError: (err: unknown) => {
      notify(getApiErrorMessage(err, 'Échec de la mise à jour.'), 'error')
    },
  })

  const deleteMut = useMutation({
    mutationFn: async () => api.delete(`/api/rbac/roles/${roleUuid}`),
    onSuccess: () => {
      notify('Rôle supprimé.', 'success')
      onDeleted()
    },
    onError: (err: unknown) => {
      notify(getApiErrorMessage(err, 'Suppression impossible.'), 'error')
    },
  })

  const toggleGroup = useCallback((uuid: string, on: boolean) => {
    setGroupUuids((prev) => {
      const n = new Set(prev)
      if (on) n.add(uuid)
      else n.delete(uuid)
      return n
    })
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!roleUuid || !role) return
    if (!name.trim()) {
      notify('Le nom est requis.', 'error')
      return
    }
    updateMut.mutate(buildPayload(name, code, description, level, direct, groupUuids))
  }

  const handleDelete = () => {
    if (!roleUuid || !role || role.is_system) return
    if (!window.confirm(`Supprimer définitivement le rôle « ${role.name} » ?`)) return
    deleteMut.mutate()
  }

  const dataLoading = isLoading || permissionsLoading || groupsLoading
  const systemLocked = role?.is_system ?? false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Modifier le rôle</DialogTitle>
          <DialogDescription>
            Ajustez le profil, les permissions directes et les groupes. Les changements s’appliquent aux utilisateurs associés.
          </DialogDescription>
        </DialogHeader>

        {isError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {getApiErrorMessage(error, 'Impossible de charger ce rôle.')}
          </div>
        )}

        {dataLoading && !isError && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!dataLoading && !isError && role && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {systemLocked && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                Rôle système : le nom, le code et le niveau ne sont pas modifiables. Vous pouvez toutefois ajuster permissions et groupes si votre politique le permet.
              </div>
            )}
            <RoleFormFields
              name={name}
              setName={setName}
              code={code}
              setCode={setCode}
              description={description}
              setDescription={setDescription}
              level={level}
              setLevel={setLevel}
              readOnlyMeta={systemLocked}
            />
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <span className="font-medium">Permissions effectives : </span>
              <span className="text-muted-foreground">{effective.size} permission(s)</span>
              <span className="text-muted-foreground"> (directes + groupes)</span>
            </div>
            <PermissionDualPicker
              allPermissions={allPermissions}
              directNames={direct}
              setDirectNames={setDirect}
              leftFilter={leftFilter}
              setLeftFilter={setLeftFilter}
              rightFilter={rightFilter}
              setRightFilter={setRightFilter}
            />
            <GroupPicker groups={allGroups} selectedUuids={groupUuids} toggleUuid={toggleGroup} />
            <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                disabled={systemLocked || deleteMut.isPending}
                onClick={handleDelete}
              >
                {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Supprimer
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
                <Button type="submit" disabled={updateMut.isPending}>
                  {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
