import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface QuoteEmailPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  previewHtml: string
  curLabel: string
}

export function QuoteEmailPreviewDialog({
  open,
  onOpenChange,
  previewHtml,
  curLabel,
}: QuoteEmailPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(100vw-1.5rem,56rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>Aperçu du devis (e-mail client)</DialogTitle>
          <DialogDescription>
            Rendu généré côté serveur, proche du message reçu par le client. Devise : {curLabel}.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-3 sm:p-4">
          {previewHtml ? (
            <iframe
              title="Aperçu du devis par e-mail"
              className="h-[min(72vh,640px)] w-full rounded-md border bg-white shadow-sm"
              srcDoc={previewHtml}
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            />
          ) : null}
        </div>
        <DialogFooter className="shrink-0 border-t px-6 py-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
