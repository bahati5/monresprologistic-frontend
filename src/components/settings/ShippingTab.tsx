import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  shippingModeHooks, packagingTypeHooks, deliveryTimeHooks,
  transportCompanyHooks, shipLineHooks, articleCategoryHooks,
} from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Truck, Package, Clock, Building, Ship, Tag, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

type EntityType = 'shipping_mode' | 'packaging_type' | 'delivery_time' | 'transport_company' | 'ship_line' | 'article_category'

const hookMap = {
  shipping_mode: shippingModeHooks,
  packaging_type: packagingTypeHooks,
  delivery_time: deliveryTimeHooks,
  transport_company: transportCompanyHooks,
  ship_line: shipLineHooks,
  article_category: articleCategoryHooks,
}

function CrudList({
  title, icon: Icon, entityType, nameField = 'name', extraFields,
}: {
  title: string
  icon: any
  entityType: EntityType
  nameField?: string
  extraFields?: { key: string; label: string; type?: string }[]
}) {
  const hooks = hookMap[entityType]
  const { data: items, isLoading } = hooks.useList()
  const create = hooks.useCreate()
  const update = hooks.useUpdate()
  const del = hooks.useDelete()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  const openCreate = () => { setEditItem(null); setForm({}); setSheetOpen(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm({ ...item }); setSheetOpen(true) }
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (editItem) {
      update.mutate({ id: editItem.id, data: form }, { onSuccess: () => setSheetOpen(false) })
    } else {
      create.mutate(form as any, { onSuccess: () => setSheetOpen(false) })
    }
  }

  return (
    <>
      <SettingsCard
        title={title}
        icon={Icon}
        badge={`${items?.length ?? 0}`}
        isLoading={isLoading}
        actions={<Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" />Ajouter</Button>}
      >
        <div className="space-y-2">
          {items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-sm">{displayLocalized(item[nameField] || item.label || item.name)}</p>
                {item.description && <p className="text-xs text-muted-foreground">{displayLocalized(item.description)}</p>}
                {item.code && <p className="text-xs text-muted-foreground">Code: {item.code}</p>}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                      <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => del.mutate(item.id)}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {(!items || items.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucun element</p>}
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
            <Input value={form[nameField] || form.name || form.label || ''} onChange={e => set(nameField, e.target.value)} />
          </div>
          {extraFields?.map(f => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              {f.type === 'textarea' ? (
                <Textarea value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
              ) : f.type === 'number' ? (
                <Input type="number" value={form[f.key] ?? ''} onChange={e => set(f.key, Number(e.target.value))} />
              ) : (
                <Input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
              )}
            </div>
          ))}
          {form.is_active !== undefined && (
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch checked={form.is_active !== false} onCheckedChange={v => set('is_active', v)} />
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
        <p className="text-sm text-muted-foreground">Modes d'envoi, emballages, delais, transporteurs</p>
      </motion.div>

      <Tabs defaultValue="modes" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="modes" className={settingsInnerTabsTrigger}>Modes & emballages</TabsTrigger>
          <TabsTrigger value="delivery" className={settingsInnerTabsTrigger}>Delais & transporteurs</TabsTrigger>
          <TabsTrigger value="lines" className={settingsInnerTabsTrigger}>Lignes & categories</TabsTrigger>
        </TabsList>

        <TabsContent value="modes" className={settingsInnerTabsContent}>
          <CrudList
            title="Modes de transport"
            icon={Truck}
            entityType="shipping_mode"
            extraFields={[
              { key: 'code', label: 'Code' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ]}
          />
          <CrudList
            title="Types d'emballage"
            icon={Package}
            entityType="packaging_type"
            extraFields={[{ key: 'description', label: 'Description', type: 'textarea' }]}
          />
        </TabsContent>

        <TabsContent value="delivery" className={settingsInnerTabsContent}>
          <CrudList
            title="Delais de livraison"
            icon={Clock}
            entityType="delivery_time"
            nameField="label"
            extraFields={[
              { key: 'min_days', label: 'Jours min', type: 'number' },
              { key: 'max_days', label: 'Jours max', type: 'number' },
            ]}
          />
          <CrudList
            title="Transporteurs"
            icon={Building}
            entityType="transport_company"
            extraFields={[{ key: 'contact', label: 'Contact' }]}
          />
        </TabsContent>

        <TabsContent value="lines" className={settingsInnerTabsContent}>
          <CrudList
            title="Lignes maritimes / aeriennes"
            icon={Ship}
            entityType="ship_line"
            extraFields={[
              { key: 'origin', label: 'Origine' },
              { key: 'destination', label: 'Destination' },
              { key: 'mode', label: 'Mode' },
            ]}
          />
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
