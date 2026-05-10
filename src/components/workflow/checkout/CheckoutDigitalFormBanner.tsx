import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CheckoutDigitalFormBannerProps {
  onViewForm: () => void
}

export function CheckoutDigitalFormBanner({ onViewForm }: CheckoutDigitalFormBannerProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Aperçu du formulaire d&apos;expédition, impression ou téléchargement PDF.
      </p>
      <Button type="button" variant="secondary" size="sm" className="shrink-0 gap-1.5" onClick={onViewForm}>
        <FileText size={14} />
        Formulaire numérique
      </Button>
    </div>
  )
}
