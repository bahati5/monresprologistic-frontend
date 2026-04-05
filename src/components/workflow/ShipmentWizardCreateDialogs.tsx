import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  useCreateCountry,
  agencyHooks,
  packagingTypeHooks,
  transportCompanyHooks,
  shipLineHooks,
  shippingModeHooks,
  useAppSettings,
  useCountriesList,
  useMergeShipLineRoute,
} from '@/hooks/useSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CountryFlag } from '@/components/CountryFlag'
import { CountryMultiSelect } from '@/components/ui/CountryMultiSelect'
import { suggestAgencyCodeFromName } from '@/lib/agencyCodeSuggest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { displayLocalized } from '@/lib/localizedString'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { userCan } from '@/lib/permissions'
import { toast } from 'sonner'
import type { AuthUser } from '@/types'
import type { AppSettings } from '@/types/settings'

const CREATE_OPTIONS_KEY = ['shipments', 'create-options'] as const

async function refetchAndPickMaxId(
  qc: ReturnType<typeof useQueryClient>,
  listPath: 'countries' | 'agencies' | 'packagingTypes' | 'transportCompanies' | 'shipLines',
): Promise<string | null> {
  await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
  const opts = qc.getQueryData([...CREATE_OPTIONS_KEY]) as Record<string, unknown> | undefined
  const list = (opts?.[listPath] as { id: number }[]) || []
  if (!list.length) return null
  const max = list.reduce((m, x) => Math.max(m, x.id), 0)
  return max ? String(max) : null
}

async function refetchAndPickCountryByCode(qc: ReturnType<typeof useQueryClient>, code: string): Promise<string | null> {
  await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
  const opts = qc.getQueryData([...CREATE_OPTIONS_KEY]) as Record<string, unknown> | undefined
  const list = (opts?.countries as { id: number; code?: string; iso2?: string }[]) || []
  const u = code.toUpperCase()
  const row =
    list.find((c) => (c.iso2 || c.code || '').toString().toUpperCase() === u) ||
    list.find((c) => (c.code || '').toUpperCase() === u)
  return row ? String(row.id) : refetchAndPickMaxId(qc, 'countries')
}

export function WizardCountryCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = useCreateCountry()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setCode('')
    }
  }, [open])

  if (!userCan(user, 'manage_settings')) return null

  const submit = () => {
    const c = code.trim().toUpperCase()
    if (!name.trim() || c.length < 2) return
    create.mutate(
      { name: name.trim(), code: c, iso2: c.slice(0, 2) },
      {
        onSuccess: async () => {
          const id = await refetchAndPickCountryByCode(qc, c)
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau pays</DialogTitle>
          <DialogDescription>Même API que Paramètres / localisations.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Code ISO (2–3 car.) *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending || !name.trim() || code.trim().length < 2}>
            {create.isPending ? '…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WizardAgencyCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = agencyHooks.useCreate()
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
    }
  }, [open])

  if (!userCan(user, 'manage_agencies')) return null

  const submit = () => {
    if (!name.trim()) return
    const code = suggestAgencyCodeFromName(name.trim()) || 'HUB'
    create.mutate(
      {
        name: name.trim(),
        code,
      } as Record<string, unknown>,
      {
        onSuccess: async () => {
          const id = await refetchAndPickMaxId(qc, 'agencies')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle agence</DialogTitle>
          <DialogDescription>POST /api/settings/agencies</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <p className="text-xs text-muted-foreground">
            Code attribué automatiquement ; la devise est celle des paramètres généraux.
          </p>
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending || !name.trim()}>
            {create.isPending ? '…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WizardPackagingCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = packagingTypeHooks.useCreate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [billable, setBillable] = useState(false)
  const [unitPrice, setUnitPrice] = useState('0')

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setBillable(false)
      setUnitPrice('0')
    }
  }, [open])

  if (!userCan(user, 'manage_settings')) return null

  const submit = () => {
    if (!name.trim()) return
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        is_active: true,
        is_billable: billable,
        unit_price: billable ? Number(unitPrice) || 0 : 0,
      } as Record<string, unknown>,
      {
        onSuccess: async () => {
          const id = await refetchAndPickMaxId(qc, 'packagingTypes')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel emballage</DialogTitle>
          <DialogDescription>POST /api/settings/packaging-types</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="wb" checked={billable} onCheckedChange={setBillable} />
            <Label htmlFor="wb">Facturable</Label>
          </div>
          {billable && (
            <div className="space-y-1.5">
              <Label>Prix unitaire</Label>
              <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending || !name.trim()}>
            {create.isPending ? '…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WizardTransportCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = transportCompanyHooks.useCreate()
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  if (!userCan(user, 'manage_settings')) return null

  const submit = () => {
    if (!name.trim()) return
    create.mutate(
      { name: name.trim(), is_active: true } as Record<string, unknown>,
      {
        onSuccess: async () => {
          const id = await refetchAndPickMaxId(qc, 'transportCompanies')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle compagnie de transport</DialogTitle>
          <DialogDescription>POST /api/settings/transport-companies</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label>Nom *</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending || !name.trim()}>
            {create.isPending ? '…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function deliveryOptionsForMode(mode: Record<string, unknown>): string[] {
  const raw = (mode.delivery_options ?? mode.deliveryOptions) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x)).filter((s) => s.trim() !== '')
}

function shipLineRouteSummary(line: Record<string, unknown>) {
  const origins = line.origin_countries as { name?: string }[] | undefined
  const dests = line.destination_countries as { name?: string }[] | undefined
  const o = origins?.map((c) => c.name).filter(Boolean).slice(0, 3).join(', ')
  const d = dests?.map((c) => c.name).filter(Boolean).slice(0, 3).join(', ')
  if (!o && !d) return ''
  return `${o || '…'} → ${d || '…'}`
}

export function WizardShipLineCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
  prefillOriginCountryId,
  prefillDestCountryId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
  /** ID pays assistant (string stable pour éviter reset du formulaire à chaque rendu). */
  prefillOriginCountryId?: string
  prefillDestCountryId?: string
}) {
  const qc = useQueryClient()
  const create = shipLineHooks.useCreate()
  const mergeRoute = useMergeShipLineRoute()
  const { data: shipLinesRaw = [], isLoading: shipLinesLoading } = shipLineHooks.useList(open)
  const { data: modes } = shippingModeHooks.useList()
  const { data: countriesRaw = [] } = useCountriesList(open)
  const { data: appSettings } = useAppSettings()
  const globalCurrency = String((appSettings as AppSettings | undefined)?.currency ?? 'USD').toUpperCase()
  const currencyUi = resolveMoneySymbol({
    currency: globalCurrency,
    currency_symbol: String((appSettings as AppSettings | undefined)?.currency_symbol ?? ''),
  })
  const [wizardTab, setWizardTab] = useState<'create' | 'extend'>('create')
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])
  const [description, setDescription] = useState('')
  const [originIds, setOriginIds] = useState<number[]>([])
  const [destIds, setDestIds] = useState<number[]>([])
  const [modeId, setModeId] = useState(0)
  const [deliveryLabelOverride, setDeliveryLabelOverride] = useState('')
  const [delayPickKey, setDelayPickKey] = useState('__pick')
  const [unitPrice, setUnitPrice] = useState('0')

  const countries = (countriesRaw ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code || null,
    iso2: c.iso2 ?? null,
    emoji: c.emoji ?? null,
  }))
  const shipLines = (shipLinesRaw ?? []) as unknown as Record<string, unknown>[]
  const modeList = Array.isArray(modes) ? (modes as unknown as Record<string, unknown>[]) : []
  const selectedMode = modeList.find((m) => Number(m.id) === modeId)
  const delayOpts = selectedMode ? deliveryOptionsForMode(selectedMode) : []

  useEffect(() => {
    if (open) {
      setWizardTab('create')
      setSelectedLineIds([])
      setDescription('')
      const o = prefillOriginCountryId ? [Number(prefillOriginCountryId)] : []
      const d = prefillDestCountryId ? [Number(prefillDestCountryId)] : []
      setOriginIds(Number.isFinite(o[0]) && o[0] > 0 ? o : [])
      setDestIds(Number.isFinite(d[0]) && d[0] > 0 ? d : [])
      setModeId(0)
      setDeliveryLabelOverride('')
      setDelayPickKey('__pick')
      setUnitPrice('0')
    }
  }, [open, prefillOriginCountryId, prefillDestCountryId])

  useEffect(() => {
    setDelayPickKey('__pick')
  }, [modeId])

  if (!userCan(user, 'manage_settings')) return null

  const toggleLineSelect = (id: number, on: boolean) => {
    setSelectedLineIds((p) => (on ? [...new Set([...p, id])] : p.filter((x) => x !== id)))
  }

  const buildRatesPayload = (): Record<string, unknown>[] => {
    const ov = deliveryLabelOverride.trim()
    return [
      {
        shipping_mode_id: modeId,
        unit_price: Number(unitPrice) || 0,
        currency: globalCurrency,
        is_active: true,
        delivery_label_override: ov !== '' ? ov : null,
      },
    ]
  }

  const submit = () => {
    if (originIds.length === 0 || destIds.length === 0 || modeId <= 0) return
    create.mutate(
      {
        name: '',
        description: description.trim() || null,
        is_active: true,
        origin_country_ids: originIds,
        dest_country_ids: destIds,
        rates: buildRatesPayload(),
      } as Record<string, unknown>,
      {
        onSuccess: async (data: { ship_line?: { id: number } }) => {
          await qc.invalidateQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
          await qc.invalidateQueries({ queryKey: ['shipment-wizard', 'ship-lines-route'] })
          const sid = data?.ship_line?.id
          if (sid != null) {
            onCreated(String(sid))
            onOpenChange(false)
            return
          }
          const id = await refetchAndPickMaxId(qc, 'shipLines')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  const submitExtend = () => {
    if (selectedLineIds.length === 0 || originIds.length === 0 || destIds.length === 0 || modeId <= 0) return
    mergeRoute.mutate(
      {
        ship_line_ids: selectedLineIds,
        origin_country_ids: originIds,
        dest_country_ids: destIds,
        rates: buildRatesPayload(),
      },
      {
        onSuccess: async (data: { ship_lines?: { id: number }[] }) => {
          await qc.invalidateQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
          await qc.invalidateQueries({ queryKey: ['shipment-wizard', 'ship-lines-route'] })
          const first = data?.ship_lines?.[0]?.id
          if (first != null) onCreated(String(first))
          onOpenChange(false)
        },
      },
    )
  }

  const pending = create.isPending || mergeRoute.isPending
  const canSubmitCreate = originIds.length > 0 && destIds.length > 0 && modeId > 0
  const canSubmitExtend =
    selectedLineIds.length > 0 && originIds.length > 0 && destIds.length > 0 && modeId > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ligne d&apos;expédition</DialogTitle>
          <DialogDescription>
            {wizardTab === 'create'
              ? 'Choisissez les pays, un mode et un prix ; le libellé de la ligne est déduit automatiquement des pays.'
              : 'Ajoutez des pays et un tarif aux lignes cochées. Si un tarif existe déjà pour le même mode, il est mis à jour.'}
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={wizardTab}
          onValueChange={(v) => setWizardTab(v === 'extend' ? 'extend' : 'create')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Nouvelle ligne</TabsTrigger>
            <TabsTrigger value="extend">Lignes existantes</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Pas de nom à saisir : il sera généré à partir des pays d&apos;origine et de destination (ex. BE, FR → CD).
            </p>
          </TabsContent>
          <TabsContent value="extend" className="mt-3 space-y-2">
            <Label className="text-xs font-semibold">Lignes à enrichir *</Label>
            <p className="text-xs text-muted-foreground">
              Cochez une ou plusieurs lignes : les pays et le tarif ci-dessous leur seront ajoutés (sans supprimer
              l&apos;existant).
            </p>
            <div className="max-h-32 overflow-y-auto rounded border p-2 space-y-1.5">
              {shipLinesLoading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : shipLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune ligne enregistrée. Créez d&apos;abord une ligne.</p>
              ) : (
                shipLines.map((line) => {
                  const lid = Number(line.id)
                  if (!Number.isFinite(lid)) return null
                  const summary = shipLineRouteSummary(line)
                  return (
                    <label key={lid} className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border border-input"
                        checked={selectedLineIds.includes(lid)}
                        onChange={(e) => toggleLineSelect(lid, e.target.checked)}
                      />
                      <span>
                        <span className="font-medium">{String(line.name ?? '')}</span>
                        {summary ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">{summary}</span>
                        ) : null}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid gap-3 border-t pt-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Pays d&apos;origine *</Label>
            <CountryMultiSelect
              options={countries}
              selectedIds={originIds}
              onChange={setOriginIds}
              placeholder="Rechercher et sélectionner…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Pays de destination *</Label>
            <CountryMultiSelect
              options={countries}
              selectedIds={destIds}
              onChange={setDestIds}
              placeholder="Rechercher et sélectionner…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mode d&apos;expédition *</Label>
            <Select
              value={modeId ? String(modeId) : ''}
              onValueChange={(v: string) => {
                const mid = Number(v)
                setModeId(mid)
                setDeliveryLabelOverride('')
                setDelayPickKey('__pick')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {modeList.map((m) => (
                  <SelectItem key={String(m.id)} value={String(m.id)}>
                    {displayLocalized(String(m.name ?? ''))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Le type de prix et le diviseur volumétrique viennent du mode (paramètres).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Surcharge délai (optionnel)</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                className="flex-1"
                placeholder="ex. 5–7 jours ouvrés"
                value={deliveryLabelOverride}
                onChange={(e) => setDeliveryLabelOverride(e.target.value)}
                disabled={!modeId}
              />
              <Select
                value={delayPickKey}
                onValueChange={(v) => {
                  if (v === '__pick') return
                  if (v === '__clear') {
                    setDeliveryLabelOverride('')
                  } else {
                    setDeliveryLabelOverride(v)
                  }
                  setDelayPickKey('__pick')
                }}
                disabled={!modeId || delayOpts.length === 0}
              >
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Depuis le mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__pick">Insérer un libellé du mode…</SelectItem>
                  <SelectItem value="__clear">Effacer</SelectItem>
                  {delayOpts.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prix * ({currencyUi})</Label>
            <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </div>
          {wizardTab === 'create' ? (
            <div className="space-y-1.5">
              <Label>Description (optionnel)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Notes internes…"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={wizardTab === 'create' ? submit : submitExtend}
            disabled={pending || (wizardTab === 'create' ? !canSubmitCreate : !canSubmitExtend)}
          >
            {pending ? '…' : wizardTab === 'create' ? 'Créer' : 'Ajouter aux lignes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WizardDeliveryTimeCreateDialog({
  open,
  onOpenChange,
  user,
  shippingModeId,
  selectedMode,
  initialLabel,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  shippingModeId: string
  selectedMode: Record<string, unknown> | undefined
  initialLabel?: string
  /** Libellé ajouté aux delivery_options du mode */
  onCreated: (label: string) => void
}) {
  const qc = useQueryClient()
  const updateMode = shippingModeHooks.useUpdate()
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (open) {
      setLabel(initialLabel?.trim() ?? '')
    }
  }, [open, initialLabel])

  if (!userCan(user, 'manage_settings')) return null

  const submit = () => {
    const mid = Number(shippingModeId)
    if (!mid) {
      toast.error(
        "Choisissez d'abord un mode d'expédition (étape Logistique ou tarif de ligne).",
      )
      return
    }
    if (!label.trim()) return
    if (!selectedMode) {
      toast.error(
        'Mode introuvable. Rechargez la page ou resélectionnez un mode / tarif.',
      )
      return
    }

    const existing = deliveryOptionsForMode(selectedMode)
    const next = [...existing, label.trim()]
    const desc = selectedMode.description
    const vd = selectedMode.volumetric_divisor ?? selectedMode.volumetricDivisor
    const vol =
      vd != null && vd !== ''
        ? (() => {
            const n = parseInt(String(vd), 10)
            return Number.isFinite(n) && n >= 1 ? n : null
          })()
        : null
    const dpt = String(selectedMode.default_pricing_type ?? selectedMode.defaultPricingType ?? '').trim()
    const default_pricing_type =
      dpt === 'per_kg' || dpt === 'per_volume' || dpt === 'flat' ? dpt : null

    const payload = {
      name: String(selectedMode.name ?? ''),
      description: desc == null || desc === '' ? null : String(desc),
      is_active: selectedMode.is_active !== false,
      sort_order: Number(selectedMode.sort_order) || 0,
      volumetric_divisor: vol,
      default_pricing_type,
      delivery_options: next,
    }

    updateMode.mutate(
      { id: mid, data: payload as Record<string, unknown> },
      {
        onSuccess: async () => {
          await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
          await qc.invalidateQueries({ queryKey: ['settings', 'shipping_modes'] })
          onCreated(label.trim())
          onOpenChange(false)
        },
      },
    )
  }

  const pending = updateMode.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!z-[200] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau libellé de délai</DialogTitle>
          <DialogDescription>
            Ajouté à la liste des délais du mode (comme dans Paramètres → Transport).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Libellé *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. 3–5 jours ouvrés" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={pending || !label.trim() || !shippingModeId}>
            {pending ? '…' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
