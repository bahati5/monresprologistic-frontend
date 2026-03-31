import { useState } from 'react'
import { motion } from 'framer-motion'
import { shippingRateHooks, taxHooks, pricingRuleHooks, zoneHooks } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Receipt, Calculator, Globe2, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { ShippingRate, Tax, PricingRule, Zone } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

export default function PricingTab() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Tarifs & Taxes</h2>
        <p className="text-sm text-muted-foreground">Grilles tarifaires, taxes et regles de tarification</p>
      </motion.div>

      <Tabs defaultValue="rates" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="rates" className={settingsInnerTabsTrigger}>Grilles</TabsTrigger>
          <TabsTrigger value="taxes" className={settingsInnerTabsTrigger}>Taxes</TabsTrigger>
          <TabsTrigger value="rules" className={settingsInnerTabsTrigger}>Regles</TabsTrigger>
          <TabsTrigger value="zones" className={settingsInnerTabsTrigger}>Zones</TabsTrigger>
        </TabsList>
        <TabsContent value="rates" className={settingsInnerTabsContent}>
          <ShippingRatesCard />
        </TabsContent>
        <TabsContent value="taxes" className={settingsInnerTabsContent}>
          <TaxesCard />
        </TabsContent>
        <TabsContent value="rules" className={settingsInnerTabsContent}>
          <PricingRulesCard />
        </TabsContent>
        <TabsContent value="zones" className={settingsInnerTabsContent}>
          <ZonesCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ShippingRatesCard() {
  const { data: rates, isLoading } = shippingRateHooks.useList()
  const create = shippingRateHooks.useCreate()
  const update = shippingRateHooks.useUpdate()
  const del = shippingRateHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShippingRate | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setEditItem(null); setForm({ rate_type: 'per_kg', is_active: true }); setOpen(true) }
  const openEdit = (r: ShippingRate) => { setEditItem(r); setForm({ ...r }); setOpen(true) }

  const handleSubmit = () => {
    if (editItem) update.mutate({ id: editItem.id, data: form }, { onSuccess: () => setOpen(false) })
    else create.mutate(form as any, { onSuccess: () => setOpen(false) })
  }

  return (
    <>
      <SettingsCard title="Grilles tarifaires" icon={DollarSign} badge={`${rates?.length ?? 0}`} isLoading={isLoading}
        actions={<Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" />Ajouter</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Prix</th>
              <th className="py-2 pr-3 font-medium">Poids min</th>
              <th className="py-2 pr-3 font-medium">Poids max</th>
              <th className="py-2 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {rates?.map((r: ShippingRate) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-3"><Badge variant="outline">{r.rate_type}</Badge></td>
                  <td className="py-2 pr-3 font-medium">{r.price}</td>
                  <td className="py-2 pr-3">{r.min_weight ?? '-'}</td>
                  <td className="py-2 pr-3">{r.max_weight ?? '-'}</td>
                  <td className="py-2 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil size={13} /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 size={13} /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Supprimer ce tarif ?</AlertDialogTitle><AlertDialogDescription>Irreversible.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(r.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!rates || rates.length === 0) && <p className="text-center text-muted-foreground py-4 text-sm">Aucun tarif</p>}
        </div>
      </SettingsCard>

      <CrudSheet open={open} onOpenChange={setOpen} title={editItem ? 'Modifier le tarif' : 'Nouveau tarif'} onSubmit={handleSubmit} isLoading={create.isPending || update.isPending}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.rate_type || 'per_kg'} onValueChange={v => set('rate_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="per_kg">Par kg</SelectItem>
                <SelectItem value="per_volume">Par volume</SelectItem>
                <SelectItem value="flat">Forfait</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Prix</Label><Input type="number" step="0.01" value={form.price ?? ''} onChange={e => set('price', Number(e.target.value))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Poids min (kg)</Label><Input type="number" step="0.1" value={form.min_weight ?? ''} onChange={e => set('min_weight', Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Poids max (kg)</Label><Input type="number" step="0.1" value={form.max_weight ?? ''} onChange={e => set('max_weight', Number(e.target.value))} /></div>
          </div>
          <div className="flex items-center justify-between"><Label>Actif</Label><Switch checked={form.is_active !== false} onCheckedChange={v => set('is_active', v)} /></div>
        </div>
      </CrudSheet>
    </>
  )
}

function TaxesCard() {
  const { data: taxes, isLoading } = taxHooks.useList()
  const create = taxHooks.useCreate()
  const del = taxHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({ type: 'percentage', is_active: true })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <SettingsCard title="Taxes & Frais" icon={Receipt} badge={`${taxes?.length ?? 0}`} isLoading={isLoading}
        actions={<Button size="sm" onClick={() => { setForm({ type: 'percentage', is_active: true }); setOpen(true) }}><Plus size={14} className="mr-1" />Ajouter</Button>}>
        <div className="space-y-2">
          {taxes?.map((t: Tax) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{displayLocalized(t.name as unknown)}</p>
                <p className="text-xs text-muted-foreground">{t.type === 'percentage' ? `${t.value}%` : `${t.value} fixe`}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Supprimer cette taxe ?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(t.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!taxes || taxes.length === 0) && <p className="text-center text-muted-foreground py-4 text-sm">Aucune taxe</p>}
        </div>
      </SettingsCard>

      <CrudSheet open={open} onOpenChange={setOpen} title="Nouvelle taxe" onSubmit={() => create.mutate(form as any, { onSuccess: () => setOpen(false) })} isLoading={create.isPending}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nom</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percentage">Pourcentage</SelectItem><SelectItem value="fixed">Fixe</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Valeur</Label><Input type="number" step="0.01" value={form.value ?? ''} onChange={e => set('value', Number(e.target.value))} /></div>
        </div>
      </CrudSheet>
    </>
  )
}

function PricingRulesCard() {
  const { data: rules, isLoading } = pricingRuleHooks.useList()
  const create = pricingRuleHooks.useCreate()
  const del = pricingRuleHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <SettingsCard title="Regles de tarification" icon={Calculator} badge={`${rules?.length ?? 0}`} isLoading={isLoading}
        actions={<Button size="sm" onClick={() => { setForm({}); setOpen(true) }}><Plus size={14} className="mr-1" />Ajouter</Button>}>
        <div className="space-y-2">
          {rules?.map((r: PricingRule) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
              <div><p className="font-medium text-sm">{displayLocalized(r.name as unknown)}</p><p className="text-xs text-muted-foreground">{r.type} — valeur: {r.value}</p></div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(r.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!rules || rules.length === 0) && <p className="text-center text-muted-foreground py-4 text-sm">Aucune regle</p>}
        </div>
      </SettingsCard>

      <CrudSheet open={open} onOpenChange={setOpen} title="Nouvelle regle" onSubmit={() => create.mutate(form as any, { onSuccess: () => setOpen(false) })} isLoading={create.isPending}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nom</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div className="space-y-2"><Label>Type</Label><Input value={form.type || ''} onChange={e => set('type', e.target.value)} /></div>
          <div className="space-y-2"><Label>Valeur</Label><Input type="number" step="0.01" value={form.value ?? ''} onChange={e => set('value', Number(e.target.value))} /></div>
        </div>
      </CrudSheet>
    </>
  )
}

function ZonesCard() {
  const { data: zones, isLoading } = zoneHooks.useList()
  const create = zoneHooks.useCreate()
  const del = zoneHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <SettingsCard title="Zones geographiques" icon={Globe2} badge={`${zones?.length ?? 0}`} isLoading={isLoading}
        actions={<Button size="sm" onClick={() => { setForm({}); setOpen(true) }}><Plus size={14} className="mr-1" />Ajouter</Button>}>
        <div className="space-y-2">
          {zones?.map((z: Zone) => (
            <div key={z.id} className="flex items-center justify-between rounded-lg border p-3">
              <div><p className="font-medium text-sm">{displayLocalized(z.name as unknown)}</p>{z.description && <p className="text-xs text-muted-foreground">{displayLocalized(z.description as unknown)}</p>}</div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(z.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!zones || zones.length === 0) && <p className="text-center text-muted-foreground py-4 text-sm">Aucune zone</p>}
        </div>
      </SettingsCard>

      <CrudSheet open={open} onOpenChange={setOpen} title="Nouvelle zone" onSubmit={() => create.mutate(form as any, { onSuccess: () => setOpen(false) })} isLoading={create.isPending}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nom</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div className="space-y-2"><Label>Description</Label><Input value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
        </div>
      </CrudSheet>
    </>
  )
}
