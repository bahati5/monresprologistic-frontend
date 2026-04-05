import { useState } from 'react'
import { motion } from 'framer-motion'
import { agencyHooks } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { AgencyCreateSheet, type AgencySheetPayload } from './AgencyCreateSheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Pencil } from 'lucide-react'
import type { Agency } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'

export default function AgenciesTab() {
  const { data: agencies, isLoading: loadingA } = agencyHooks.useList()
  const createAgency = agencyHooks.useCreate()
  const updateAgency = agencyHooks.useUpdate()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<Agency | null>(null)

  const openCreate = () => {
    setEditItem(null)
    setSheetOpen(true)
  }

  const openEdit = (item: Agency) => {
    setEditItem(item)
    setSheetOpen(true)
  }

  const handleAgencySave = (p: AgencySheetPayload) => {
    const name = p.name.trim()
    const code = p.code.trim().toUpperCase()
    if (!name || !code) return
    const payload: Record<string, unknown> = {
      code,
      name,
      is_active: p.is_active,
      contact_phone: p.contact_phone.trim() || null,
      contact_phone_secondary: p.contact_phone_secondary.trim() || null,
      contact_email: p.contact_email.trim() || null,
      address: p.address.trim() || null,
      country_id: p.country_id === '' || p.country_id == null ? null : Number(p.country_id),
      state_id: p.state_id === '' || p.state_id == null ? null : Number(p.state_id),
      city_id: p.city_id === '' || p.city_id == null ? null : Number(p.city_id),
    }
    if (editItem) {
      updateAgency.mutate(
        { id: editItem.id, data: payload },
        { onSuccess: () => setSheetOpen(false) },
      )
    } else {
      createAgency.mutate(payload, { onSuccess: () => setSheetOpen(false) })
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Agences</h2>
        <p className="text-sm text-muted-foreground">
          Structure de l&apos;entreprise : une ou plusieurs agences, sans niveau bureau / succursale.
        </p>
      </motion.div>

      <SettingsCard
        title="Liste des agences"
        icon={Building2}
        badge={`${agencies?.length ?? 0}`}
        isLoading={loadingA}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        }
      >
        <div className="space-y-2">
          {agencies?.map((a: Agency) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-sm">{displayLocalized(a.name as unknown)}</p>
                  <p className="text-xs text-muted-foreground">
                    Code {a.code}
                    {a.city?.name || a.country?.name
                      ? ` · ${[a.city?.name, a.country?.name].filter(Boolean).join(' · ')}`
                      : ''}
                    {a.users_count != null ? ` · ${a.users_count} utilisateur(s)` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-xs">
                  {a.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                  <Pencil size={14} />
                </Button>
              </div>
            </div>
          ))}
          {(!agencies || agencies.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune agence</p>
          )}
        </div>
      </SettingsCard>

      <AgencyCreateSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={editItem ? 'edit' : 'create'}
        initialAgency={editItem}
        isLoading={createAgency.isPending || updateAgency.isPending}
        onSave={handleAgencySave}
      />
    </div>
  )
}
