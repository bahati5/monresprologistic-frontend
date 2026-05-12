import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Save, Timer, Scale, Coins, Clock, FileText } from 'lucide-react'
import { ISO_4217_CURRENCIES } from '@/lib/iso4217'
import { useCurrencyCode } from '@/hooks/settings/useBranding'

interface WorkflowSettings {
  quote_expiry_hours: string
  prealert_expiry_days: string
  draft_shipment_expiry_days: string
  weight_discrepancy_threshold_pct: string
  sav_response_target_hours: string
  refund_threshold_operator: string
  refund_threshold_agency_admin: string
  default_quote_currency: string
  draft_max_per_type: string
  draft_client_expiry_days: string
  draft_staff_expiry_days: string
  draft_autosave_interval_seconds: string
}

const defaults: WorkflowSettings = {
  quote_expiry_hours: '72',
  prealert_expiry_days: '30',
  draft_shipment_expiry_days: '30',
  weight_discrepancy_threshold_pct: '10',
  sav_response_target_hours: '4',
  refund_threshold_operator: '50',
  refund_threshold_agency_admin: '500',
  default_quote_currency: '',
  draft_max_per_type: '5',
  draft_client_expiry_days: '30',
  draft_staff_expiry_days: '7',
  draft_autosave_interval_seconds: '30',
}

function mergeWorkflowSettings(data: Record<string, string> | undefined): WorkflowSettings {
  if (!data) return defaults
  return {
    quote_expiry_hours: data.quote_expiry_hours || defaults.quote_expiry_hours,
    prealert_expiry_days: data.prealert_expiry_days || defaults.prealert_expiry_days,
    draft_shipment_expiry_days: data.draft_shipment_expiry_days || defaults.draft_shipment_expiry_days,
    weight_discrepancy_threshold_pct: data.weight_discrepancy_threshold_pct || defaults.weight_discrepancy_threshold_pct,
    sav_response_target_hours: data.sav_response_target_hours || defaults.sav_response_target_hours,
    refund_threshold_operator: data.refund_threshold_operator || defaults.refund_threshold_operator,
    refund_threshold_agency_admin: data.refund_threshold_agency_admin || defaults.refund_threshold_agency_admin,
    default_quote_currency: data.default_quote_currency || '',
    draft_max_per_type: data.draft_max_per_type || defaults.draft_max_per_type,
    draft_client_expiry_days: data.draft_client_expiry_days || defaults.draft_client_expiry_days,
    draft_staff_expiry_days: data.draft_staff_expiry_days || defaults.draft_staff_expiry_days,
    draft_autosave_interval_seconds: data.draft_autosave_interval_seconds || defaults.draft_autosave_interval_seconds,
  }
}

function WorkflowsForm({ initial }: { initial: WorkflowSettings }) {
  const appCurrency = useCurrencyCode()
  const qc = useQueryClient()
  const [form, setForm] = useState<WorkflowSettings>(() => initial)

  const saveMut = useMutation({
    mutationFn: async () => {
      await api.put('/api/settings/app', form)
      toast.success('Paramètres de workflow enregistrés')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'app'] }),
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  })

  const set = (key: keyof WorkflowSettings, val: string) => setForm((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-primary" /> Délais et expirations</CardTitle>
          <CardDescription>Paramètres déterminant les seuils d'expiration et d'alerte pour les différents workflows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Expiration des devis (heures)</Label>
            <Input type="number" min={1} value={form.quote_expiry_hours} onChange={e => set('quote_expiry_hours', e.target.value)} />
            <p className="text-xs text-muted-foreground">§5.2 — Le devis expire après ce délai sans réponse</p>
          </div>
          <div className="space-y-1.5">
            <Label>Expiration pré-alertes (jours)</Label>
            <Input type="number" min={1} value={form.prealert_expiry_days} onChange={e => set('prealert_expiry_days', e.target.value)} />
            <p className="text-xs text-muted-foreground">§7.2 — Pré-alerte non présentée sous X jours → EXPIRED</p>
          </div>
          <div className="space-y-1.5">
            <Label>Expiration brouillons auto (jours)</Label>
            <Input type="number" min={1} value={form.draft_shipment_expiry_days} onChange={e => set('draft_shipment_expiry_days', e.target.value)} />
            <p className="text-xs text-muted-foreground">Les brouillons d'expédition inactifs sont supprimés après X jours</p>
          </div>
          <div className="space-y-1.5">
            <Label>Délai cible réponse SAV (heures)</Label>
            <Input type="number" min={1} value={form.sav_response_target_hours} onChange={e => set('sav_response_target_hours', e.target.value)} />
            <p className="text-xs text-muted-foreground">§19.3 — Objectif temps de réponse avant alerte</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> Contrôle de poids</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <Label>Seuil d'écart de poids (%)</Label>
            <Input type="number" min={1} max={100} value={form.weight_discrepancy_threshold_pct} onChange={e => set('weight_discrepancy_threshold_pct', e.target.value)} />
            <p className="text-xs text-muted-foreground">§5.4 & §6.5 — Alerte si écart poids &gt; ce seuil (PRD : 10–15 %)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Remboursements — Seuils d'approbation</CardTitle>
          <CardDescription>§9.5 PRD — Montants déterminant le niveau de validation requis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Seuil opérateur ({appCurrency || '…'})</Label>
            <Input type="number" min={0} value={form.refund_threshold_operator} onChange={e => set('refund_threshold_operator', e.target.value)} />
            <p className="text-xs text-muted-foreground">En dessous : un opérateur peut approuver</p>
          </div>
          <div className="space-y-1.5">
            <Label>Seuil agency_admin ({appCurrency || '…'})</Label>
            <Input type="number" min={0} value={form.refund_threshold_agency_admin} onChange={e => set('refund_threshold_agency_admin', e.target.value)} />
            <p className="text-xs text-muted-foreground">Au-dessus : notification super_admin requise</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Devise de référence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <Label>Devise par défaut des devis</Label>
            <Select value={form.default_quote_currency || appCurrency} onValueChange={v => set('default_quote_currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ISO_4217_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">§13 PRD — Devise de référence pour les devis</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Brouillons de formulaires</CardTitle>
          <CardDescription>Limites, expiration et intervalle de sauvegarde automatique pour le système de brouillons générique.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Limite par type de formulaire</Label>
            <Input type="number" min={1} max={50} value={form.draft_max_per_type} onChange={e => set('draft_max_per_type', e.target.value)} />
            <p className="text-xs text-muted-foreground">Nombre max de brouillons simultanés par utilisateur et par type</p>
          </div>
          <div className="space-y-1.5">
            <Label>Expiration brouillons client (jours)</Label>
            <Input type="number" min={1} value={form.draft_client_expiry_days} onChange={e => set('draft_client_expiry_days', e.target.value)} />
            <p className="text-xs text-muted-foreground">Les brouillons des clients expirent après ce délai</p>
          </div>
          <div className="space-y-1.5">
            <Label>Expiration brouillons staff (jours)</Label>
            <Input type="number" min={1} value={form.draft_staff_expiry_days} onChange={e => set('draft_staff_expiry_days', e.target.value)} />
            <p className="text-xs text-muted-foreground">Les brouillons du personnel expirent après ce délai</p>
          </div>
          <div className="space-y-1.5">
            <Label>Intervalle auto-save (secondes)</Label>
            <Input type="number" min={10} max={300} value={form.draft_autosave_interval_seconds} onChange={e => set('draft_autosave_interval_seconds', e.target.value)} />
            <p className="text-xs text-muted-foreground">Fréquence de sauvegarde automatique des brouillons</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" /> Enregistrer les paramètres Workflow
        </Button>
      </div>
    </div>
  )
}

export default function WorkflowsTab() {
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['settings', 'app'],
    queryFn: async () => {
      const res = await api.get('/api/settings/app')
      return res.data.settings as Record<string, string>
    },
  })

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Chargement…</div>

  const initial = mergeWorkflowSettings(data)
  return <WorkflowsForm key={dataUpdatedAt} initial={initial} />
}
