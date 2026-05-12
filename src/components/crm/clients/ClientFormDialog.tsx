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
import { Checkbox } from '@/components/ui/checkbox'

type ClientFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem: unknown
  form: Record<string, unknown>
  setField: (k: string, v: unknown) => void
  onSubmit: () => void
  createPending: boolean
  updatePending: boolean
}

export function ClientFormDialog({
  open,
  onOpenChange,
  editItem,
  form,
  setField,
  onSubmit,
  createPending,
  updatePending,
}: ClientFormDialogProps) {
  const pending = createPending || updatePending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
          <DialogDescription className="sr-only">
            {editItem ? 'Mettre à jour la fiche client.' : 'Créer un nouveau client CRM.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={(form.name as string) || ''} onChange={(e) => setField('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={(form.email as string) || ''} onChange={(e) => setField('email', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telephone</Label>
              <Input value={(form.phone as string) || ''} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Societe</Label>
              <Input value={(form.company as string) || ''} onChange={(e) => setField('company', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={(form.address as string) || ''} onChange={(e) => setField('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={(form.city as string) || ''} onChange={(e) => setField('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input value={(form.country as string) || ''} onChange={(e) => setField('country', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox
              id="client-form-create-portal"
              checked={form.create_portal === true}
              onCheckedChange={(checked) => setField('create_portal', checked === true)}
            />
            <Label htmlFor="client-form-create-portal" className="text-sm font-medium cursor-pointer">
              Créer un accès portail (le client recevra un e-mail pour définir son mot de passe)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!form.name || pending}>
            {pending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
