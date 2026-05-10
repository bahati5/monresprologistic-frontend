import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CountryMultiSelect } from '@/components/ui/CountryMultiSelect'
import type { ShipLineCountryRef } from '@/types/settings'
import type { RateDraft } from './shipLineRateDraft'
import type { Dispatch, SetStateAction } from 'react'
import { ShipLineRatesEditor } from './ShipLineRatesEditor'

interface ShipLineSheetFormProps {
  isActive: boolean
  setIsActive: (v: boolean) => void
  countries: ShipLineCountryRef[]
  originIds: number[]
  setOriginIds: (ids: number[]) => void
  destIds: number[]
  setDestIds: (ids: number[]) => void
  rateRows: RateDraft[]
  setRateRows: Dispatch<SetStateAction<RateDraft[]>>
  updateRate: (idx: number, patch: Partial<RateDraft>) => void
  modeList: Record<string, unknown>[]
  currencyUi: string
  description: string
  setDescription: (v: string) => void
}

export function ShipLineSheetForm({
  isActive,
  setIsActive,
  countries,
  originIds,
  setOriginIds,
  destIds,
  setDestIds,
  rateRows,
  setRateRows,
  updateRate,
  modeList,
  currencyUi,
  description,
  setDescription,
}: ShipLineSheetFormProps) {
  return (
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

      <ShipLineRatesEditor
        rateRows={rateRows}
        setRateRows={setRateRows}
        updateRate={updateRate}
        modeList={modeList}
        currencyUi={currencyUi}
      />

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
  )
}
