import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Store } from 'lucide-react'

import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { MerchantsSettingsTable } from '@/components/settings/merchant/MerchantsSettingsTable'
import { MerchantCrudFormFields } from '@/components/settings/merchant/MerchantCrudFormFields'
import {
  emptyMerchantForm,
  type MerchantSheetMode,
  type MerchantFormState,
  type SettingsMerchantRow,
} from '@/components/settings/merchant/merchantTypes'

export type { SettingsMerchantRow } from '@/components/settings/merchant/merchantTypes'

export default function MerchantSettings() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<MerchantSheetMode>('create')
  const [editing, setEditing] = useState<SettingsMerchantRow | null>(null)
  const [form, setForm] = useState(emptyMerchantForm)
  const set = (k: keyof MerchantFormState, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }))

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'merchants'],
    queryFn: () => api.get<{ merchants: SettingsMerchantRow[] }>('/api/settings/merchants').then((r) => r.data),
  })

  const merchants = data?.merchants ?? []

  const saveMutation = useMutation({
    mutationFn: async () => {
      const domains = form.domainsInput
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
      const body = {
        name: form.name.trim(),
        domains,
        logo_url: form.logo_url.trim() || null,
        commission_rate: form.commission_rate !== '' ? Number(form.commission_rate) : 0,
        estimated_delivery_days:
          form.estimated_delivery_days !== '' ? Number(form.estimated_delivery_days) : null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      }
      if (mode === 'create') {
        await api.post('/api/settings/merchants', body)
      } else if (editing) {
        await api.patch(`/api/settings/merchants/${editing.id}`, body)
      }
    },
    onSuccess: () => {
      toast.success(mode === 'create' ? 'Marchand créé.' : 'Marchand mis à jour.')
      void qc.invalidateQueries({ queryKey: ['settings', 'merchants'] })
      void qc.invalidateQueries({ queryKey: ['merchants', 'active'] })
      setOpen(false)
      setEditing(null)
      setForm(emptyMerchantForm())
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Enregistrement impossible.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (merchantId: number) => api.delete(`/api/settings/merchants/${merchantId}`),
    onSuccess: () => {
      toast.success('Marchand supprimé.')
      void qc.invalidateQueries({ queryKey: ['settings', 'merchants'] })
      void qc.invalidateQueries({ queryKey: ['merchants', 'active'] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Suppression impossible.'))
    },
  })

  const openCreate = () => {
    setMode('create')
    setEditing(null)
    setForm(emptyMerchantForm())
    setOpen(true)
  }

  const openEdit = (m: SettingsMerchantRow) => {
    setMode('edit')
    setEditing(m)
    const doms = Array.isArray(m.domains) ? m.domains.filter(Boolean).join(', ') : ''
    setForm({
      name: m.name,
      domainsInput: doms,
      logo_url: m.logo_url ?? '',
      commission_rate: m.commission_rate != null ? String(m.commission_rate) : '',
      estimated_delivery_days: m.estimated_delivery_days != null ? String(m.estimated_delivery_days) : '',
      is_active: m.is_active,
      sort_order: String(m.sort_order ?? 0),
    })
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1 text-foreground">Marchands (shopping assisté)</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Définissez les marchands reconnus (logos, domaines et alias comme{' '}
          <span className="font-mono text-xs">amzn.eu</span>) pour l’auto-détection côté client et l’affichage
          visuel lors du chiffrage.
        </p>
      </motion.div>

      <SettingsCard
        title="Marchands configurés"
        icon={Store}
        badge={`${merchants.length}`}
        isLoading={isLoading}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        }
      >
        <MerchantsSettingsTable merchants={merchants} onEdit={openEdit} deleteMutation={deleteMutation} />
      </SettingsCard>

      <CrudSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
        title={mode === 'create' ? 'Nouveau marchand' : 'Modifier le marchand'}
        description="Nom affiché, URL du logo, domaines séparés par des virgules (ex. amazon.fr, amzn.eu)."
        isLoading={saveMutation.isPending}
        onSubmit={() => saveMutation.mutate()}
        submitLabel={mode === 'create' ? 'Créer' : 'Enregistrer'}
      >
        <MerchantCrudFormFields form={form} set={set} />
      </CrudSheet>
    </div>
  )
}
