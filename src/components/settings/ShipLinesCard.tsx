import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { shipLineHooks, shippingModeHooks, useAppSettings, useShippingRatesIndex } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Ship, Plus, Pencil, Trash2 } from 'lucide-react'
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
import { displayLocalized } from '@/lib/localizedString'
import type { ShipLine, ShipLineCountryRef, ShipLineRateRow } from '@/types/settings'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CountryFlag } from '@/components/CountryFlag'

type RateDraft = {
  shipping_mode_id: number
  delivery_time_id: number | null
  unit_price: string
  pricing_type: 'per_kg' | 'per_volume' | 'flat'
  is_active: boolean
  volumetric_divisor: string
}

function emptyRateRow(): RateDraft {
  return {
    shipping_mode_id: 0,
    delivery_time_id: null,
    unit_price: '0',
    pricing_type: 'per_kg',
    is_active: true,
    volumetric_divisor: '',
  }
}

function normalizeModeDeliveryTimes(mode: Record<string, unknown>) {
  const raw = (mode.delivery_times ?? mode.deliveryTimes) as unknown
  if (!Array.isArray(raw)) return []
  return raw as { id: number; label: string; shipping_mode_id?: number }[]
}

export function ShipLinesCard() {
  const qc = useQueryClient()
  const { data: appSettings } = useAppSettings()
  const globalCurrency = String(appSettings?.currency ?? 'USD').toUpperCase()
  const { data: items, isLoading } = shipLineHooks.useList()
  const { data: modes } = shippingModeHooks.useList()
  const { data: indexData } = useShippingRatesIndex()
  const create = shipLineHooks.useCreate()
  const update = shipLineHooks.useUpdate()
  const del = shipLineHooks.useDelete()

  const countries = useMemo(
    () => (Array.isArray(indexData?.countries) ? indexData.countries : []) as ShipLineCountryRef[],
    [indexData?.countries],
  )

  const modeList = useMemo(
    () => (Array.isArray(modes) ? (modes as unknown as Record<string, unknown>[]) : []),
    [modes],
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShipLine | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [originIds, setOriginIds] = useState<number[]>([])
  const [destIds, setDestIds] = useState<number[]>([])
  const [rateRows, setRateRows] = useState<RateDraft[]>([emptyRateRow()])

  const list = Array.isArray(items) ? (items as ShipLine[]) : []

  const toggleOrigin = (id: number, on: boolean) => {
    setOriginIds((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)))
  }
  const toggleDest = (id: number, on: boolean) => {
    setDestIds((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)))
  }

  const openCreate = () => {
    setEditItem(null)
    setName('')
    setDescription('')
    setIsActive(true)
    setOriginIds([])
    setDestIds([])
    setRateRows([emptyRateRow()])
    setSheetOpen(true)
  }

  const openEdit = (item: ShipLine) => {
    setEditItem(item)
    setName(item.name ?? '')
    setDescription(String(item.description ?? ''))
    setIsActive(item.is_active !== false)
    setOriginIds((item.origin_countries ?? []).map((c) => c.id))
    setDestIds((item.destination_countries ?? []).map((c) => c.id))
    const r = item.rates ?? []
    setRateRows(
      r.length
        ? r.map((row) => ({
            shipping_mode_id: row.shipping_mode_id,
            delivery_time_id: row.delivery_time_id ?? null,
            unit_price: String(row.unit_price ?? 0),
            pricing_type: row.pricing_type,
            is_active: row.is_active !== false,
            volumetric_divisor: row.volumetric_divisor != null ? String(row.volumetric_divisor) : '',
          }))
        : [emptyRateRow()],
    )
    setSheetOpen(true)
  }

  const buildPayload = () => {
    const rates: ShipLineRateRow[] = rateRows
      .filter((r) => r.shipping_mode_id > 0)
      .map((r) => ({
        shipping_mode_id: r.shipping_mode_id,
        delivery_time_id: r.delivery_time_id && r.delivery_time_id > 0 ? r.delivery_time_id : null,
        unit_price: Number(r.unit_price) || 0,
        currency: globalCurrency,
        pricing_type: r.pricing_type,
        is_active: r.is_active,
        volumetric_divisor: (() => {
          const s = r.volumetric_divisor.trim()
          if (s === '') return null
          const n = parseInt(s, 10)
          return Number.isFinite(n) && n >= 1 ? n : null
        })(),
      }))
    return {
      name: name.trim(),
      description: description.trim() || null,
      is_active: isActive,
      origin_country_ids: originIds,
      dest_country_ids: destIds,
      rates,
    }
  }

  const handleSubmit = () => {
    const payload = buildPayload()
    if (!payload.name || payload.origin_country_ids.length === 0 || payload.dest_country_ids.length === 0) {
      return
    }
    if (payload.rates.length === 0) return
    const onOk = () => {
      qc.invalidateQueries({ queryKey: ['shipments', 'create-options'] })
      qc.invalidateQueries({ queryKey: ['shipment-wizard', 'ship-lines-route'] })
      setSheetOpen(false)
    }
    if (editItem?.id != null) {
      update.mutate({ id: editItem.id, data: payload as Record<string, unknown> }, { onSuccess: onOk })
    } else {
      create.mutate(payload as Record<string, unknown>, { onSuccess: onOk })
    }
  }

  const updateRate = (idx: number, patch: Partial<RateDraft>) => {
    setRateRows((rows) => {
      const next = [...rows]
      const cur = next[idx]
      const merged = { ...cur, ...patch }
      if (patch.shipping_mode_id != null && patch.shipping_mode_id !== cur.shipping_mode_id) {
        merged.delivery_time_id = null
      }
      next[idx] = merged
      return next
    })
  }

  return (
    <>
      <SettingsCard
        title="Lignes d'expédition (routes & tarifs)"
        icon={Ship}
        badge={`${list.length}`}
        isLoading={isLoading}
        description={`Pays d'origine / destination et grille tarifaire par mode (prix en ${globalCurrency}, délai, diviseur volumétrique optionnel).`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        }
      >
        <div className="space-y-2">
          {list.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm">{displayLocalized(item.name)}</p>
                {item.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">{String(item.description)}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {(item.origin_countries ?? []).length} origine(s) → {(item.destination_countries ?? []).length}{' '}
                  destination(s) · {(item.rates ?? []).length} tarif(s)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                  {item.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil size={14} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cette ligne ?</AlertDialogTitle>
                      <AlertDialogDescription>Les tarifs associés seront supprimés.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          del.mutate(item.id, {
                            onSuccess: () => {
                              qc.invalidateQueries({ queryKey: ['shipments', 'create-options'] })
                              qc.invalidateQueries({ queryKey: ['shipment-wizard', 'ship-lines-route'] })
                            },
                          })
                        }
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune ligne configurée</p>
          )}
        </div>
      </SettingsCard>

      <CrudSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editItem ? 'Modifier la ligne' : 'Nouvelle ligne'}
        onSubmit={handleSubmit}
        isLoading={create.isPending || update.isPending}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Actif</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <Label className="text-sm font-semibold">Pays d&apos;origine *</Label>
            <div className="max-h-36 overflow-y-auto space-y-2 border rounded-md p-2">
              {countries.map((c) => (
                <label key={`o-${c.id}`} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={originIds.includes(c.id)}
                    onChange={(e) => toggleOrigin(c.id, e.target.checked)}
                  />
                  <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-4 !w-5" />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <Label className="text-sm font-semibold">Pays de destination *</Label>
            <div className="max-h-36 overflow-y-auto space-y-2 border rounded-md p-2">
              {countries.map((c) => (
                <label key={`d-${c.id}`} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input"
                    checked={destIds.includes(c.id)}
                    onChange={(e) => toggleDest(c.id, e.target.checked)}
                  />
                  <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-4 !w-5" />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-semibold">Tarifs par mode *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRateRows((r) => [...r, emptyRateRow()])}
              >
                <Plus className="h-3 w-3 mr-1" />
                Ligne tarif
              </Button>
            </div>
            {rateRows.map((row, idx) => {
              const mode = modeList.find((m) => Number(m.id) === row.shipping_mode_id)
              const dts = mode ? normalizeModeDeliveryTimes(mode) : []
              return (
                <div key={idx} className="grid gap-2 rounded-md bg-muted/40 p-3 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Mode d&apos;expédition *</Label>
                    <Select
                      value={row.shipping_mode_id ? String(row.shipping_mode_id) : ''}
                      onValueChange={(v) => updateRate(idx, { shipping_mode_id: Number(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un mode" />
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
                  <div className="space-y-1">
                    <Label className="text-xs">Délai (optionnel)</Label>
                    <Select
                      value={row.delivery_time_id ? String(row.delivery_time_id) : '__none'}
                      onValueChange={(v: string) =>
                        updateRate(idx, { delivery_time_id: v === '__none' ? null : Number(v) })
                      }
                      disabled={!row.shipping_mode_id}
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
                  <div className="space-y-1">
                    <Label className="text-xs">Type de prix</Label>
                    <Select
                      value={row.pricing_type}
                      onValueChange={(v: string) =>
                        updateRate(idx, { pricing_type: v as RateDraft['pricing_type'] })
                      }
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
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Prix unitaire * ({globalCurrency})</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.unit_price}
                      onChange={(e) => updateRate(idx, { unit_price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Diviseur volumétrique (cm³/kg)</Label>
                    <Input
                      placeholder="ex. 5000 ou 6000 (IATA)"
                      value={row.volumetric_divisor}
                      onChange={(e) => updateRate(idx, { volumetric_divisor: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between md:col-span-2">
                    <span className="text-xs">Actif</span>
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={(v: boolean) => updateRate(idx, { is_active: v })}
                    />
                  </div>
                  {rateRows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="md:col-span-2 text-destructive"
                      onClick={() => setRateRows((r) => r.filter((_, i) => i !== idx))}
                    >
                      Retirer cette ligne
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CrudSheet>
    </>
  )
}
