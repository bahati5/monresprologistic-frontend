import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface PurchaseDetailCancelledStateProps {
  onBack: () => void
}

export function PurchaseDetailCancelledState({ onBack }: PurchaseDetailCancelledStateProps) {
  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" className="gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour
      </Button>
      <Alert variant="destructive">
        <AlertTitle>Demande annulée</AlertTitle>
        <AlertDescription>Cette demande d’achat assisté n’est plus active.</AlertDescription>
      </Alert>
    </div>
  )
}
