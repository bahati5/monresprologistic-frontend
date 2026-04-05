import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { shipLineHooks, shippingModeHooks, useAppSettings, useCountriesList, useFormatMoney } from '@/hooks/useSettings'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
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
import { CountryMultiSelect } from '@/components/ui/CountryMultiSelect'
import { CountryFlag } from '@/components/CountryFlag'

type RateDraft = {
  shipping_mode_id: number
  unit_price: string
  is_active: boolean
  delivery_label_override: string
}

function emptyRateRow(): RateDraft {
  return {
    shipping_mode_id: 0,
    unit_price: '0',
    is_active: true,
    delivery_label_override: '',
  }
}

function deliveryOptionsForMode(mode: Record<string, unknown>): string[] {
  const raw = (mode.delivery_options ?? mode.deliveryOptions) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x)).filter((s) => s.trim() !== '')
}

function FlagsCell({ countries }: { countries: ShipLineCountryRef[] }) {
  if (!countries.length) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 max-w-[min(100%,260px)]">
      {countries.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-1.5 py-0.5 text-xs"
          title={c.name}
        >
          <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-3 !w-4 shrink-0" />
          <span className="truncate max-w-[4.5rem]">{c.iso2 || c.code || c.name}</span>
        </span>
      ))}
    </div>
  )
}

export function ShipLinesCard() {
  const qc = useQueryClient()
  const { data: appSettings } = useAppSettings()
  const { formatMoney } = useFormatMoney()
  const globalCurrency = String(appSettings?.currency ?? 'USD').toUpperCase()
  const currencyUi = resolveMoneySymbol({
    currency: globalCurrency,
    currency_symbol: String(appSettings?.currency_symbol ?? ''),
  })
  const { data: items, isLoading } = shipLineHooks.useList()
  const { data: modes } = shippingModeHooks.useList()
  const { data: countriesRaw = [] } = useCountriesList()
  const create = shipLineHooks.useCreate()
  const update = shipLineHooks.useUpdate()
  const del = shipLineHooks.useDelete()

  const countries = useMemo(
    () =>
      (countriesRaw ?? []).map(
        (c) =>
          ({
            id: c.id,
            name: c.name,
            code: c.code || null,
            iso2: c.iso2 ?? null,
            emoji: c.emoji ?? null,
          }) satisfies ShipLineCountryRef,
      ),
    [countriesRaw],
  )

  const modeList = useMemo(
    () => (Array.isArray(modes) ? (modes as unknown as Record<string, unknown>[]) : []),
    [modes],
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShipLine | null>(null)
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [originIds, setOriginIds] = useState<number[]>([])
  const [destIds, setDestIds] = useState<number[]>([])
  const [rateRows, setRateRows] = useState<RateDraft[]>([emptyRateRow()])

  const list = Array.isArray(items) ? (items as ShipLine[]) : []

  const openCreate = () => {
    setEditItem(null)
    setDescription('')
    setIsActive(true)
    setOriginIds([])
    setDestIds([])
    setRateRows([emptyRateRow()])
    setSheetOpen(true)
  }

  const openEdit = (item: ShipLine) => {
    setEditItem(item)
    setDescription(String(item.description ?? ''))
    setIsActive(item.is_active !== false)
    setOriginIds((item.origin_countries ?? []).map((c) => c.id))
    setDestIds((item.destination_countries ?? []).map((c) => c.id))
    const r = item.rates ?? []
    setRateRows(
      r.length
        ? r.map((row) => ({
            shipping_mode_id: row.shipping_mode_id,
            unit_price: String(row.unit_price ?? 0),
            is_active: row.is_active !== false,
            delivery_label_override: String(row.delivery_label_override ?? '').trim(),
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
        unit_price: Number(r.unit_price) || 0,
        currency: globalCurrency,
        is_active: r.is_active,
        delivery_label_override: r.delivery_label_override.trim() || null,
      }))
    return {
      name: '',
      description: description.trim() || null,
      is_active: isActive,
      origin_country_ids: originIds,
      dest_country_ids: destIds,
      rates,
    }
  }

  const handleSubmit = () => {
    const payload = buildPayload()
    if (payload.origin_country_ids.length === 0 || payload.dest_country_ids.length === 0) {
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
        merged.delivery_label_override = ''
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
        description={`Pays d'origine / destination et tarif par mode (prix en ${currencyUi}). Type de prix et diviseur volumétrique : réglages du mode d'expédition.`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter
          </Button>
        }
      >
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="p-3 font-medium">Route</th>
                <th className="p-3 font-medium">Origines</th>
                <th className="p-3 font-medium">Destinations</th>
                <th className="p-3 font-medium">Ligne</th>
                <th className="p-3 font-medium">Mode</th>
                <th className="p-3 font-medium">Délai (surcharge)</th>
                <th className="p-3 font-medium text-right">Prix</th>
                <th className="p-3 font-medium">Tarif</th>
                <th className="p-3 font-medium w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => {
                const rates = item.rates?.length ? item.rates : [null]
                const rowSpan = rates.length
                const origins = item.origin_countries ?? []
                const dests = item.destination_countries ?? []
                return rates.map((rate, i) => (
                  <tr
                    key={rate?.id != null ? `r-${rate.id}` : `l-${item.id}-${i}`}
                    className="border-b border-border last:border-0 hover:bg-muted/25 transition-colors"
                  >
                    {i === 0 ? (
                      <td rowSpan={rowSpan} className="align-top p-3 text-foreground">
                        <div className="font-medium leading-snug">{displayLocalized(item.name)}</div>
                        {item.description ? (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{String(item.description)}</p>
                        ) : null}
                      </td>
                    ) : null}
                    {i === 0 ? (
                      <td rowSpan={rowSpan} className="align-top p-3">
                        <FlagsCell countries={origins} />
                      </td>
                    ) : null}
                    {i === 0 ? (
                      <td rowSpan={rowSpan} className="align-top p-3">
                        <FlagsCell countries={dests} />
                      </td>
                    ) : null}
                    {i === 0 ? (
                      <td rowSpan={rowSpan} className="align-top p-3">
                        <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                          {item.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                    ) : null}
                    <td className="p-3 text-foreground">
                      {rate?.shipping_mode ? (
                        <span className="font-medium">{displayLocalized(String(rate.shipping_mode.name ?? ''))}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs max-w-[140px]">
                      {rate?.delivery_label_override ? String(rate.delivery_label_override) : '—'}
                    </td>
                    <td className="p-3 text-right font-medium tabular-nums whitespace-nowrap">
                      {rate != null ? formatMoney(Number(rate.unit_price ?? 0)) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {rate != null ? (
                        <Badge variant={rate.is_active !== false ? 'outline' : 'secondary'} className="text-xs">
                          {rate.is_active !== false ? 'Actif' : 'Inactif'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    {i === 0 ? (
                      <td rowSpan={rowSpan} className="align-top p-3">
                        <div className="flex flex-col gap-1">
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
                      </td>
                    ) : null}
                  </tr>
                ))
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground text-sm">
                    Aucune ligne configurée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
          <div className="flex items-center justify-between">
            <Label>Actif</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <Label className="text-sm font-semibold">Pays d&apos;origine *</Label>
            <CountryMultiSelect
              options={countries}
              selectedIds={originIds}
              onChange={setOriginIds}
              placeholder="Rechercher et sélectionner un ou plusieurs pays…"
            />
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <Label className="text-sm font-semibold">Pays de destination *</Label>
            <CountryMultiSelect
              options={countries}
              selectedIds={destIds}
              onChange={setDestIds}
              placeholder="Rechercher et sélectionner un ou plusieurs pays…"
            />
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
              const delayOpts = mode ? deliveryOptionsForMode(mode) : []
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
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Surcharge délai (optionnel)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Laisser vide pour le libellé défini sur le mode ; sinon préciser un délai spécifique à ce tarif.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <Input
                        className="flex-1"
                        placeholder="ex. 5–7 jours ouvrés"
                        value={row.delivery_label_override}
                        onChange={(e) => updateRate(idx, { delivery_label_override: e.target.value })}
                        disabled={!row.shipping_mode_id}
                      />
                      <Select
                        value="__pick"
                        onValueChange={(v) => {
                          if (v === '__pick' || v === '__clear') {
                            if (v === '__clear') updateRate(idx, { delivery_label_override: '' })
                            return
                          }
                          updateRate(idx, { delivery_label_override: v })
                        }}
                        disabled={!row.shipping_mode_id || delayOpts.length === 0}
                      >
                        <SelectTrigger className="sm:w-[200px]">
                          <SelectValue placeholder="Insérer depuis le mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__pick">Choisir un libellé du mode…</SelectItem>
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
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Prix * ({currencyUi})</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.unit_price}
                      onChange={(e) => updateRate(idx, { unit_price: e.target.value })}
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

          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Notes internes, précisions sur la route…"
            />
          </div>
        </div>
      </CrudSheet>
    </>
  )
}
