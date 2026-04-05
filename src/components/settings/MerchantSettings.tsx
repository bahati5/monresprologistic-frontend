import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Store } from 'lucide-react'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import { Badge } from '@/components/ui/badge'

export type SettingsMerchantRow = {
  id: number
  name: string
  domains: string[] | null
  logo_url: string | null
  is_active: boolean
  sort_order?: number
}

type SheetMode = 'create' | 'edit'

const emptyForm = () => ({
  name: '',
  domainsInput: '',
  logo_url: '',
  is_active: true,
  sort_order: '0',
})

export default function MerchantSettings() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<SheetMode>('create')
  const [editing, setEditing] = useState<SettingsMerchantRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const set = (k: keyof ReturnType<typeof emptyForm>, v: string | boolean) =>
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
      setForm(emptyForm())
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Enregistrement impossible.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/settings/merchants/${id}`),
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
    setForm(emptyForm())
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
        <div className="rounded-xl border border-border/80 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[72px]">Logo</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="min-w-[200px]">Domaines associés</TableHead>
                <TableHead className="w-[100px]">Actif</TableHead>
                <TableHead className="w-[88px] text-right">Ordre</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                    Aucun marchand. Ajoutez-en un pour activer les listes et l’auto-détection.
                  </TableCell>
                </TableRow>
              ) : (
                merchants.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <MerchantLogoBadge logoUrl={m.logo_url} merchantName={m.name} />
                    </TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {Array.isArray(m.domains) && m.domains.length > 0 ? m.domains.join(', ') : '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {m.is_active ? (
                        <Badge variant="secondary" className="text-xs">
                          Oui
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Non
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                      {m.sort_order ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          <span className="sr-only">Modifier {m.name}</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              <span className="sr-only">Supprimer {m.name}</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ce marchand ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Les lignes d’achat assisté existantes conserveront un lien optionnel sans marchand
                                associé si vous supprimez cette entrée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMutation.mutate(m.id)}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-name">Nom du marchand</Label>
            <Input
              id="m-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Amazon"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-domains">Domaines associés (séparés par des virgules)</Label>
            <Input
              id="m-domains"
              value={form.domainsInput}
              onChange={(e) => set('domainsInput', e.target.value)}
              placeholder="amazon.fr, amazon.com, amzn.eu, amzn.to"
            />
            <p className="text-xs text-muted-foreground">
              Saisissez des fragments reconnus dans le nom d’hôte du lien (ex. <span className="font-mono">amzn.eu</span>{' '}
              pour les liens courts).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-logo">URL du logo (optionnel)</Label>
            <Input
              id="m-logo"
              value={form.logo_url}
              onChange={(e) => set('logo_url', e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-order">Ordre d’affichage</Label>
            <Input
              id="m-order"
              type="number"
              min={0}
              step={1}
              value={form.sort_order}
              onChange={(e) => set('sort_order', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Actif</p>
              <p className="text-xs text-muted-foreground">Visible pour les clients et l’auto-détection</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(c) => set('is_active', c)} />
          </div>
        </div>
      </CrudSheet>
    </div>
  )
}
