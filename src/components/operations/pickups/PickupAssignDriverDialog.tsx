import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { displayLocalized } from '@/lib/localizedString'

interface PickupAssignDriverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDriverId: string
  setSelectedDriverId: (id: string) => void
  driverList: { id: number; name?: string | null }[]
  onAssign: () => void
  assignPending: boolean
}

export function PickupAssignDriverDialog({
  open,
  onOpenChange,
  selectedDriverId,
  setSelectedDriverId,
  driverList,
  onAssign,
  assignPending,
}: PickupAssignDriverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner un chauffeur</DialogTitle>
          <DialogDescription className="sr-only">Choisissez le chauffeur à assigner à ce ramassage.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
            <SelectTrigger><SelectValue placeholder="Choisir un chauffeur..." /></SelectTrigger>
            <SelectContent>
              {driverList.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>{displayLocalized(d.name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onAssign} disabled={!selectedDriverId || assignPending}>Assigner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
