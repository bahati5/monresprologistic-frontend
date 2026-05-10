import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { displayLocalized } from '@/lib/localizedString'

type StatusMutation = {
  isPending: boolean
  mutate: (
    vars: { id: number; status: string; notes?: string },
    opts?: { onSuccess?: () => void },
  ) => void
}

type AssignDriverMutation = {
  isPending: boolean
  mutate: (
    vars: { id: number; driver_id: number },
    opts?: { onSuccess?: () => void },
  ) => void
}

export interface ShipmentDetailStatusDriverDialogsProps {
  statusDialogOpen: boolean
  onStatusDialogOpenChange: (open: boolean) => void
  driverDialogOpen: boolean
  onDriverDialogOpenChange: (open: boolean) => void
  statusCode: string
  transitions: Array<{ code: string; label: string }>
  selectedStatusCode: string
  onSelectedStatusCodeChange: (code: string) => void
  statusNote: string
  onStatusNoteChange: (note: string) => void
  updateStatus: StatusMutation
  onConfirmStatusChange: () => void
  driverList: Array<{ id: number; name: unknown; phone?: string | null }>
  selectedDriverId: string
  onSelectedDriverIdChange: (id: string) => void
  assignDriver: AssignDriverMutation
  onConfirmAssignDriver: () => void
}

export function ShipmentDetailStatusDriverDialogs({
  statusDialogOpen,
  onStatusDialogOpenChange,
  driverDialogOpen,
  onDriverDialogOpenChange,
  statusCode,
  transitions,
  selectedStatusCode,
  onSelectedStatusCodeChange,
  statusNote,
  onStatusNoteChange,
  updateStatus,
  onConfirmStatusChange,
  driverList,
  selectedDriverId,
  onSelectedDriverIdChange,
  assignDriver,
  onConfirmAssignDriver,
}: ShipmentDetailStatusDriverDialogsProps) {
  return (
    <>
      <Dialog open={statusDialogOpen} onOpenChange={onStatusDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription className="sr-only">Mettre à jour le statut de l&apos;expédition.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <Select value={selectedStatusCode} onValueChange={onSelectedStatusCodeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un statut..." />
                </SelectTrigger>
                <SelectContent>
                  {transitions.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">Aucune transition disponible</div>
                  ) : (
                    transitions.map((t) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (optionnelle)</Label>
              <Textarea value={statusNote} onChange={(e) => onStatusNoteChange(e.target.value)} placeholder="Commentaire..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onStatusDialogOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={onConfirmStatusChange}
              disabled={!selectedStatusCode || transitions.length === 0 || updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Mise a jour...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={driverDialogOpen} onOpenChange={onDriverDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un chauffeur</DialogTitle>
            <DialogDescription>
              {statusCode === 'pending_drop_off'
                ? 'Ramassage : chauffeur qui récupère le colis chez l’expéditeur.'
                : 'Livraison : chauffeur qui achemine ou remet le colis au destinataire.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Chauffeur</Label>
              <Select value={selectedDriverId} onValueChange={onSelectedDriverIdChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un chauffeur..." />
                </SelectTrigger>
                <SelectContent>
                  {driverList.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {displayLocalized(d.name)}
                      {d.phone ? ` (${d.phone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onDriverDialogOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onConfirmAssignDriver} disabled={!selectedDriverId || assignDriver.isPending}>
              {assignDriver.isPending ? 'Assignation...' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
