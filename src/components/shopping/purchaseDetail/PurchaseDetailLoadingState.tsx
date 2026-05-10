import { Loader2 } from 'lucide-react'

export function PurchaseDetailLoadingState() {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      Chargement du devis…
    </div>
  )
}
