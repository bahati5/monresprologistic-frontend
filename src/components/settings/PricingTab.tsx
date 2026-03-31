import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { shippingRateHooks, taxHooks, pricingRuleHooks, zoneHooks, useShippingRatesIndex } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DollarSign, Receipt, Calculator, Globe2, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { ShippingRate, ShippingRateCountryRef, Tax, PricingRule, Zone } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import { CountryFlag } from '@/components/CountryFlag'
import { DbCombobox } from '@/components/ui/DbCombobox'

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

type RateFormState = {
  origin_country_ids: number[]
  dest_country_ids: number[]
  shipping_mode_ids: number[]
  pricing_type: 'per_kg' | 'per_volume' | 'flat'
  unit_price: number
  currency: string
  agency_id: number | '' | null
  weight_tiers_json: string
  is_active: boolean
}

function originIds(r: ShippingRate & Record<string, unknown>): number[] {
  const a = r.origin_countries ?? r.originCountries
  if (Array.isArray(a) && a.length) return (a as { id: number }[]).map((c) => c.id)
  if (r.origin_country_id != null) return [Number(r.origin_country_id)]
  return []
}

function destIds(r: ShippingRate & Record<string, unknown>): number[] {
  const a = r.destination_countries ?? r.destinationCountries
  if (Array.isArray(a) && a.length) return (a as { id: number }[]).map((c) => c.id)
  if (r.dest_country_id != null) return [Number(r.dest_country_id)]
  return []
}

function modeIds(r: ShippingRate & Record<string, unknown>): number[] {
  const m = r.shipping_modes ?? r.shippingModes
  if (Array.isArray(m) && m.length) return (m as { id: number }[]).map((x) => x.id)
  if (r.shipping_mode_id != null) return [Number(r.shipping_mode_id)]
  return []
}

function CountryPickColumn({
  title,
  countries,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
}: {
  title: string
  countries: ShippingRateCountryRef[]
  selectedIds: number[]
  onToggle: (id: number) => void
  search: string
  onSearchChange: (s: string) => void
}) {
  const q = search.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      countries.filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.code ?? '').toLowerCase().includes(q) ||
          (c.iso2 ?? '').toLowerCase().includes(q),
      ),
    [countries, q],
  )
  return (
    <div className="flex min-h-[200px] flex-col gap-2 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <Input
        placeholder="Filtrer…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8"
      />
      <ScrollArea className="h-[220px] pr-2">
        <div className="space-y-2">
          {filtered.map((c) => {
            const checked = selectedIds.includes(c.id)
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-input"
                  checked={checked}
                  onChange={() => onToggle(c.id)}
                />
                <CountryFlag iso2={c.iso2} code={c.code} emoji={c.emoji} className="!h-4 !w-5" />
                <span className="truncate">{c.name}</span>
              </label>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function ModePickColumn({
  modes,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
}: {
  modes: { id: number; name: string }[]
  selectedIds: number[]
  onToggle: (id: number) => void
  search: string
  onSearchChange: (s: string) => void
}) {
  const q = search.trim().toLowerCase()
  const filtered = useMemo(
    () => modes.filter((m) => !q || m.name.toLowerCase().includes(q)),
    [modes, q],
  )
  return (
    <div className="flex min-h-[200px] flex-col gap-2 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">Modes</p>
      <Input
        placeholder="Filtrer…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8"
      />
      <ScrollArea className="h-[220px] pr-2">
        <div className="space-y-2">
          {filtered.map((m) => {
            const checked = selectedIds.includes(m.id)
            return (
              <label key={m.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-input"
                  checked={checked}
                  onChange={() => onToggle(m.id)}
                />
                <span className="truncate">{m.name}</span>
              </label>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function ShippingRatesCard() {
  const { data: indexData, isLoading } = useShippingRatesIndex()
  const rates = indexData?.rates ?? []
  const countries = indexData?.countries ?? []
  const shippingModes = indexData?.shippingModes ?? []
  const agencies = indexData?.agencies ?? []

  const create = shippingRateHooks.useCreate()
  const update = shippingRateHooks.useUpdate()
  const del = shippingRateHooks.useDelete()
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShippingRate | null>(null)
  const [form, setForm] = useState<RateFormState | null>(null)
  const [so, setSo] = useState('')
  const [sd, setSd] = useState('')
  const [sm, setSm] = useState('')

  const set = useCallback((patch: Partial<RateFormState>) => {
    setForm((p) => (p ? { ...p, ...patch } : p))
  }, [])

  const emptyForm = useCallback((): RateFormState => ({
    origin_country_ids: [],
    dest_country_ids: [],
    shipping_mode_ids: [],
    pricing_type: 'per_kg',
    unit_price: 0,
    currency: 'USD',
    agency_id: '',
    weight_tiers_json: '',
    is_active: true,
  }), [])

  const openCreate = () => {
    setEditItem(null)
    setForm(emptyForm())
    setSo('')
    setSd('')
    setSm('')
    setOpen(true)
  }

  const openEdit = (r: ShippingRate) => {
    const x = r as ShippingRate & Record<string, unknown>
    const wr = x.weight_tiers
    const json =
      wr == null || wr === ''
        ? ''
        : typeof wr === 'string'
          ? wr
          : JSON.stringify(wr, null, 2)
    setEditItem(r)
    setForm({
      origin_country_ids: originIds(x),
      dest_country_ids: destIds(x),
      shipping_mode_ids: modeIds(x),
      pricing_type: (x.pricing_type as RateFormState['pricing_type']) ?? 'per_kg',
      unit_price: Number(x.unit_price ?? 0),
      currency: (x.currency as string) || 'USD',
      agency_id: x.agency_id != null ? Number(x.agency_id) : '',
      weight_tiers_json: json,
      is_active: x.is_active !== false,
    })
    setSo('')
    setSd('')
    setSm('')
    setOpen(true)
  }

  const toggleOrig = (id: number) => {
    setForm((p) => {
      if (!p) return p
      const has = p.origin_country_ids.includes(id)
      return {
        ...p,
        origin_country_ids: has ? p.origin_country_ids.filter((x) => x !== id) : [...p.origin_country_ids, id],
      }
    })
  }
  const toggleDest = (id: number) => {
    setForm((p) => {
      if (!p) return p
      const has = p.dest_country_ids.includes(id)
      return {
        ...p,
        dest_country_ids: has ? p.dest_country_ids.filter((x) => x !== id) : [...p.dest_country_ids, id],
      }
    })
  }
  const toggleMode = (id: number) => {
    setForm((p) => {
      if (!p) return p
      const has = p.shipping_mode_ids.includes(id)
      return {
        ...p,
        shipping_mode_ids: has ? p.shipping_mode_ids.filter((x) => x !== id) : [...p.shipping_mode_ids, id],
      }
    })
  }

  const handleSubmit = () => {
    if (!form) return
    let parsedTiers: unknown = null
    const tj = form.weight_tiers_json.trim()
    if (tj) {
      try {
        parsedTiers = JSON.parse(tj)
      } catch {
        toast.error('JSON des paliers de poids invalide.')
        return
      }
    }
    const payload: Record<string, unknown> = {
      origin_country_ids: form.origin_country_ids,
      dest_country_ids: form.dest_country_ids,
      shipping_mode_ids: form.shipping_mode_ids,
      pricing_type: form.pricing_type,
      unit_price: form.unit_price,
      currency: form.currency || 'USD',
      is_active: form.is_active,
      agency_id: form.agency_id === '' || form.agency_id == null ? null : Number(form.agency_id),
    }
    if (parsedTiers != null) payload.weight_tiers = JSON.stringify(parsedTiers)
    else if (editItem) payload.weight_tiers = null

    const y = window.scrollY
    if (editItem) {
      update.mutate(
        { id: editItem.id, data: payload },
        {
          onSuccess: () => setOpen(false),
          onSettled: () => requestAnimationFrame(() => window.scrollTo(0, y)),
        },
      )
    } else {
      create.mutate(payload, {
        onSuccess: () => setOpen(false),
        onSettled: () => requestAnimationFrame(() => window.scrollTo(0, y)),
      })
    }
  }

  const agencyOptions = useMemo(
    () => [
      { value: '__none', label: 'Aucune agence' },
      ...agencies.map((a) => ({ value: String(a.id), label: a.name })),
    ],
    [agencies],
  )

  const countryLabel = (id: number) => countries.find((c) => c.id === id)?.name ?? `#${id}`

  return (
    <>
      <SettingsCard
        title="Grilles tarifaires"
        icon={DollarSign}
        badge={`${rates.length}`}
        isLoading={isLoading}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        }
      >
        <p className="mb-3 text-xs text-muted-foreground">
          Multi-pays, multi-modes, prix unitaire et paliers JSON. Les délais par tarif ne sont plus gérés (pivot retiré).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Origines</th>
                <th className="py-2 pr-3 font-medium">Destinations</th>
                <th className="py-2 pr-3 font-medium">Modes</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Prix</th>
                <th className="py-2 pr-3 font-medium">Devise</th>
                <th className="py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => {
                const x = r as ShippingRate & Record<string, unknown>
                const oi = originIds(x)
                const di = destIds(x)
                const mi = modeIds(x)
                return (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="max-w-[140px] py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {oi.slice(0, 4).map((id) => {
                          const c = countries.find((cc) => cc.id === id)
                          return (
                            <Badge key={id} variant="secondary" className="gap-1 font-normal">
                              {c && <CountryFlag iso2={c.iso2} code={c.code} emoji={c.emoji} className="!h-3 !w-4" />}
                              <span className="max-w-[72px] truncate">{countryLabel(id)}</span>
                            </Badge>
                          )
                        })}
                        {oi.length > 4 && <span className="text-xs text-muted-foreground">+{oi.length - 4}</span>}
                        {oi.length === 0 && <span className="text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="max-w-[140px] py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {di.slice(0, 4).map((id) => {
                          const c = countries.find((cc) => cc.id === id)
                          return (
                            <Badge key={id} variant="secondary" className="gap-1 font-normal">
                              {c && <CountryFlag iso2={c.iso2} code={c.code} emoji={c.emoji} className="!h-3 !w-4" />}
                              <span className="max-w-[72px] truncate">{countryLabel(id)}</span>
                            </Badge>
                          )
                        })}
                        {di.length > 4 && <span className="text-xs text-muted-foreground">+{di.length - 4}</span>}
                        {di.length === 0 && <span className="text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="max-w-[120px] py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {mi.slice(0, 3).map((id) => (
                          <Badge key={id} variant="outline" className="font-normal">
                            {shippingModes.find((m) => m.id === id)?.name ?? id}
                          </Badge>
                        ))}
                        {mi.length > 3 && <span className="text-xs">+{mi.length - 3}</span>}
                        {mi.length === 0 && <span className="text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline">{x.pricing_type}</Badge>
                    </td>
                    <td className="py-2 pr-3 font-medium">{x.unit_price}</td>
                    <td className="py-2 pr-3">{x.currency ?? '—'}</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil size={13} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 size={13} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce tarif ?</AlertDialogTitle>
                            <AlertDialogDescription>Irreversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del.mutate(r.id)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rates.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Aucun tarif</p>
          )}
        </div>
      </SettingsCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Modifier le tarif' : 'Nouveau tarif'}</DialogTitle>
            <DialogDescription>
              Cochez pays d&apos;origine, destinations et modes. Le premier mode sert de référence legacy côté API.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <CountryPickColumn
                  title="Pays origine"
                  countries={countries}
                  selectedIds={form.origin_country_ids}
                  onToggle={toggleOrig}
                  search={so}
                  onSearchChange={setSo}
                />
                <CountryPickColumn
                  title="Pays destination"
                  countries={countries}
                  selectedIds={form.dest_country_ids}
                  onToggle={toggleDest}
                  search={sd}
                  onSearchChange={setSd}
                />
                <ModePickColumn
                  modes={shippingModes}
                  selectedIds={form.shipping_mode_ids}
                  onToggle={toggleMode}
                  search={sm}
                  onSearchChange={setSm}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Type de prix</Label>
                  <Select
                    value={form.pricing_type}
                    onValueChange={(v) => set({ pricing_type: v as RateFormState['pricing_type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_kg">Par kg</SelectItem>
                      <SelectItem value="per_volume">Par volume</SelectItem>
                      <SelectItem value="flat">Forfait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.unit_price}
                    onChange={(e) => set({ unit_price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Input
                    value={form.currency}
                    onChange={(e) => set({ currency: e.target.value.toUpperCase().slice(0, 8) })}
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Agence</Label>
                  <DbCombobox
                    value={form.agency_id === '' || form.agency_id == null ? '__none' : String(form.agency_id)}
                    onValueChange={(v) => set({ agency_id: v === '__none' ? '' : Number(v) })}
                    options={agencyOptions}
                    placeholder="Agence…"
                    searchPlaceholder="Filtrer agences…"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Paliers de poids (JSON optionnel)</Label>
                <textarea
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  value={form.weight_tiers_json}
                  onChange={(e) => set({ weight_tiers_json: e.target.value })}
                  placeholder='[{"max_kg":5,"price":10}, ...]'
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Actif</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => set({ is_active: v })} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette taxe ?</AlertDialogTitle>
                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => del.mutate(t.id)}>Supprimer</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {(!taxes || taxes.length === 0) && <p className="text-center text-muted-foreground py-4 text-sm">Aucune taxe</p>}
        </div>
      </SettingsCard>

      <CrudSheet
        open={open}
        onOpenChange={setOpen}
        title="Nouvelle taxe"
        onSubmit={() => {
          const y = window.scrollY
          create.mutate(form as Record<string, unknown>, {
            onSuccess: () => setOpen(false),
            onSettled: () => requestAnimationFrame(() => window.scrollTo(0, y)),
          })
        }}
        isLoading={create.isPending}
      >
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
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                    <AlertDialogDescription>La règle sera définitivement supprimée.</AlertDialogDescription>
                  </AlertDialogHeader>
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
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                    <AlertDialogDescription>La zone sera définitivement supprimée.</AlertDialogDescription>
                  </AlertDialogHeader>
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
