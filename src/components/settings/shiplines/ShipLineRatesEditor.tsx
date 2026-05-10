import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import type { Dispatch, SetStateAction } from 'react'
import type { RateDraft } from './shipLineRateDraft'
import { deliveryOptionsForMode, emptyRateRow } from './shipLineRateDraft'

interface ShipLineRatesEditorProps {
  rateRows: RateDraft[]
  setRateRows: Dispatch<SetStateAction<RateDraft[]>>
  updateRate: (idx: number, patch: Partial<RateDraft>) => void
  modeList: Record<string, unknown>[]
  currencyUi: string
}

export function ShipLineRatesEditor({
  rateRows,
  setRateRows,
  updateRate,
  modeList,
  currencyUi,
}: ShipLineRatesEditorProps) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold">Tarifs par mode *</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setRateRows((r) => [...r, emptyRateRow()])}>
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
              <Switch checked={row.is_active} onCheckedChange={(v: boolean) => updateRate(idx, { is_active: v })} />
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
  )
}
