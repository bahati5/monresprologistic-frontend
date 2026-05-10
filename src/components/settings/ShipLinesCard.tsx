import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { shipLineHooks, shippingModeHooks, useAppSettings, useCountriesList, useFormatMoney } from '@/hooks/useSettings'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { Button } from '@/components/ui/button'
import { Ship, Plus } from 'lucide-react'
import type { ShipLine, ShipLineCountryRef, ShipLineRateRow } from '@/types/settings'
import { emptyRateRow, type RateDraft } from './shiplines/shipLineRateDraft'
import { ShipLineSheetForm } from './shiplines/ShipLineSheetForm'
import { ShipLinesTable } from './shiplines/ShipLinesTable'

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
        <ShipLinesTable
          list={list}
          formatMoney={formatMoney}
          onEdit={openEdit}
          onConfirmDelete={(item) =>
            del.mutate(item.id, {
              onSuccess: () => {
                qc.invalidateQueries({ queryKey: ['shipments', 'create-options'] })
                qc.invalidateQueries({ queryKey: ['shipment-wizard', 'ship-lines-route'] })
              },
            })
          }
        />
      </SettingsCard>

      <CrudSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editItem ? 'Modifier la ligne' : 'Nouvelle ligne'}
        onSubmit={handleSubmit}
        isLoading={create.isPending || update.isPending}
      >
        <ShipLineSheetForm
          isActive={isActive}
          setIsActive={setIsActive}
          countries={countries}
          originIds={originIds}
          setOriginIds={setOriginIds}
          destIds={destIds}
          setDestIds={setDestIds}
          rateRows={rateRows}
          setRateRows={setRateRows}
          updateRate={updateRate}
          modeList={modeList}
          currencyUi={currencyUi}
          description={description}
          setDescription={setDescription}
        />
      </CrudSheet>
    </>
  )
}
