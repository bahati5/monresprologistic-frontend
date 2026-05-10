import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface ShippingModeSheetFieldsProps {
  form: Record<string, unknown>
  set: (k: string, v: unknown) => void
  addDeliveryOptionRow: () => void
  updateDeliveryOptionRow: (index: number, value: string) => void
  removeDeliveryOptionRow: (index: number) => void
}

export function ShippingModeSheetFields({
  form,
  set,
  addDeliveryOptionRow,
  updateDeliveryOptionRow,
  removeDeliveryOptionRow,
}: ShippingModeSheetFieldsProps) {
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label>Nom</Label>
        <Input value={String(form.name ?? '')} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={String(form.description ?? '')}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Ordre d'affichage</Label>
        <Input
          type="number"
          min={0}
          value={Number(form.sort_order) || 0}
          onChange={(e) => set('sort_order', Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Diviseur volumétrique par défaut (cm³/kg, optionnel)</Label>
        <Input
          placeholder="ex. 5000 ou 6000 (IATA)"
          value={String(form.volumetric_divisor ?? '')}
          onChange={(e) => set('volumetric_divisor', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Type de prix (calcul du tarif pour ce mode)</Label>
        <Select
          value={
            form.default_pricing_type != null && String(form.default_pricing_type) !== ''
              ? String(form.default_pricing_type)
              : '__none'
          }
          onValueChange={(v) => set('default_pricing_type', v === '__none' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Aucune préférence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Aucune préférence</SelectItem>
            <SelectItem value="per_kg">Par kg</SelectItem>
            <SelectItem value="per_volume">Par m³</SelectItem>
            <SelectItem value="flat">Forfait</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Actif</Label>
        <Switch checked={form.is_active !== false} onCheckedChange={(v) => set('is_active', v)} />
      </div>

      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-semibold">Libellés de délai proposés</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDeliveryOptionRow}>
            <Plus className="h-3 w-3 mr-1" />
            Ajouter un libellé
          </Button>
        </div>
        {((form.delivery_options as string[]) ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun libellé — l’assistant pourra saisir un délai librement.</p>
        ) : null}
        {((form.delivery_options as string[]) ?? []).map((row, idx) => (
          <div key={idx} className="flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-2">
            <div className="min-w-[200px] flex-1 space-y-1">
              <Label className="text-xs">Libellé</Label>
              <Input
                value={row}
                onChange={(e) => updateDeliveryOptionRow(idx, e.target.value)}
                placeholder="ex. 3–5 jours ouvrés"
              />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeDeliveryOptionRow(idx)}>
              Retirer
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
