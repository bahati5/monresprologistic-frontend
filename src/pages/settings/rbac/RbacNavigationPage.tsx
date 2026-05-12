import { createElement, useCallback, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  GripVertical,
  HelpCircle,
  LayoutList,
  Loader2,
  PanelLeft,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { FrontendElement, Menu, Permission } from '@/types/rbac'

const MENU_NONE = '__none__'

function extractErrorMessage(err: unknown): string {
  const ax = err as {
    response?: { data?: { message?: string; errors?: Record<string, string[] | string> } }
    message?: string
  }
  const data = ax.response?.data
  if (data?.message && typeof data.message === 'string') return data.message
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return String(first[0])
    if (typeof first === 'string') return first
  }
  if (ax.message) return ax.message
  return 'Une erreur est survenue.'
}

function iconNameToPascalCase(raw: string): string {
  return raw
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

function resolveLucideIcon(raw: string | null | undefined): LucideIcon | null {
  if (!raw?.trim()) return null
  const key = iconNameToPascalCase(raw)
  const candidate = (LucideIcons as Record<string, unknown>)[key]
  if (typeof candidate === 'function') return candidate as LucideIcon
  return null
}

function LucideIconPreview({
  name,
  className,
  fallbackTitle,
}: {
  name: string | null
  className?: string
  fallbackTitle?: string
}) {
  const mergedClass = cn('h-4 w-4 shrink-0 text-muted-foreground', className)

  const renderedIcon = useMemo(() => {
    const IconComp = resolveLucideIcon(name)
    if (IconComp) {
      return createElement(IconComp, { className: mergedClass, 'aria-hidden': true })
    }
    return null
  }, [name, mergedClass])

  if (renderedIcon) return renderedIcon

  if (name?.trim()) {
    return (
      <span aria-label={fallbackTitle ?? `Icône Lucide inconnue : ${name}`}>
        <HelpCircle className={cn('h-4 w-4 shrink-0 text-amber-600/80', className)} aria-hidden />
      </span>
    )
  }
  return <span className="text-muted-foreground text-xs">—</span>
}

function RbacSectionNav() {
  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
      <NavLink
        to="/users/roles"
        end
        className={({ isActive }) =>
          cn(
            'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all',
            isActive ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
          )
        }
      >
        Rôles
      </NavLink>
      <NavLink
        to="/users/navigation"
        end
        className={({ isActive }) =>
          cn(
            'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-all',
            isActive ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
          )
        }
      >
        Navigation
      </NavLink>
    </div>
  )
}

function useRbacNavigationQueries() {
  const menusQuery = useQuery({
    queryKey: ['rbac', 'menus'],
    queryFn: async () => {
      const { data } = await api.get<{ menus: Menu[] }>('/api/rbac/menus')
      return [...data.menus].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    },
  })

  const elementsQuery = useQuery({
    queryKey: ['rbac', 'frontend-elements'],
    queryFn: async () => {
      const { data } = await api.get<{ elements: FrontendElement[] }>('/api/rbac/frontend-elements')
      return [...data.elements].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    },
  })

  const permissionsQuery = useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: async () => {
      const { data } = await api.get<{ permissions: Permission[] }>('/api/rbac/permissions')
      return data.permissions
    },
  })

  return { menusQuery, elementsQuery, permissionsQuery }
}

function SortableMenuRow({
  menu,
  onEdit,
  elementsCount,
  reorderDisabled,
}: {
  menu: Menu
  onEdit: (m: Menu) => void
  elementsCount: number
  reorderDisabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: menu.uuid,
    disabled: reorderDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-colors hover:bg-muted/20"
    >
      <button
        type="button"
        className={cn(
          'rounded-md p-1 text-muted-foreground hover:text-foreground',
          reorderDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing',
        )}
        aria-label="Glisser pour réordonner"
        disabled={reorderDisabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
        <LucideIconPreview name={menu.icon} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium leading-tight">{menu.name}</span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {menu.code}
          </Badge>
          {!menu.is_active && (
            <Badge variant="secondary" className="text-[10px]">
              Inactif
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ordre&nbsp;: {menu.order} · {elementsCount} élément{elementsCount !== 1 ? 's' : ''}
        </p>
      </div>

      <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => onEdit(menu)}>
        <Pencil className="h-3.5 w-3.5" />
        Modifier
      </Button>
    </div>
  )
}

type MenuFormState = {
  name: string
  code: string
  icon: string
  order: number
  is_active: boolean
  description: string
}

const emptyMenuForm = (): MenuFormState => ({
  name: '',
  code: '',
  icon: '',
  order: 0,
  is_active: true,
  description: '',
})

function MenusPanel({ menus }: { menus: Menu[] }) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Menu | null>(null)
  const [form, setForm] = useState<MenuFormState>(emptyMenuForm)

  const openCreate = () => {
    const nextOrder =
      menus.length === 0 ? 0 : Math.max(...menus.map((m) => m.order)) + 1
    setEditing(null)
    setForm({ ...emptyMenuForm(), order: nextOrder })
    setDialogOpen(true)
  }

  const openEdit = (m: Menu) => {
    setEditing(m)
    setForm({
      name: m.name,
      code: m.code,
      icon: m.icon ?? '',
      order: m.order,
      is_active: m.is_active,
      description: m.description ?? '',
    })
    setDialogOpen(true)
  }

  const saveMenuMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { data } = await api.put<{ menu: Menu }>(`/api/rbac/menus/${editing.uuid}`, {
          name: form.name,
          code: form.code,
          icon: form.icon || null,
          order: form.order,
          is_active: form.is_active,
          description: form.description || null,
        })
        return data.menu
      }
      const { data } = await api.post<{ menu: Menu }>('/api/rbac/menus', {
        code: form.code,
        name: form.name,
        description: form.description || null,
        icon: form.icon || null,
        order: form.order,
      })
      let created = data.menu
      if (!form.is_active) {
        const put = await api.put<{ menu: Menu }>(`/api/rbac/menus/${created.uuid}`, {
          is_active: false,
        })
        created = put.data.menu
      }
      return created
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'menus'] })
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'frontend-elements'] })
      setDialogOpen(false)
      toast.success(editing ? 'Menu enregistré.' : 'Menu créé.')
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const reorderMutation = useMutation({
    mutationFn: async (next: Menu[]) => {
      await Promise.all(next.map((m, index) => api.put(`/api/rbac/menus/${m.uuid}`, { order: index })))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'menus'] })
      toast.success('Ordre des menus mis à jour.')
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e
      if (!over || active.id === over.id) return
      const oldIndex = menus.findIndex((m) => m.uuid === active.id)
      const newIndex = menus.findIndex((m) => m.uuid === over.id)
      if (oldIndex < 0 || newIndex < 0) return
      reorderMutation.mutate(arrayMove(menus, oldIndex, newIndex))
    },
    [menus, reorderMutation],
  )

  const items = menus.map((m) => m.uuid)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Menus</h2>
          <p className="text-sm text-muted-foreground">
            Groupements de la barre latérale. Glisser-déposer pour réordonner.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-1" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouveau menu
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {menus.map((m) => (
              <SortableMenuRow
                key={m.uuid}
                menu={m}
                onEdit={openEdit}
                elementsCount={m.elements_count ?? 0}
                reorderDisabled={reorderMutation.isPending}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {menus.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/20 py-12 text-center text-sm text-muted-foreground">
          Aucun menu. Créez-en un pour commencer.
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le menu' : 'Nouveau menu'}</DialogTitle>
            <DialogDescription>
              Identifiant technique (code), libellé affiché et icône Lucide (ex.&nbsp;:{' '}
              <span className="font-mono text-xs">layout-dashboard</span>).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="menu-name">Nom affiché</Label>
              <Input
                id="menu-name"
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menu-code">Code</Label>
              <Input
                id="menu-code"
                value={form.code}
                onChange={(ev) => setForm((f) => ({ ...f, code: ev.target.value }))}
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="menu-icon">Icône (nom Lucide)</Label>
                <div className="flex gap-2">
                  <Input
                    id="menu-icon"
                    value={form.icon}
                    onChange={(ev) => setForm((f) => ({ ...f, icon: ev.target.value }))}
                    placeholder="layout-dashboard"
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                    <LucideIconPreview name={form.icon || null} />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="menu-order">Ordre</Label>
                <Input
                  id="menu-order"
                  type="number"
                  value={Number.isFinite(form.order) ? form.order : 0}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, order: Number.parseInt(ev.target.value, 10) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menu-desc">Description (optionnel)</Label>
              <Textarea
                id="menu-desc"
                rows={2}
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                className="resize-y text-sm"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="menu-active" className="text-sm font-medium">
                  Menu actif
                </Label>
                <p className="text-xs text-muted-foreground">Masque le menu dans l’application si désactivé.</p>
              </div>
              <Switch
                id="menu-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: Boolean(v) }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={
                saveMenuMutation.isPending ||
                !form.name.trim() ||
                !form.code.trim()
              }
              onClick={() => saveMenuMutation.mutate()}
            >
              {saveMenuMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type ElementFormState = {
  code: string
  name: string
  description: string
  route: string
  icon: string
  order: number
  is_page: boolean
  is_active: boolean
  display_in_sidebar: boolean
  menu_uuid: string
  permissions: string[]
}

function emptyElementForm(): ElementFormState {
  return {
    code: '',
    name: '',
    description: '',
    route: '',
    icon: '',
    order: 0,
    is_page: true,
    is_active: true,
    display_in_sidebar: true,
    menu_uuid: MENU_NONE,
    permissions: [],
  }
}

function ElementsPanel({
  elements,
  menus,
  permissions,
}: {
  elements: FrontendElement[]
  menus: Menu[]
  permissions: Permission[]
}) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FrontendElement | null>(null)
  const [form, setForm] = useState<ElementFormState>(() => emptyElementForm())
  const [permSearch, setPermSearch] = useState('')

  const menusSorted = useMemo(
    () => [...menus].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [menus],
  )

  const groupedPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase()
    const filtered = q
      ? permissions.filter((p) => p.name.toLowerCase().includes(q) || p.module.toLowerCase().includes(q))
      : permissions
    const map = new Map<string, Permission[]>()
    for (const p of filtered) {
      const mod = p.module || 'legacy'
      if (!map.has(mod)) map.set(mod, [])
      map.get(mod)!.push(p)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [permissions, permSearch])

  const openCreate = () => {
    const o =
      elements.length === 0 ? 0 : Math.max(...elements.map((e) => e.order)) + 1
    setEditing(null)
    setForm({ ...emptyElementForm(), order: o })
    setPermSearch('')
    setDialogOpen(true)
  }

  const openEdit = (el: FrontendElement) => {
    setEditing(el)
    setForm({
      code: el.code,
      name: el.name,
      description: el.description ?? '',
      route: el.route,
      icon: el.icon ?? '',
      order: el.order,
      is_page: el.is_page,
      is_active: el.is_active,
      display_in_sidebar: el.display_in_sidebar,
      menu_uuid: el.menu?.uuid ?? MENU_NONE,
      permissions: [...el.permissions],
    })
    setPermSearch('')
    setDialogOpen(true)
  }

  const permSet = useMemo(() => new Set(form.permissions), [form.permissions])

  const togglePermission = (name: string, checked: boolean) => {
    setForm((f) => {
      const next = new Set(f.permissions)
      if (checked) next.add(name)
      else next.delete(name)
      return { ...f, permissions: [...next] }
    })
  }

  const saveElementMutation = useMutation({
    mutationFn: async () => {
      const body = {
        code: form.code,
        name: form.name,
        description: form.description.trim() ? form.description : null,
        route: form.route,
        icon: form.icon.trim() ? form.icon : null,
        order: form.order,
        is_page: form.is_page,
        is_active: form.is_active,
        display_in_sidebar: form.display_in_sidebar,
        menu_uuid: form.menu_uuid === MENU_NONE ? null : form.menu_uuid,
        permissions: form.permissions,
      }
      if (editing) {
        const { data } = await api.put<{ element: FrontendElement }>(
          `/api/rbac/frontend-elements/${editing.uuid}`,
          body,
        )
        return data.element
      }
      const { data } = await api.post<{ element: FrontendElement }>('/api/rbac/frontend-elements', body)
      return data.element
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'frontend-elements'] })
      void queryClient.invalidateQueries({ queryKey: ['rbac', 'menus'] })
      setDialogOpen(false)
      toast.success(editing ? 'Élément enregistré.' : 'Élément créé.')
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Éléments (pages)</h2>
          <p className="text-sm text-muted-foreground">
            Pages et entrées de navigation rattachées à un menu, avec permissions requises.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-1" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouvel élément
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {elements.map((el) => (
          <div
            key={el.uuid}
            className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-colors hover:bg-muted/15 sm:flex-row sm:items-start"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
              <LucideIconPreview name={el.icon} />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{el.name}</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {el.code}
                </Badge>
                {!el.is_active && (
                  <Badge variant="secondary" className="text-[10px]">
                    Inactif
                  </Badge>
                )}
                {el.display_in_sidebar && (
                  <Badge variant="outline" className="text-[10px]">
                    Barre latérale
                  </Badge>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground">{el.route}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Menu&nbsp;:{' '}
                  <span className="text-foreground">{el.menu?.name ?? '—'}</span>
                </span>
                <span>Ordre&nbsp;: {el.order}</span>
                <span>{el.is_page ? 'Page' : 'Non-page'}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Permissions&nbsp;: </span>
                {el.permissions.length === 0 ? (
                  <span className="text-muted-foreground">aucune (accès si menu visible)</span>
                ) : (
                  <span className="text-foreground" title={el.permissions.join(', ')}>
                    {el.permissions.slice(0, 4).join(', ')}
                    {el.permissions.length > 4 ? ` +${el.permissions.length - 4}` : ''}
                  </span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1 self-start sm:self-center"
              onClick={() => openEdit(el)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </div>
        ))}
      </div>

      {elements.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/20 py-12 text-center text-sm text-muted-foreground">
          Aucun élément. Créez une page pour l’afficher dans la navigation.
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,760px)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l’élément' : 'Nouvel élément'}</DialogTitle>
            <DialogDescription>
              Route React, rattachement au menu et permissions nécessaires pour afficher l’entrée.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="el-name">Nom affiché</Label>
                <Input
                  id="el-name"
                  value={form.name}
                  onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="el-code">Code</Label>
                <Input
                  id="el-code"
                  value={form.code}
                  onChange={(ev) => setForm((f) => ({ ...f, code: ev.target.value }))}
                  className="font-mono text-sm"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="el-route">Route</Label>
              <Input
                id="el-route"
                value={form.route}
                onChange={(ev) => setForm((f) => ({ ...f, route: ev.target.value }))}
                className="font-mono text-sm"
                placeholder="/settings/exemple"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="el-icon">Icône (nom Lucide)</Label>
                <div className="flex gap-2">
                  <Input
                    id="el-icon"
                    value={form.icon}
                    onChange={(ev) => setForm((f) => ({ ...f, icon: ev.target.value }))}
                    placeholder="file-text"
                    className="font-mono text-sm"
                    autoComplete="off"
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30">
                    <LucideIconPreview name={form.icon || null} />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="el-order">Ordre</Label>
                <Input
                  id="el-order"
                  type="number"
                  value={form.order}
                  onChange={(ev) =>
                    setForm((f) => ({ ...f, order: Number.parseInt(ev.target.value, 10) || 0 }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="el-desc">Description</Label>
              <Textarea
                id="el-desc"
                rows={2}
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                className="resize-y text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label>Menu</Label>
              <Select
                value={form.menu_uuid}
                onValueChange={(v) => setForm((f) => ({ ...f, menu_uuid: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MENU_NONE}>Aucun menu</SelectItem>
                  {menusSorted.map((m) => (
                    <SelectItem key={m.uuid} value={m.uuid}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 rounded-lg border bg-muted/15 p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="el-page" className="text-sm font-medium">
                  Est une page
                </Label>
                <Switch
                  id="el-page"
                  checked={form.is_page}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_page: Boolean(v) }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="el-active" className="text-sm font-medium">
                  Actif
                </Label>
                <Switch
                  id="el-active"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: Boolean(v) }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="el-sidebar" className="text-sm font-medium">
                  Afficher dans la barre latérale
                </Label>
                <Switch
                  id="el-sidebar"
                  checked={form.display_in_sidebar}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, display_in_sidebar: Boolean(v) }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="perm-search">Permissions requises</Label>
              <Input
                id="perm-search"
                value={permSearch}
                onChange={(ev) => setPermSearch(ev.target.value)}
                placeholder="Filtrer par nom ou module…"
                className="text-sm"
                autoComplete="off"
              />
              <ScrollArea className="h-56 rounded-md border">
                <div className="space-y-3 p-3">
                  {groupedPerms.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune permission ne correspond.</p>
                  ) : (
                    groupedPerms.map(([module, list]) => (
                      <div key={module}>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {module}
                        </p>
                        <div className="space-y-2">
                          {list.map((p) => (
                            <label
                              key={p.id}
                              className="flex cursor-pointer items-start gap-2 rounded-md py-0.5 hover:bg-muted/40"
                            >
                              <Checkbox
                                checked={permSet.has(p.name)}
                                onCheckedChange={(v) => {
                                  if (v === 'indeterminate') return
                                  togglePermission(p.name, v === true)
                                }}
                                className="mt-0.5"
                              />
                              <span className="font-mono text-xs leading-snug">{p.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={
                saveElementMutation.isPending || !form.name.trim() || !form.code.trim() || !form.route.trim()
              }
              onClick={() => saveElementMutation.mutate()}
            >
              {saveElementMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function RbacNavigationPage() {
  const { menusQuery, elementsQuery, permissionsQuery } = useRbacNavigationQueries()
  const menus = menusQuery.data ?? []
  const elements = elementsQuery.data ?? []
  const permissions = permissionsQuery.data ?? []

  const fatal = menusQuery.isError || elementsQuery.isError
  const fatalError = menusQuery.error ?? elementsQuery.error
  const loadingMain = menusQuery.isPending || elementsQuery.isPending

  const refetchAll = () => {
    void menusQuery.refetch()
    void elementsQuery.refetch()
    void permissionsQuery.refetch()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutList className="h-4 w-4" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">Paramètres</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Navigation RBAC</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Gestion des menus et des pages exposées dans l’interface, ainsi que des permissions associées.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <RbacSectionNav />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => refetchAll()}
            disabled={menusQuery.isFetching || elementsQuery.isFetching}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', (menusQuery.isFetching || elementsQuery.isFetching) && 'animate-spin')}
            />
            Actualiser
          </Button>
        </div>
      </div>

      {fatal && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">Impossible de charger la navigation.</p>
          <p className="mt-1 opacity-90">{extractErrorMessage(fatalError)}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3 border-destructive/40" onClick={refetchAll}>
            Réessayer
          </Button>
        </div>
      )}

      {loadingMain && !fatal && (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      )}

      {!loadingMain && !fatal && (
        <Tabs defaultValue="menus" className="w-full space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="menus" className="gap-1.5">
              <PanelLeft className="h-3.5 w-3.5" />
              Menus
            </TabsTrigger>
            <TabsTrigger value="elements" className="gap-1.5">
              <LayoutList className="h-3.5 w-3.5" />
              Pages
            </TabsTrigger>
          </TabsList>
          <TabsContent value="menus" className="focus-visible:outline-none">
            <MenusPanel menus={menus} />
          </TabsContent>
          <TabsContent value="elements" className="focus-visible:outline-none">
            <ElementsPanel elements={elements} menus={menus} permissions={permissions} />
            {permissionsQuery.isError && (
              <p className="mt-2 text-xs text-amber-700">
                Liste des permissions partielle : {extractErrorMessage(permissionsQuery.error)}. Le sélecteur peut
                être incomplet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}