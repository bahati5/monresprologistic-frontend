import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TimezoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tzManual: string
  setTzManual: (v: string) => void
  onSubmit: () => void
}

export function TimezoneDialog({ open, onOpenChange, tzManual, setTzManual, onSubmit }: TimezoneDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fuseau horaire manuel</DialogTitle>
          <DialogDescription>
            Saisissez un identifiant IANA valide (ex. <code className="text-xs">Europe/Brussels</code>).
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label>Fuseau</Label>
          <Input value={tzManual} onChange={(e) => setTzManual(e.target.value)} placeholder="Europe/Paris" className="mt-2" />
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={onSubmit}>
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
