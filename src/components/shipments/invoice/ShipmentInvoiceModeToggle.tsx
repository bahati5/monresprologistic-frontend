import { Button } from '@/components/ui/button'

export function ShipmentInvoiceModeToggle({
  useExtras,
  onSimple,
  onExtras,
}: {
  useExtras: boolean
  onSimple: () => void
  onExtras: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant={!useExtras ? 'default' : 'outline'} onClick={onSimple}>
        Montant simple
      </Button>
      <Button type="button" size="sm" variant={useExtras ? 'default' : 'outline'} onClick={onExtras}>
        Base + extras
      </Button>
    </div>
  )
}
