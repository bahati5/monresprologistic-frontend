import { Button } from '@/components/ui/button'

interface PurchaseDetailErrorStateProps {
  onBack: () => void
}

export function PurchaseDetailErrorState({ onBack }: PurchaseDetailErrorStateProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
      <p className="font-medium text-destructive">Demande introuvable ou accès refusé.</p>
      <Button variant="outline" className="mt-4" onClick={onBack}>
        Retour
      </Button>
    </div>
  )
}
