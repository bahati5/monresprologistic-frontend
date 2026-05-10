import { ArrowRight, CheckCircle2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ConvertedToShipmentBannerProps {
  convertedShipmentId: number
  onOpenShipment: (shipmentId: number) => void
}

export function ConvertedToShipmentBanner({ convertedShipmentId, onOpenShipment }: ConvertedToShipmentBannerProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-emerald-300/70 bg-gradient-to-br from-emerald-50/90 to-background shadow-lg dark:border-emerald-500/30 dark:from-emerald-950/30">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
            Votre achat a été converti en expédition
          </h2>
          <p className="text-sm text-emerald-800/80 dark:text-emerald-200/70">
            Votre colis est en cours de traitement logistique. Suivez-le depuis votre espace Expéditions.
          </p>
        </div>
        <Button
          size="lg"
          className="shrink-0 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
          onClick={() => onOpenShipment(convertedShipmentId)}
        >
          <Package className="h-5 w-5" aria-hidden />
          Voir l'expédition #{convertedShipmentId}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </CardContent>
    </Card>
  )
}
