import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  paymentMethodHooks, agencyPaymentCoordinateHooks,
  usePaymentGateways, useUpdatePaymentGateways,
} from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Banknote, Landmark, Plus, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { PaymentMethod, AgencyPaymentCoordinate } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

export default function PaymentsTab() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Paiements</h2>
        <p className="text-sm text-muted-foreground">Methodes de paiement, passerelles et coordonnees bancaires</p>
      </motion.div>

      <Tabs defaultValue="methods" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="methods" className={settingsInnerTabsTrigger}>Methodes</TabsTrigger>
          <TabsTrigger value="gateways" className={settingsInnerTabsTrigger}>Passerelles</TabsTrigger>
          <TabsTrigger value="coordinates" className={settingsInnerTabsTrigger}>Coordonnees</TabsTrigger>
        </TabsList>
        <TabsContent value="methods" className={settingsInnerTabsContent}>
          <PaymentMethodsCard />
        </TabsContent>
        <TabsContent value="gateways" className={settingsInnerTabsContent}>
          <PaymentGatewaysCard />
        </TabsContent>
        <TabsContent value="coordinates" className={settingsInnerTabsContent}>
          <AgencyCoordinatesCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PaymentMethodsCard() {
  const { data: methods, isLoading } = paymentMethodHooks.useList()
  const create = paymentMethodHooks.useCreate()
  const del = paymentMethodHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({ is_active: true })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <SettingsCard title="Methodes de paiement" icon={Banknote} badge={`${methods?.length ?? 0}`} isLoading={isLoading}
        actions={<Button size="sm" onClick={() => { setForm({ is_active: true }); setOpen(true) }}><Plus size={14} className="mr-1" />Ajouter</Button>}>
        <div className="space-y-2">
          {methods?.map((m: PaymentMethod) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
              <div><p className="font-medium text-sm">{displayLocalized(m.name as unknown)}</p>{m.description && <p className="text-xs text-muted-foreground">{displayLocalized(m.description as unknown)}</p>}</div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle><AlertDialogDescription>Irreversible.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(m.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!methods || methods.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucune methode</p>}
        </div>
      </SettingsCard>

      <CrudSheet open={open} onOpenChange={setOpen} title="Nouvelle methode" onSubmit={() => create.mutate(form as any, { onSuccess: () => setOpen(false) })} isLoading={create.isPending}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Nom</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
        </div>
      </CrudSheet>
    </>
  )
}

function PaymentGatewaysCard() {
  const { data: gateways, isLoading } = usePaymentGateways()
  const update = useUpdatePaymentGateways()
  const [form, setForm] = useState<Record<string, any>>({})

  useEffect(() => { if (gateways) setForm(gateways) }, [gateways])

  const set = (gateway: string, key: string, value: any) => {
    setForm(p => ({
      ...p,
      [gateway]: { ...(p[gateway] || {}), [key]: value },
    }))
  }

  const handleSave = () => update.mutate(form)

  const gatewayList = [
    { key: 'paypal', label: 'PayPal', fields: ['client_id', 'client_secret', 'mode'], functional: false },
    { key: 'stripe', label: 'Stripe', fields: ['publishable_key', 'secret_key', 'webhook_secret'], functional: false },
    { key: 'paystack', label: 'Paystack', fields: ['public_key', 'secret_key'], functional: false },
    { key: 'wire_transfer', label: 'Virement bancaire', fields: ['bank_name', 'account_number', 'iban', 'swift'], functional: true },
  ]

  return (
    <SettingsCard title="Passerelles de paiement en ligne" icon={CreditCard} isLoading={isLoading}>
      <div className="space-y-6">
        {gatewayList.map(gw => {
          const cfg = form[gw.key] || {}
          return (
            <div key={gw.key} className={cn("rounded-lg border p-4 space-y-3", !gw.functional && "opacity-60 bg-muted/20 grayscale-[0.5]")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{gw.label}</p>
                  {!gw.functional && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-500/10">Bientôt disponible</Badge>
                  )}
                </div>
                <Switch checked={!!cfg.is_active} onCheckedChange={v => set(gw.key, 'is_active', v)} disabled={!gw.functional} />
              </div>
              {cfg.is_active && gw.functional && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {gw.fields.map(f => (
                    <div key={f} className="space-y-1">
                      <Label className="text-xs">{f.replace(/_/g, ' ')}</Label>
                      <Input
                        type={f.includes('secret') || f.includes('token') ? 'password' : 'text'}
                        value={cfg.config?.[f] || cfg[f] || ''}
                        onChange={e => set(gw.key, f, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? 'Enregistrement...' : 'Enregistrer les passerelles'}
          </Button>
        </div>
      </div>
    </SettingsCard>
  )
}

function AgencyCoordinatesCard() {
  const { data: coords, isLoading } = agencyPaymentCoordinateHooks.useList()
  const create = agencyPaymentCoordinateHooks.useCreate()
  const del = agencyPaymentCoordinateHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <SettingsCard title="Coordonnees de paiement par agence" icon={Landmark} badge={`${coords?.length ?? 0}`} isLoading={isLoading}
        actions={<Button size="sm" onClick={() => { setForm({}); setOpen(true) }}><Plus size={14} className="mr-1" />Ajouter</Button>}>
        <div className="space-y-2">
          {coords?.map((c: AgencyPaymentCoordinate) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{c.label}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{c.details}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(c.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!coords || coords.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucune coordonnee</p>}
        </div>
      </SettingsCard>

      <CrudSheet open={open} onOpenChange={setOpen} title="Nouvelle coordonnee" onSubmit={() => create.mutate(form as any, { onSuccess: () => setOpen(false) })} isLoading={create.isPending}>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Libelle</Label><Input value={form.label || ''} onChange={e => set('label', e.target.value)} placeholder="Compte BNP Agence Paris" /></div>
          <div className="space-y-2"><Label>Details</Label><Textarea value={form.details || ''} onChange={e => set('details', e.target.value)} rows={5} placeholder="IBAN: FR76...\nBIC: BNPA..." /></div>
        </div>
      </CrudSheet>
    </>
  )
}
