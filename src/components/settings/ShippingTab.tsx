import { useState, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import {
  shippingModeHooks,
  packagingTypeHooks,
  transportCompanyHooks,
  articleCategoryHooks,
} from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Truck, Package, Clock, Building, Tag, Plus, Pencil, Trash2 } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import { ShipLinesCard } from './ShipLinesCard'

type EntityType = 'packaging_type' | 'transport_company' | 'article_category'

type DeliveryTimeFormRow = {
  id?: number
  label: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

function normalizeModeDeliveryTimes(mode: Record<string, unknown>): DeliveryTimeFormRow[] {
  const raw = (mode.delivery_times ?? mode.deliveryTimes) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((r: Record<string, unknown>, i: number) => ({
    id: r.id != null ? Number(r.id) : undefined,
    label: String(r.label ?? ''),
    description: r.description != null ? String(r.description) : '',
    is_active: r.is_active !== false,
    sort_order: r.sort_order != null ? Number(r.sort_order) : i,
  }))
}

function ShippingModesWithDelays() {
  const { data: modes, isLoading } = shippingModeHooks.useList()
  const create = shippingModeHooks.useCreate()
  const update = shippingModeHooks.useUpdate()
  const del = shippingModeHooks.useDelete()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setEditItem(null)
    setForm({
      name: '',
      description: '',
      is_active: true,
      sort_order: 0,
      volumetric_divisor: '' as string | number,
      delivery_times: [] as DeliveryTimeFormRow[],
    })
    setSheetOpen(true)
  }

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item)
    setForm({
      name: item.name ?? '',
      description: item.description ?? '',
      is_active: item.is_active !== false,
      sort_order: item.sort_order ?? 0,
      volumetric_divisor:
        item.volumetric_divisor != null && item.volumetric_divisor !== ''
          ? String(item.volumetric_divisor)
          : '',
      delivery_times: normalizeModeDeliveryTimes(item),
    })
    setSheetOpen(true)
  }

  const addDelayRow = () => {
    const rows = (form.delivery_times as DeliveryTimeFormRow[]) ?? []
    setForm((p) => ({
      ...p,
      delivery_times: [
        ...rows,
        { label: '', description: '', is_active: true, sort_order: rows.length },
      ],
    }))
  }

  const updateDelayRow = (index: number, patch: Partial<DeliveryTimeFormRow>) => {
    const rows = [...((form.delivery_times as DeliveryTimeFormRow[]) ?? [])]
    rows[index] = { ...rows[index], ...patch }
    set('delivery_times', rows)
  }

  const removeDelayRow = (index: number) => {
    const rows = [...((form.delivery_times as DeliveryTimeFormRow[]) ?? [])]
    rows.splice(index, 1)
    set('delivery_times', rows)
  }

  const buildPayload = () => {
    const rows = ((form.delivery_times as DeliveryTimeFormRow[]) ?? [])
      .filter((r) => String(r.label ?? '').trim() !== '')
      .map((r, i) => ({
        id: r.id,
        label: String(r.label).trim(),
        description: r.description ? String(r.description) : null,
        is_active: r.is_active !== false,
        sort_order: r.sort_order ?? i,
      }))

    const vd = String(form.volumetric_divisor ?? '').trim()
    const volumetricDivisor =
      vd === '' ? null : (() => {
        const n = parseInt(vd, 10)
        return Number.isFinite(n) && n >= 1 ? n : null
      })()

    return {
      name: String(form.name ?? '').trim(),
      description: form.description ? String(form.description) : null,
      is_active: form.is_active !== false,
      sort_order: Number(form.sort_order) || 0,
      volumetric_divisor: volumetricDivisor,
      delivery_times: rows,
    }
  }

  const handleSubmit = () => {
    const payload = buildPayload()
    if (!payload.name) return
    if (editItem?.id != null) {
      update.mutate(
        { id: editItem.id as number, data: payload },
        { onSuccess: () => setSheetOpen(false) }
      )
    } else {
      create.mutate(payload as Record<string, unknown>, { onSuccess: () => setSheetOpen(false) })
    }
  }

  const modeRows = Array.isArray(modes) ? modes : []

  return (
    <>
      <SettingsCard
        title="Modes d'expédition & délais"
        icon={Truck}
        badge={`${modeRows.length}`}
        isLoading={isLoading}
        description="Les délais de livraison se gèrent ici, par mode (plus de liste globale séparée)."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter un mode
          </Button>
        }
      >
        <div className="space-y-2">
          {modeRows.map((item: Record<string, unknown>) => {
            const dts = normalizeModeDeliveryTimes(item)
            return (
              <div
                key={String(item.id)}
                className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{displayLocalized(String(item.name ?? ''))}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {displayLocalized(String(item.description))}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1 align-middle" />
                    {dts.length} délai{dts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
                        <AlertDialogTitle>Supprimer ce mode ?</AlertDialogTitle>
                        <AlertDialogDescription>Les délais associés seront supprimés.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del.mutate(item.id as number)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
          {modeRows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun mode d'expédition</p>
          )}
        </div>
      </SettingsCard>

      <CrudSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editItem ? 'Modifier le mode' : 'Nouveau mode'}
        onSubmit={handleSubmit}
        isLoading={create.isPending || update.isPending}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={String(form.name ?? '')} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={String(form.description ?? '')}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Ordre d'affichage</Label>
            <Input
              type="number"
              min={0}
              value={form.sort_order ?? 0}
              onChange={(e) => set('sort_order', Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Diviseur volumétrique par défaut (cm³/kg, optionnel)</Label>
            <Input
              placeholder="ex. 5000 ou 6000 (IATA)"
              value={String(form.volumetric_divisor ?? '')}
              onChange={(e) => set('volumetric_divisor', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Actif</Label>
            <Switch checked={form.is_active !== false} onCheckedChange={(v) => set('is_active', v)} />
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">Délais pour ce mode</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDelayRow}>
                <Plus className="h-3 w-3 mr-1" />
                Ajouter un délai
              </Button>
            </div>
            {((form.delivery_times as DeliveryTimeFormRow[]) ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun délai — vous pouvez en ajouter.</p>
            ) : null}
            {((form.delivery_times as DeliveryTimeFormRow[]) ?? []).map((row, idx) => (
              <div key={idx} className="grid gap-2 rounded-md bg-muted/40 p-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Libellé</Label>
                  <Input
                    value={row.label}
                    onChange={(e) => updateDelayRow(idx, { label: e.target.value })}
                    placeholder="ex. 3–5 jours ouvrés"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description (optionnel)</Label>
                  <Input
                    value={String(row.description ?? '')}
                    onChange={(e) => updateDelayRow(idx, { description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-stretch">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.is_active !== false}
                      onCheckedChange={(v) => updateDelayRow(idx, { is_active: v })}
                    />
                    <span className="text-xs text-muted-foreground">Actif</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDelayRow(idx)}>
                    Retirer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CrudSheet>
    </>
  )
}

function CrudList({
  title,
  icon: Icon,
  entityType,
  nameField = 'name',
  extraFields,
  initialCreateDefaults,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
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

  const list = Array.isArray(items) ? items : []

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
          {list.map((item: Record<string, unknown>) => (
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

export default function ShippingTab() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Transport & Logistique</h2>
        <p className="text-sm text-muted-foreground">Modes, délais, emballages, transporteurs, lignes et catégories</p>
      </motion.div>

      <Tabs defaultValue="modes" className="w-full">
        <TabsList className={`${settingsInnerTabsList} flex flex-wrap gap-1 h-auto min-h-10 py-1`}>
          <TabsTrigger value="modes" className={settingsInnerTabsTrigger}>
            Modes d&apos;expédition
          </TabsTrigger>
          <TabsTrigger value="packaging" className={settingsInnerTabsTrigger}>
            Emballages
          </TabsTrigger>
          <TabsTrigger value="delivery" className={settingsInnerTabsTrigger}>
            Transporteurs
          </TabsTrigger>
          <TabsTrigger value="lines" className={settingsInnerTabsTrigger}>
            Lignes
          </TabsTrigger>
          <TabsTrigger value="categories" className={settingsInnerTabsTrigger}>
            Catégories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modes" className={settingsInnerTabsContent}>
          <ShippingModesWithDelays />
        </TabsContent>

        <TabsContent value="packaging" className={settingsInnerTabsContent}>
          <CrudList
            title="Types d'emballage"
            icon={Package}
            entityType="packaging_type"
            initialCreateDefaults={{ is_billable: false, unit_price: 0 }}
            extraFields={[
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'is_billable', label: "Facturable (prix × quantité totale d'articles)", type: 'switch' },
              { key: 'unit_price', label: 'Prix unitaire', type: 'number', step: '0.01' },
            ]}
          />
        </TabsContent>

        <TabsContent value="delivery" className={settingsInnerTabsContent}>
          <CrudList
            title="Transporteurs"
            icon={Building}
            entityType="transport_company"
            extraFields={[{ key: 'contact', label: 'Contact' }]}
          />
        </TabsContent>

        <TabsContent value="lines" className={settingsInnerTabsContent}>
          <ShipLinesCard />
        </TabsContent>

        <TabsContent value="categories" className={settingsInnerTabsContent}>
          <CrudList
            title="Categories d'articles"
            icon={Tag}
            entityType="article_category"
            extraFields={[{ key: 'description', label: 'Description', type: 'textarea' }]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
