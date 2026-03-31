import { useState } from 'react'
import { motion } from 'framer-motion'
import { agencyHooks, officeHooks } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPinHouse, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Agency, Office } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

export default function AgenciesTab() {
  const { data: agencies, isLoading: loadingA } = agencyHooks.useList()
  const createAgency = agencyHooks.useCreate()
  const updateAgency = agencyHooks.useUpdate()

  const { data: offices, isLoading: loadingO } = officeHooks.useList()
  const createOffice = officeHooks.useCreate()
  const updateOffice = officeHooks.useUpdate()
  const deleteOffice = officeHooks.useDelete()

  const [sheetType, setSheetType] = useState<'agency' | 'office' | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  const openCreate = (type: 'agency' | 'office') => {
    setSheetType(type)
    setEditItem(null)
    setForm({})
  }

  const openEdit = (type: 'agency' | 'office', item: any) => {
    setSheetType(type)
    setEditItem(item)
    setForm({ ...item })
  }

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (sheetType === 'agency') {
      if (editItem) {
        updateAgency.mutate({ id: editItem.id, data: form }, { onSuccess: () => setSheetType(null) })
      } else {
        createAgency.mutate(form as any, { onSuccess: () => setSheetType(null) })
      }
    } else {
      if (editItem) {
        updateOffice.mutate({ id: editItem.id, data: form }, { onSuccess: () => setSheetType(null) })
      } else {
        createOffice.mutate(form as any, { onSuccess: () => setSheetType(null) })
      }
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Agences & Bureaux</h2>
        <p className="text-sm text-muted-foreground">Gestion des succursales et points de service</p>
      </motion.div>

      <Tabs defaultValue="agencies" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="agencies" className={settingsInnerTabsTrigger}>Agences</TabsTrigger>
          <TabsTrigger value="offices" className={settingsInnerTabsTrigger}>Bureaux</TabsTrigger>
        </TabsList>

        <TabsContent value="agencies" className={settingsInnerTabsContent}>
      <SettingsCard
        title="Agences / Succursales"
        icon={Building2}
        badge={`${agencies?.length ?? 0}`}
        isLoading={loadingA}
        actions={<Button size="sm" onClick={() => openCreate('agency')}><Plus size={14} className="mr-1" />Ajouter</Button>}
      >
        <div className="space-y-2">
          {agencies?.map((a: Agency) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                {a.color && <div className="w-3 h-3 rounded-full" style={{ background: a.color }} />}
                <div>
                  <p className="font-medium text-sm">{displayLocalized(a.name as unknown)}</p>
                  <p className="text-xs text-muted-foreground">{a.city}, {a.country} — {a.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-xs">
                  {a.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit('agency', a)}>
                  <Pencil size={14} />
                </Button>
              </div>
            </div>
          ))}
          {(!agencies || agencies.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucune agence</p>}
        </div>
      </SettingsCard>
        </TabsContent>

        <TabsContent value="offices" className={settingsInnerTabsContent}>
      <SettingsCard
        title="Bureaux / Points de service"
        icon={MapPinHouse}
        badge={`${offices?.length ?? 0}`}
        isLoading={loadingO}
        actions={<Button size="sm" onClick={() => openCreate('office')}><Plus size={14} className="mr-1" />Ajouter</Button>}
      >
        <div className="space-y-2">
          {offices?.map((o: Office) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-sm">{displayLocalized(o.name as unknown)}</p>
                <p className="text-xs text-muted-foreground">{o.city}, {o.country}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit('office', o)}>
                  <Pencil size={14} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce bureau ?</AlertDialogTitle>
                      <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteOffice.mutate(o.id)}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {(!offices || offices.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucun bureau</p>}
        </div>
      </SettingsCard>
        </TabsContent>
      </Tabs>

      <CrudSheet
        open={!!sheetType}
        onOpenChange={() => setSheetType(null)}
        title={editItem ? `Modifier ${sheetType === 'agency' ? 'l\'agence' : 'le bureau'}` : `Nouveau ${sheetType === 'agency' ? 'agence' : 'bureau'}`}
        onSubmit={handleSubmit}
        isLoading={createAgency.isPending || updateAgency.isPending || createOffice.isPending || updateOffice.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={form.name || ''} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={form.address || ''} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={form.city || ''} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={form.country || ''} onChange={e => set('country', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Telephone</Label>
            <Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
          </div>
          {sheetType === 'agency' && (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Input type="color" value={form.color || '#0e7490'} onChange={e => set('color', e.target.value)} className="h-10 w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.is_active !== false} onCheckedChange={v => set('is_active', v)} />
              </div>
            </>
          )}
        </div>
      </CrudSheet>
    </div>
  )
}
