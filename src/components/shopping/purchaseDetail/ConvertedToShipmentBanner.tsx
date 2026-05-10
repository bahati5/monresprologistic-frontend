import { ArrowRight, CheckCircle2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConvertedToShipmentBannerProps {
  convertedShipmentId: number
  onOpenShipment: (shipmentId: number) => void
}

export function ConvertedToShipmentBanner({ convertedShipmentId, onOpenShipment }: ConvertedToShipmentBannerProps) {
  return (
    <div className="glass neo-raised rounded-xl px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-emerald-200/50 dark:border-emerald-500/20">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shrink-0">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Converti en expédition</p>
          <p className="text-xs text-muted-foreground">
            Votre colis est en cours de traitement logistique.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
        onClick={() => onOpenShipment(convertedShipmentId)}
      >
        <Package size={14} />
        Expédition #{convertedShipmentId}
        <ArrowRight size={13} />
      </Button>
    </div>
  )
}
