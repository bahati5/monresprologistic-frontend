import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { UseMutationResult } from '@tanstack/react-query'

interface RegroupementStatusDialogProps {
  regroupementId: number | null
  onClose: () => void
  selectedStatus: string
  setSelectedStatus: (v: string) => void
  updateStatus: UseMutationResult<unknown, Error, { id: number; status: string }>
  onConfirm: () => void
}

export function RegroupementStatusDialog({
  regroupementId,
  onClose,
  selectedStatus,
  setSelectedStatus,
  updateStatus,
  onConfirm,
}: RegroupementStatusDialogProps) {
  return (
    <Dialog open={!!regroupementId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le statut du lot</DialogTitle>
          <DialogDescription className="sr-only">
            Le nouveau statut sera appliqué à toutes les expéditions du regroupement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nouveau statut</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">—</option>
              {SHIPMENT_STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={!selectedStatus || updateStatus.isPending}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
