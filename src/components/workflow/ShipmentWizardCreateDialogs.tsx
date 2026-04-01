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
  officeHooks,
  packagingTypeHooks,
  transportCompanyHooks,
  shipLineHooks,
  shippingModeHooks,
  useAppSettings,
  useShippingRatesIndex,
  useMergeShipLineRoute,
} from '@/hooks/useSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CountryFlag } from '@/components/CountryFlag'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { displayLocalized } from '@/lib/localizedString'
import { useQuickCreateDeliveryTime } from '@/hooks/useShipments'
import { userCan } from '@/lib/permissions'
import type { AuthUser } from '@/types'
import type { AppSettings } from '@/types/settings'

const CREATE_OPTIONS_KEY = ['shipments', 'create-options'] as const

async function refetchAndPickMaxId(
  qc: ReturnType<typeof useQueryClient>,
  listPath: 'countries' | 'agencies' | 'offices' | 'packagingTypes' | 'transportCompanies' | 'shipLines',
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
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    if (open) {
      setCode('')
      setName('')
      setCurrency('USD')
    }
  }, [open])

  if (!userCan(user, 'manage_agencies')) return null

  const submit = () => {
    if (!code.trim() || !name.trim()) return
    create.mutate(
      {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        default_currency: currency.trim().toUpperCase(),
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
          <div className="space-y-1.5">
            <Label>Code unique *</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Devise par défaut *</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={8} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending || !code.trim() || !name.trim()}>
            {create.isPending ? '…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WizardOfficeCreateDialog({
  open,
  onOpenChange,
  user,
  agencyId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  agencyId: string
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const create = officeHooks.useCreate()
  const [name, setName] = useState('')
  const [type, setType] = useState<'office' | 'branch'>('office')

  useEffect(() => {
    if (open) {
      setName('')
      setType('office')
    }
  }, [open])

  if (!userCan(user, 'manage_settings')) return null

  const submit = () => {
    if (!name.trim()) return
    create.mutate(
      {
        name: name.trim(),
        type,
        agency_id: agencyId ? Number(agencyId) : null,
        is_active: true,
      } as Record<string, unknown>,
      {
        onSuccess: async () => {
          const id = await refetchAndPickMaxId(qc, 'offices')
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
          <DialogTitle>Nouveau bureau / point</DialogTitle>
          <DialogDescription>POST /api/settings/offices</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as 'office' | 'branch')}
            >
              <option value="office">Bureau</option>
              <option value="branch">Succursale</option>
            </select>
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

function delaysForMode(mode: Record<string, unknown>) {
  const raw = (mode.delivery_times ?? mode.deliveryTimes) as unknown
  if (!Array.isArray(raw)) return []
  return raw as { id: number; label: string }[]
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
  const { data: indexData } = useShippingRatesIndex(open)
  const { data: appSettings } = useAppSettings()
  const globalCurrency = String((appSettings as AppSettings | undefined)?.currency ?? 'USD').toUpperCase()
  const [wizardTab, setWizardTab] = useState<'create' | 'extend'>('create')
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [originIds, setOriginIds] = useState<number[]>([])
  const [destIds, setDestIds] = useState<number[]>([])
  const [modeId, setModeId] = useState(0)
  const [deliveryId, setDeliveryId] = useState<number | null>(null)
  const [unitPrice, setUnitPrice] = useState('0')
  const [pricingType, setPricingType] = useState<'per_kg' | 'per_volume' | 'flat'>('per_kg')
  const [volDiv, setVolDiv] = useState('')

  const countries = Array.isArray(indexData?.countries) ? indexData.countries : []
  const shipLines = (shipLinesRaw ?? []) as unknown as Record<string, unknown>[]
  const modeList = Array.isArray(modes) ? (modes as unknown as Record<string, unknown>[]) : []
  const selectedMode = modeList.find((m) => Number(m.id) === modeId)
  const dts = selectedMode ? delaysForMode(selectedMode) : []

  useEffect(() => {
    if (open) {
      setWizardTab('create')
      setSelectedLineIds([])
      setName('')
      setDescription('')
      const o = prefillOriginCountryId ? [Number(prefillOriginCountryId)] : []
      const d = prefillDestCountryId ? [Number(prefillDestCountryId)] : []
      setOriginIds(Number.isFinite(o[0]) && o[0] > 0 ? o : [])
      setDestIds(Number.isFinite(d[0]) && d[0] > 0 ? d : [])
      setModeId(0)
      setDeliveryId(null)
      setUnitPrice('0')
      setPricingType('per_kg')
      setVolDiv('')
    }
  }, [open, prefillOriginCountryId, prefillDestCountryId])

  if (!userCan(user, 'manage_settings')) return null

  const toggleOrigin = (id: number, on: boolean) => {
    setOriginIds((p) => (on ? [...new Set([...p, id])] : p.filter((x) => x !== id)))
  }
  const toggleDest = (id: number, on: boolean) => {
    setDestIds((p) => (on ? [...new Set([...p, id])] : p.filter((x) => x !== id)))
  }
  const toggleLineSelect = (id: number, on: boolean) => {
    setSelectedLineIds((p) => (on ? [...new Set([...p, id])] : p.filter((x) => x !== id)))
  }

  const buildRatesPayload = (): Record<string, unknown>[] => {
    const vd = volDiv.trim()
    const volumetric_divisor =
      vd === '' ? null : (() => {
        const n = parseInt(vd, 10)
        return Number.isFinite(n) && n >= 1 ? n : null
      })()
    return [
      {
        shipping_mode_id: modeId,
        delivery_time_id: deliveryId && deliveryId > 0 ? deliveryId : null,
        unit_price: Number(unitPrice) || 0,
        currency: globalCurrency,
        pricing_type: pricingType,
        is_active: true,
        volumetric_divisor,
      },
    ]
  }

  const submit = () => {
    if (!name.trim() || originIds.length === 0 || destIds.length === 0 || modeId <= 0) return
    create.mutate(
      {
        name: name.trim(),
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
  const canSubmitCreate =
    name.trim().length > 0 && originIds.length > 0 && destIds.length > 0 && modeId > 0
  const canSubmitExtend =
    selectedLineIds.length > 0 && originIds.length > 0 && destIds.length > 0 && modeId > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ligne d&apos;expédition</DialogTitle>
          <DialogDescription>
            {wizardTab === 'create'
              ? 'Créez une nouvelle ligne avec un nom, les pays couverts et au moins un tarif.'
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
          <TabsContent value="create" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
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
            <div className="max-h-28 overflow-y-auto rounded border p-2 space-y-1">
              {countries.map(
                (c: {
                  id: number
                  name: string
                  iso2?: string | null
                  code?: string | null
                  emoji?: string | null
                }) => (
                  <label key={`wo-${c.id}`} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border border-input"
                      checked={originIds.includes(c.id)}
                      onChange={(e) => toggleOrigin(c.id, e.target.checked)}
                    />
                    <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-3.5 !w-5" />
                    <span>{c.name}</span>
                  </label>
                ),
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Pays de destination *</Label>
            <div className="max-h-28 overflow-y-auto rounded border p-2 space-y-1">
              {countries.map(
                (c: {
                  id: number
                  name: string
                  iso2?: string | null
                  code?: string | null
                  emoji?: string | null
                }) => (
                  <label key={`wd-${c.id}`} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border border-input"
                      checked={destIds.includes(c.id)}
                      onChange={(e) => toggleDest(c.id, e.target.checked)}
                    />
                    <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-3.5 !w-5" />
                    <span>{c.name}</span>
                  </label>
                ),
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mode d&apos;expédition *</Label>
            <Select
              value={modeId ? String(modeId) : ''}
              onValueChange={(v: string) => {
                setModeId(Number(v))
                setDeliveryId(null)
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
          </div>
          <div className="space-y-1.5">
            <Label>Délai (optionnel)</Label>
            <Select
              value={deliveryId ? String(deliveryId) : '__none'}
              onValueChange={(v: string) => setDeliveryId(v === '__none' ? null : Number(v))}
              disabled={!modeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Aucun</SelectItem>
                {dts.map((dt) => (
                  <SelectItem key={dt.id} value={String(dt.id)}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Type de prix</Label>
              <Select
                value={pricingType}
                onValueChange={(v: string) => setPricingType(v as typeof pricingType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_kg">Par kg</SelectItem>
                  <SelectItem value="per_volume">Par m³</SelectItem>
                  <SelectItem value="flat">Forfait</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prix * ({globalCurrency})</Label>
              <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Diviseur volumétrique (optionnel)</Label>
            <Input placeholder="5000 / 6000 IATA" value={volDiv} onChange={(e) => setVolDiv(e.target.value)} />
          </div>
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

function normalizeModeDeliveryTimes(mode: Record<string, unknown>) {
  const raw = (mode.delivery_times ?? mode.deliveryTimes) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((r: Record<string, unknown>, i: number) => ({
    id: r.id != null ? Number(r.id) : undefined,
    label: String(r.label ?? ''),
    description: r.description != null ? String(r.description) : '',
    is_active: r.is_active !== false,
    sort_order: r.sort_order != null ? Number(r.sort_order) : i,
  }))
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
  onCreated: (id: string) => void
}) {
  const qc = useQueryClient()
  const updateMode = shippingModeHooks.useUpdate()
  const quickCreate = useQuickCreateDeliveryTime()
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const canSettings = userCan(user, 'manage_settings')

  useEffect(() => {
    if (open) {
      setLabel(initialLabel?.trim() ?? '')
      setDescription('')
    }
  }, [open, initialLabel])

  const submit = () => {
    const mid = Number(shippingModeId)
    if (!mid || !label.trim()) return

    if (canSettings && selectedMode) {
      const rows = normalizeModeDeliveryTimes(selectedMode)
      const maxSort = rows.reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1)
      const delivery_times = [
        ...rows.map((r, i) => ({
          id: r.id,
          label: r.label,
          description: r.description || null,
          is_active: r.is_active,
          sort_order: r.sort_order ?? i,
        })),
        {
          label: label.trim(),
          description: description.trim() || null,
          is_active: true,
          sort_order: maxSort + 1,
        },
      ]
      const desc = selectedMode.description
      const payload = {
        name: String(selectedMode.name ?? ''),
        description: desc == null || desc === '' ? null : String(desc),
        is_active: selectedMode.is_active !== false,
        sort_order: Number(selectedMode.sort_order) || 0,
        delivery_times,
      }
      updateMode.mutate(
        { id: mid, data: payload as Record<string, unknown> },
        {
          onSuccess: async () => {
            await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
            const opts = qc.getQueryData([...CREATE_OPTIONS_KEY]) as Record<string, unknown> | undefined
            const modes = (opts?.shippingModes as Record<string, unknown>[]) || []
            const mode = modes.find((m) => Number(m.id) === mid)
            const dts = normalizeModeDeliveryTimes(mode || {})
            const matchLabel = label.trim()
            const withIds = dts.filter((r) => r.id != null) as { id: number; label: string }[]
            const same = withIds.filter((r) => r.label === matchLabel)
            let newId = 0
            if (same.length > 0) newId = Math.max(...same.map((r) => r.id))
            else if (withIds.length > 0) newId = Math.max(...withIds.map((r) => r.id))
            if (newId > 0) onCreated(String(newId))
            onOpenChange(false)
          },
        },
      )
    } else {
      quickCreate.mutate(
        { shipping_mode_id: mid, label: label.trim(), description: description.trim() || undefined },
        {
          onSuccess: async (data: { id?: number }) => {
            await qc.refetchQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
            const id = data?.id
            if (id != null) onCreated(String(id))
            onOpenChange(false)
          },
        },
      )
    }
  }

  const pending = updateMode.isPending || quickCreate.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau délai de livraison</DialogTitle>
          <DialogDescription>
            {canSettings
              ? 'Mise à jour du mode (PATCH) comme dans Paramètres.'
              : 'Création rapide via l’assistant (API wizard).'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Libellé *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={pending || !label.trim() || !shippingModeId}>
            {pending ? '…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
