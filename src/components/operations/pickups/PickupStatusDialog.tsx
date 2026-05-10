import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Camera, AlertTriangle } from 'lucide-react'
import { PICKUP_STATUS_LABELS } from '@/components/operations/pickups/pickupStatus'

interface PickupStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStatus: string
  setSelectedStatus: (v: string) => void
  failureReason: string
  setFailureReason: (v: string) => void
  completionNotes: string
  setCompletionNotes: (v: string) => void
  onConfirm: () => void
  updatePending: boolean
}

export function PickupStatusDialog({
  open,
  onOpenChange,
  selectedStatus,
  setSelectedStatus,
  failureReason,
  setFailureReason,
  completionNotes,
  setCompletionNotes,
  onConfirm,
  updatePending,
}: PickupStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le statut</DialogTitle>
          <DialogDescription className="sr-only">Sélectionnez le nouveau statut du ramassage.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger><SelectValue placeholder="Nouveau statut..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(PICKUP_STATUS_LABELS).map(([code, label]) => (
                <SelectItem key={code} value={code}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStatus === 'failed' ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-destructive">
                <AlertTriangle size={12} />Raison de l'échec (obligatoire)
              </Label>
              <Select value={failureReason} onValueChange={setFailureReason}>
                <SelectTrigger><SelectValue placeholder="Choisir une raison..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_absent">Client absent</SelectItem>
                  <SelectItem value="address_not_found">Adresse introuvable</SelectItem>
                  <SelectItem value="package_refused">Colis refusé</SelectItem>
                  <SelectItem value="access_issue">Problème d'accès</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {(selectedStatus === 'collected' || selectedStatus === 'delivered') ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera size={14} />Notes de livraison (optionnel)
              </Label>
              <Textarea value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} rows={2} />
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Camera size={12} />Une photo de preuve est requise. Uploadez-la via "Photo preuve" si ce n'est pas encore fait.
              </p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onConfirm} disabled={!selectedStatus || updatePending}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
