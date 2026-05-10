import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { LocationCascadeWithEnrichment, type LocationCascadeValue } from '@/components/location/LocationCascadeWithEnrichment'

export interface ClientEditFormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  phone_secondary: string
  address: string
  landmark: string
  zip_code: string
  country_id: string | number
  state_id: string | number
  city_id: string | number
}

export interface ClientEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientFullName: string
  editForm: ClientEditFormState
  onFieldChange: (key: keyof ClientEditFormState, value: string | number) => void
  editAddressValid: boolean
  editSaving: boolean
  onSubmit: () => void
}

export function ClientEditDialog({
  open,
  onOpenChange,
  clientFullName,
  editForm,
  onFieldChange,
  editAddressValid,
  editSaving,
  onSubmit,
}: ClientEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la fiche client</DialogTitle>
          <DialogDescription>
            Mettre à jour les informations de {clientFullName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prénom *</Label>
              <Input value={editForm.first_name || ''} onChange={e => onFieldChange('first_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={editForm.last_name || ''} onChange={e => onFieldChange('last_name', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email || ''} onChange={e => onFieldChange('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone *</Label>
              <Input value={editForm.phone || ''} onChange={e => onFieldChange('phone', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Téléphone secondaire</Label>
            <Input value={editForm.phone_secondary || ''} onChange={e => onFieldChange('phone_secondary', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={editForm.address || ''} onChange={e => onFieldChange('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Repère</Label>
              <Input value={editForm.landmark || ''} onChange={e => onFieldChange('landmark', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input value={editForm.zip_code || ''} onChange={e => onFieldChange('zip_code', e.target.value)} />
            </div>
          </div>
          <LocationCascadeWithEnrichment
            value={{
              countryId: editForm.country_id || null,
              stateId: editForm.state_id || null,
              cityId: editForm.city_id || null,
            } as LocationCascadeValue}
            onChange={(loc) => {
              onFieldChange('country_id', loc.countryId || '')
              onFieldChange('state_id', loc.stateId || '')
              onFieldChange('city_id', loc.cityId || '')
            }}
          />
          {!editAddressValid ? (
            <p className="text-xs text-muted-foreground">
              Adresse complète obligatoire : rue, pays, région et ville doivent être renseignés (un changement de pays vide région et ville jusqu&apos;à nouvelle sélection).
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={onSubmit}
            disabled={
              !editForm.first_name ||
              !editForm.last_name ||
              !editForm.phone ||
              !editAddressValid ||
              editSaving
            }
          >
            {editSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
