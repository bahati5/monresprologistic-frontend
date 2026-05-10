import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import type { FormDraft } from '@/hooks/useDrafts'

interface DraftResumeDialogProps {
  draft: FormDraft | null
  open: boolean
  onResume: (draft: FormDraft) => void
  onDiscard: (draft: FormDraft) => void
  onOpenChange: (open: boolean) => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function DraftResumeDialog({
  draft,
  open,
  onResume,
  onDiscard,
  onOpenChange,
}: DraftResumeDialogProps) {
  if (!draft) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Brouillon trouvé</DialogTitle>
          <DialogDescription className="text-center">
            Vous avez commencé ce formulaire le{' '}
            <span className="font-medium text-foreground">
              {formatDate(draft.last_saved_at)}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onDiscard(draft)}
          >
            Recommencer à zéro
          </Button>
          <Button onClick={() => onResume(draft)}>
            Reprendre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
