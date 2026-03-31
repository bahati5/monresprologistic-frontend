import { useState } from 'react'
import { motion } from 'framer-motion'
import { statusHooks, useWorkflows, useCreateWorkflow, useDeleteWorkflow } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Workflow, CircleDot, Plus, Pencil, Trash2, ArrowRight } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Status, WorkflowTransition } from '@/types/settings'
import { displayLocalized, resolveLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

export default function WorkflowsTab() {
  const { data: statuses, isLoading: loadingS } = statusHooks.useList()
  const createStatus = statusHooks.useCreate()
  const updateStatus = statusHooks.useUpdate()
  const deleteStatus = statusHooks.useDelete()

  const { data: transitions, isLoading: loadingW } = useWorkflows()
  const createTransition = useCreateWorkflow()
  const deleteTransition = useDeleteWorkflow()

  const [statusSheet, setStatusSheet] = useState(false)
  const [transitionSheet, setTransitionSheet] = useState(false)
  const [editStatus, setEditStatus] = useState<Status | null>(null)
  const [sForm, setSForm] = useState<Record<string, any>>({})
  const [tForm, setTForm] = useState<Record<string, any>>({})

  const sSet = (k: string, v: any) => setSForm(p => ({ ...p, [k]: v }))
  const tSet = (k: string, v: any) => setTForm(p => ({ ...p, [k]: v }))

  const openCreateStatus = () => { setEditStatus(null); setSForm({ color: '#3B82F6', is_active: true, entity_type: 'shipment' }); setStatusSheet(true) }
  const openEditStatus = (s: Status) => {
    setEditStatus(s)
    setSForm({ ...s, name: resolveLocalized(s.name as unknown) || (typeof s.name === 'string' ? s.name : '') })
    setStatusSheet(true)
  }

  const handleSubmitStatus = () => {
    if (editStatus) {
      updateStatus.mutate({ id: editStatus.id, data: sForm }, { onSuccess: () => setStatusSheet(false) })
    } else {
      createStatus.mutate(sForm as any, { onSuccess: () => setStatusSheet(false) })
    }
  }

  const handleSubmitTransition = () => {
    createTransition.mutate({
      from_status_id: Number(tForm.from_status_id),
      to_status_id: Number(tForm.to_status_id),
      roles: tForm.roles ? tForm.roles.split(',').map((r: string) => r.trim()) : [],
    }, { onSuccess: () => setTransitionSheet(false) })
  }

  const statusList = Array.isArray(statuses) ? statuses : []

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Statuts & Workflows</h2>
        <p className="text-sm text-muted-foreground">Definir les etapes et les transitions autorisees</p>
      </motion.div>

      <Tabs defaultValue="statuses" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="statuses" className={settingsInnerTabsTrigger}>Statuts</TabsTrigger>
          <TabsTrigger value="transitions" className={settingsInnerTabsTrigger}>Transitions</TabsTrigger>
        </TabsList>

        <TabsContent value="statuses" className={settingsInnerTabsContent}>
      <SettingsCard
        title="Statuts"
        icon={CircleDot}
        badge={`${statusList.length}`}
        isLoading={loadingS}
        actions={<Button size="sm" onClick={openCreateStatus}><Plus size={14} className="mr-1" />Ajouter</Button>}
      >
        <div className="space-y-2">
          {statusList.map((s: Status) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: s.color, borderColor: s.color }} />
                <div>
                  <p className="font-medium text-sm">{displayLocalized(s.name as unknown)}</p>
                  <p className="text-xs text-muted-foreground">Code: {s.code} — Ordre: {s.sort_order} — {s.entity_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs">{s.is_active ? 'Actif' : 'Inactif'}</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditStatus(s)}><Pencil size={14} /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Supprimer ce statut ?</AlertDialogTitle><AlertDialogDescription>Les expeditions avec ce statut ne seront pas affectees.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteStatus.mutate(s.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {statusList.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun statut</p>}
        </div>
      </SettingsCard>
        </TabsContent>

        <TabsContent value="transitions" className={settingsInnerTabsContent}>
      <SettingsCard
        title="Transitions (Workflow)"
        icon={Workflow}
        badge={`${Array.isArray(transitions) ? transitions.length : 0}`}
        isLoading={loadingW}
        actions={<Button size="sm" onClick={() => { setTForm({}); setTransitionSheet(true) }}><Plus size={14} className="mr-1" />Ajouter</Button>}
      >
        <div className="space-y-2">
          {Array.isArray(transitions) && transitions.map((t: WorkflowTransition) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" style={{ borderColor: t.from_status?.color }}>{displayLocalized(t.from_status?.name as unknown, '') || `#${t.from_status_id}`}</Badge>
                <ArrowRight size={14} className="text-muted-foreground" />
                <Badge variant="outline" style={{ borderColor: t.to_status?.color }}>{displayLocalized(t.to_status?.name as unknown, '') || `#${t.to_status_id}`}</Badge>
                {t.roles?.length > 0 && <span className="text-xs text-muted-foreground ml-2">({t.roles.join(', ')})</span>}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Supprimer cette transition ?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteTransition.mutate(t.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!Array.isArray(transitions) || transitions.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucune transition</p>}
        </div>
      </SettingsCard>
        </TabsContent>
      </Tabs>

      <CrudSheet open={statusSheet} onOpenChange={setStatusSheet} title={editStatus ? 'Modifier le statut' : 'Nouveau statut'} onSubmit={handleSubmitStatus} isLoading={createStatus.isPending || updateStatus.isPending}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nom</Label><Input value={sForm.name || ''} onChange={e => sSet('name', e.target.value)} /></div>
          <div className="space-y-2"><Label>Code</Label><Input value={sForm.code || ''} onChange={e => sSet('code', e.target.value)} placeholder="ex: in_transit" /></div>
          <div className="space-y-2">
            <Label>Entite</Label>
            <Select value={sForm.entity_type || 'shipment'} onValueChange={v => sSet('entity_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shipment">Expedition</SelectItem>
                <SelectItem value="customer_package">Colis client</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="consolidation">Consolidation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Couleur</Label><Input type="color" value={sForm.color || '#3B82F6'} onChange={e => sSet('color', e.target.value)} className="h-10 w-20" /></div>
            <div className="space-y-2"><Label>Icone Lucide</Label><Input value={sForm.icon || ''} onChange={e => sSet('icon', e.target.value)} placeholder="FilePlus" /></div>
          </div>
          <div className="space-y-2"><Label>Ordre de tri</Label><Input type="number" value={sForm.sort_order ?? ''} onChange={e => sSet('sort_order', Number(e.target.value))} /></div>
          <div className="flex items-center justify-between"><Label>Actif</Label><Switch checked={sForm.is_active !== false} onCheckedChange={v => sSet('is_active', v)} /></div>
        </div>
      </CrudSheet>

      <CrudSheet open={transitionSheet} onOpenChange={setTransitionSheet} title="Nouvelle transition" onSubmit={handleSubmitTransition} isLoading={createTransition.isPending}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Statut de depart</Label>
            <Select value={String(tForm.from_status_id || '')} onValueChange={v => tSet('from_status_id', v)}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>{statusList.map(s => <SelectItem key={s.id} value={String(s.id)}>{displayLocalized(s.name as unknown)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Statut d'arrivee</Label>
            <Select value={String(tForm.to_status_id || '')} onValueChange={v => tSet('to_status_id', v)}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>{statusList.map(s => <SelectItem key={s.id} value={String(s.id)}>{displayLocalized(s.name as unknown)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Roles autorises (separes par virgule)</Label>
            <Input value={tForm.roles || ''} onChange={e => tSet('roles', e.target.value)} placeholder="admin, employee" />
          </div>
        </div>
      </CrudSheet>
    </div>
  )
}
