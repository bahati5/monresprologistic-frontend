import { useState } from 'react'
import { motion } from 'framer-motion'
import { billingExtraHooks } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { ShipLinesCard } from './ShipLinesCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Receipt, Plus, Trash2 } from 'lucide-react'
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
import type { BillingExtra } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'

export default function PricingTab() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1 text-foreground">Tarifs & extras</h2>
        <p className="text-sm text-muted-foreground">
          Lignes d&apos;expédition et extras de facturation réutilisables sur les factures.
        </p>
      </motion.div>

      <Tabs defaultValue="ship-lines" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="ship-lines" className={settingsInnerTabsTrigger}>
            Lignes
          </TabsTrigger>
          <TabsTrigger value="extras" className={settingsInnerTabsTrigger}>
            Extras
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ship-lines" className={settingsInnerTabsContent}>
          <ShipLinesCard />
        </TabsContent>
        <TabsContent value="extras" className={settingsInnerTabsContent}>
          <BillingExtrasCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BillingExtrasCard() {
  const { data: extras, isLoading } = billingExtraHooks.useList()
  const create = billingExtraHooks.useCreate()
  const del = billingExtraHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>({
    type: 'percentage',
    is_active: true,
    label: '',
    calculation_description: '',
    value: '',
  })
  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <>
      <SettingsCard
        title="Extras de facturation"
        icon={Receipt}
        badge={`${extras?.length ?? 0}`}
        isLoading={isLoading}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setForm({
                type: 'percentage',
                is_active: true,
                label: '',
                calculation_description: '',
                value: '',
              })
              setOpen(true)
            }}
          >
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        }
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Libellé, mode de calcul (texte libre) et valeur numérique (% ou montant fixe). Réutilisables à la création de
          facture.
        </p>
        <div className="space-y-2">
          {extras?.map((e: BillingExtra) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="min-w-0 pr-2">
                <p className="font-medium text-sm">{displayLocalized(e.label as unknown)}</p>
                {e.calculation_description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">{e.calculation_description}</p>
                ) : null}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {e.type === 'percentage' ? `${e.value}%` : `${e.value} (fixe)`}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cet extra ?</AlertDialogTitle>
                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => del.mutate(e.id)}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!extras || extras.length === 0) && (
            <p className="text-center text-muted-foreground py-4 text-sm">Aucun extra</p>
          )}
        </div>
      </SettingsCard>

      <CrudSheet
        open={open}
        onOpenChange={setOpen}
        title="Nouvel extra"
        onSubmit={() => {
          const y = window.scrollY
          const v = form.value === '' || form.value == null ? 0 : Number(form.value)
          create.mutate(
            {
              label: String(form.label ?? '').trim(),
              calculation_description: String(form.calculation_description ?? '').trim() || null,
              type: form.type,
              value: v,
              is_active: form.is_active !== false,
            } as Record<string, unknown>,
            {
              onSuccess: () => setOpen(false),
              onSettled: () => requestAnimationFrame(() => window.scrollTo(0, y)),
            },
          )
        }}
        isLoading={create.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé</Label>
            <Input value={String(form.label ?? '')} onChange={(e) => set('label', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mode de calcul (description)</Label>
            <Textarea
              rows={3}
              placeholder="Ex. Pourcentage appliqué sur le montant de base HT"
              value={String(form.calculation_description ?? '')}
              onChange={(e) => set('calculation_description', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={String(form.type)} onValueChange={(v) => set('type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Pourcentage</SelectItem>
                <SelectItem value="fixed">Montant fixe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Valeur</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={form.value === '' || form.value == null ? '' : String(form.value)}
              onChange={(e) => set('value', e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>
      </CrudSheet>
    </>
  )
}
