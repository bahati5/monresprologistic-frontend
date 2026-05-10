import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CheckoutCompletionBarProps {
  isFullyPaid: boolean
  onPaymentRecorded: () => void
}

export function CheckoutCompletionBar({ isFullyPaid, onPaymentRecorded }: CheckoutCompletionBarProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        {!isFullyPaid && (
          <p className="text-sm text-amber-600 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            Le paiement complet est requis pour continuer
          </p>
        )}
      </div>
      <Button
        onClick={onPaymentRecorded}
        size="lg"
        className="gap-2"
        disabled={!isFullyPaid}
      >
        <CheckCircle size={18} />
        Terminer et ouvrir l&apos;expédition
      </Button>
    </div>
  )
}
