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

interface CurrencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  curCode: string
  setCurCode: (v: string) => void
  curSymbol: string
  setCurSymbol: (v: string) => void
  curName: string
  setCurName: (v: string) => void
  onSubmit: () => void
}

export function CurrencyDialog({
  open,
  onOpenChange,
  curCode,
  setCurCode,
  curSymbol,
  setCurSymbol,
  curName,
  setCurName,
  onSubmit,
}: CurrencyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle devise</DialogTitle>
          <DialogDescription>Code ISO 4217 (3 lettres) et symbole d&apos;affichage.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={curCode} onChange={(e) => setCurCode(e.target.value.toUpperCase())} placeholder="XOF" maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label>Symbole</Label>
            <Input value={curSymbol} onChange={(e) => setCurSymbol(e.target.value)} placeholder="CFA" />
          </div>
          <div className="space-y-2">
            <Label>Nom (optionnel)</Label>
            <Input value={curName} onChange={(e) => setCurName(e.target.value)} placeholder="Franc CFA" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={onSubmit}>
            Ajouter et selectionner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
