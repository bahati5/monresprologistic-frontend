import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { displayLocalized } from '@/lib/localizedString'
import type { BillingExtra } from '@/types/settings'
import type { ExtraRow } from './ShipmentInvoiceExtrasTypes'

export interface ShipmentInvoiceExtrasEditorProps {
  catalog: BillingExtra[]
  currencyUi: string
  baseAmount: string
  onBaseAmountChange: (value: string) => void
  extraRows: ExtraRow[]
  formatMoney: (n: number) => string
  previewTotal: number
  baseNum: number
  extrasTotal: number
  onOpenNewCatalogExtra: () => void
  addFromCatalog: (e: BillingExtra) => void
  addAdHocRow: () => void
  updateRow: (key: string, patch: Partial<ExtraRow>) => void
  removeRow: (key: string) => void
}

export function ShipmentInvoiceExtrasEditor({
  catalog,
  currencyUi,
  baseAmount,
  onBaseAmountChange,
  extraRows,
  formatMoney,
  previewTotal,
  baseNum,
  extrasTotal,
  onOpenNewCatalogExtra,
  addFromCatalog,
  addAdHocRow,
  updateRow,
  removeRow,
}: ShipmentInvoiceExtrasEditorProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Montant de base ({currencyUi})</Label>
        <Input type="number" min={0} step="0.01" value={baseAmount} onChange={(e) => onBaseAmountChange(e.target.value)} />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Extras</Label>
          <div className="flex flex-wrap gap-2">
            <Select
              onValueChange={(v) => {
                const id = Number(v)
                const found = catalog.find((x) => x.id === id)
                if (found) addFromCatalog(found)
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ajouter du catalogue" />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {displayLocalized(e.label as unknown)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={addAdHocRow}>
              Ligne libre
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onOpenNewCatalogExtra}>
              Nouvel extra (catalogue)
            </Button>
          </div>
        </div>

        {extraRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune ligne d&apos;extra.</p>
        ) : (
          <div className="space-y-3 rounded-md border p-3">
            {extraRows.map((r) => (
              <div key={r.key} className="grid gap-2 border-b pb-3 last:border-0 last:pb-0 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Libellé</Label>
                  <Input
                    value={r.label}
                    disabled={r.billing_extra_id != null}
                    onChange={(e) => updateRow(r.key, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={r.type}
                    disabled={r.billing_extra_id != null}
                    onValueChange={(v) => updateRow(r.key, { type: v as ExtraRow['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage</SelectItem>
                      <SelectItem value="fixed">Fixe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valeur</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={r.value}
                    disabled={r.billing_extra_id != null}
                    onChange={(e) => updateRow(r.key, { value: e.target.value })}
                  />
                </div>
                <div className="flex items-end md:col-span-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(r.key)}>
                    Retirer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Total estimé : <strong>{formatMoney(previewTotal)}</strong> (base {formatMoney(baseNum)} + extras {formatMoney(extrasTotal)})
      </p>
    </>
  )
}
