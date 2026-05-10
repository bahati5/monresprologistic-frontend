import { useState } from 'react'
import {
  packagingTypeHooks,
  transportCompanyHooks,
  articleCategoryHooks,
} from '@/hooks/useSettings'
import { SettingsCard } from '../SettingsCard'
import { CrudSheet } from '../CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { displayLocalized } from '@/lib/localizedString'

export type EntityType = 'packaging_type' | 'transport_company' | 'article_category'

export function CrudList({
  title,
  icon: Icon,
  entityType,
  nameField = 'name',
  extraFields,
  initialCreateDefaults,
}: {
  title: string
  icon: LucideIcon
  entityType: EntityType
  nameField?: string
  extraFields?: { key: string; label: string; type?: string; step?: string }[]
  initialCreateDefaults?: Record<string, unknown>
}) {
  const hookMap = {
    packaging_type: packagingTypeHooks,
    transport_company: transportCompanyHooks,
    article_category: articleCategoryHooks,
  }
  const hooks = hookMap[entityType]
  const { data: items, isLoading } = hooks.useList()
  const create = hooks.useCreate()
  const update = hooks.useUpdate()
  const del = hooks.useDelete()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})

  const openCreate = () => {
    setEditItem(null)
    setForm({
      is_active: true,
      ...(initialCreateDefaults ?? {}),
    })
    setSheetOpen(true)
  }
  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item)
    setForm({ ...item })
    setSheetOpen(true)
  }
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (editItem?.id != null) {
      update.mutate({ id: editItem.id as number, data: form }, { onSuccess: () => setSheetOpen(false) })
    } else {
      create.mutate(form as Record<string, unknown>, { onSuccess: () => setSheetOpen(false) })
    }
  }

  const list = (Array.isArray(items) ? items : []) as unknown as Record<string, unknown>[]

  return (
    <>
      <SettingsCard
        title={title}
        icon={Icon}
        badge={`${list.length}`}
        isLoading={isLoading}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        }
      >
        <div className="space-y-2">
          {list.map((item) => (
            <div
              key={String(item.id)}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="font-medium text-sm">
                  {displayLocalized(String(item[nameField] ?? item.name ?? item.label ?? ''))}
                </p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground">{displayLocalized(String(item.description))}</p>
                ) : null}
                {entityType === 'transport_company' &&
                (item.contact_name || item.contact_phone || item.contact_email) ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    {[item.contact_name, item.contact_phone, item.contact_email].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
                {entityType === 'packaging_type' && item.is_billable ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Facturable — {Number(item.unit_price ?? 0).toFixed(2)} / unité × quantité d'articles
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {item.is_active !== undefined && (
                  <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                    {item.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil size={14} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                      <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => del.mutate(item.id as number)}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun element</p>}
        </div>
      </SettingsCard>

      <CrudSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editItem ? 'Modifier' : 'Ajouter'}
        onSubmit={handleSubmit}
        isLoading={create.isPending || update.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{nameField === 'label' ? 'Libelle' : 'Nom'}</Label>
            <Input
              value={String(form[nameField] ?? form.name ?? form.label ?? '')}
              onChange={(e) => set(nameField, e.target.value)}
            />
          </div>
          {extraFields?.map((f) =>
            f.type === 'switch' ? (
              <div key={f.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm font-medium">{f.label}</span>
                <Switch checked={!!form[f.key]} onCheckedChange={(v) => set(f.key, v)} />
              </div>
            ) : (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                {f.type === 'textarea' ? (
                  <Textarea value={String(form[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
                ) : f.type === 'number' ? (
                  <Input
                    type="number"
                    step={f.step ?? '1'}
                    value={form[f.key] === undefined || form[f.key] === null ? '' : String(form[f.key])}
                    onChange={(e) => set(f.key, e.target.value === '' ? '' : Number(e.target.value))}
                  />
                ) : (
                  <Input value={String(form[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
                )}
              </div>
            )
          )}
          {form.is_active !== undefined && (
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch checked={form.is_active !== false} onCheckedChange={(v) => set('is_active', v)} />
            </div>
          )}
        </div>
      </CrudSheet>
    </>
  )
}
