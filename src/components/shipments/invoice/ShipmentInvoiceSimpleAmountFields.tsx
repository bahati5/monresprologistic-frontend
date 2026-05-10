import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ShipmentInvoiceSimpleAmountFields({
  currencyUi,
  value,
  onChange,
}: {
  currencyUi: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Montant ({currencyUi})</Label>
      <Input type="number" min={0} step="0.01" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
