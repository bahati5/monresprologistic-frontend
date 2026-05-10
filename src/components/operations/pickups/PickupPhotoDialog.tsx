import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Camera } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

interface PickupPhotoDialogProps {
  pickupId: number | null
  photoFile: File | null
  setPhotoFile: (f: File | null) => void
  onClose: () => void
  uploadPhoto: UseMutationResult<unknown, Error, { pickupId: number; file: File }>
}

export function PickupPhotoDialog({
  pickupId,
  photoFile,
  setPhotoFile,
  onClose,
  uploadPhoto,
}: PickupPhotoDialogProps) {
  return (
    <Dialog open={!!pickupId} onOpenChange={(open) => { if (!open) { onClose(); setPhotoFile(null) } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Camera size={18} />Photo de preuve</DialogTitle>
          <DialogDescription>Uploadez une photo pour prouver la collecte ou la livraison. Obligatoire.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            type="file"
            accept="image/*"
            onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
          />
          {photoFile ? (
            <p className="text-xs text-muted-foreground">{photoFile.name}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setPhotoFile(null) }}>Annuler</Button>
          <Button
            onClick={() => pickupId && photoFile && uploadPhoto.mutate({ pickupId, file: photoFile })}
            disabled={!photoFile || uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? 'Upload...' : 'Enregistrer la photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
