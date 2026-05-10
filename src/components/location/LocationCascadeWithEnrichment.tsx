import { DbCombobox } from '@/components/ui/DbCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LOC_CLEAR, useLocationCascadeEnriched, type LocationCascadeValue } from '@/hooks/useLocationCascadeEnriched'
import { cn } from '@/lib/utils'

export type { LocationCascadeValue }

type Props = {
  value: LocationCascadeValue
  onChange: (next: LocationCascadeValue) => void
  disabled?: boolean
  className?: string
  allowEmpty?: boolean
}

export function LocationCascadeWithEnrichment({ value, onChange, disabled, className, allowEmpty }: Props) {
  const lc = useLocationCascadeEnriched(value, onChange, { disabled, allowEmpty })

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label>Pays</Label>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <DbCombobox
              value={
                lc.value.countryId === '' || lc.value.countryId == null
                  ? lc.allowEmpty
                    ? LOC_CLEAR
                    : ''
                  : String(lc.value.countryId)
              }
              onValueChange={lc.setCountry}
              options={lc.countryOptions}
              disabled={disabled}
              isLoading={lc.loadingCountries}
              placeholder="Choisir un pays…"
              searchPlaceholder="Filtrer…"
              emptyText="Aucun pays."
              onOpenCreateModal={lc.openAddCountryWizard}
              createButtonTitle="Nouveau pays (assistant)"
              showCreateButton={!disabled}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          « + » ouvre l’assistant : pays, puis une région, puis une ville (obligatoires pour enrichir la base).
        </p>
      </div>

      <div className="space-y-2">
        <Label>Région / province</Label>
        <DbCombobox
          value={lc.value.stateId === '' || lc.value.stateId == null ? '' : String(lc.value.stateId)}
          onValueChange={lc.setState}
          options={lc.stateOptions}
          disabled={disabled || !lc.countryNum}
          isLoading={lc.loadingStates}
          placeholder={lc.countryNum ? 'Choisir une région…' : 'Choisissez d’abord un pays'}
          searchPlaceholder="Filtrer…"
          emptyText="Aucune région."
          onOpenCreateModal={lc.openAddState}
          createButtonTitle={lc.countryNum ? 'Nouvelle région' : 'Nouvelle région (choisissez un pays)'}
          showCreateButton={!disabled}
          createButtonDisabled={!lc.countryNum}
        />
      </div>

      <div className="space-y-2">
        <Label>Ville</Label>
        <DbCombobox
          value={lc.value.cityId === '' || lc.value.cityId == null ? '' : String(lc.value.cityId)}
          onValueChange={lc.setCity}
          options={lc.cityOptions}
          disabled={disabled || !lc.stateNum}
          isLoading={lc.loadingCities}
          placeholder={lc.stateNum ? 'Choisir une ville…' : 'Choisissez d’abord une région'}
          searchPlaceholder="Filtrer…"
          emptyText="Aucune ville."
          onOpenCreateModal={lc.openAddCity}
          createButtonTitle={lc.stateNum ? 'Nouvelle ville' : 'Nouvelle ville (choisissez une région)'}
          showCreateButton={!disabled}
          createButtonDisabled={!lc.stateNum}
        />
      </div>

      <Dialog open={lc.wizardOpen} onOpenChange={lc.setWizardOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lc.wizardStep === 1 && 'Nouveau pays'}
              {lc.wizardStep === 2 && 'Région pour ce pays'}
              {lc.wizardStep === 3 && 'Ville pour cette région'}
            </DialogTitle>
            <DialogDescription>
              Étape {lc.wizardStep} sur 3 — chaque niveau enrichit le référentiel pour les prochains formulaires.
            </DialogDescription>
          </DialogHeader>

          {lc.wizardStep === 1 && (
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label>Nom du pays *</Label>
                <Input value={lc.cName} onChange={(e) => lc.setCName(e.target.value)} placeholder="Ex. Belgique" />
              </div>
              <div className="space-y-2">
                <Label>Code (3 car. max) *</Label>
                <Input
                  value={lc.cCode}
                  onChange={(e) => lc.setCCode(e.target.value.toUpperCase())}
                  placeholder="BE"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label>ISO2 (optionnel)</Label>
                <Input value={lc.cIso2} onChange={(e) => lc.setCIso2(e.target.value.toUpperCase())} maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label>Drapeau emoji (optionnel)</Label>
                <Input value={lc.cEmoji} onChange={(e) => lc.setCEmoji(e.target.value)} placeholder="🇧🇪" />
              </div>
            </div>
          )}

          {lc.wizardStep === 2 && (
            <div className="space-y-2 py-2">
              <Label>Nom de la région / province *</Label>
              <Input value={lc.rName} onChange={(e) => lc.setRName(e.target.value)} placeholder="Ex. Bruxelles-Capitale" />
            </div>
          )}

          {lc.wizardStep === 3 && (
            <div className="space-y-2 py-2">
              <Label>Nom de la ville *</Label>
              <Input value={lc.vName} onChange={(e) => lc.setVName(e.target.value)} placeholder="Ex. Bruxelles" />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => lc.setWizardOpen(false)} disabled={lc.busy}>
              Annuler
            </Button>
            {lc.wizardStep === 1 && (
              <Button type="button" onClick={() => void lc.submitWizardStep1()} disabled={lc.busy}>
                {lc.busy ? '…' : 'Suivant'}
              </Button>
            )}
            {lc.wizardStep === 2 && (
              <Button type="button" onClick={() => void lc.submitWizardStep2()} disabled={lc.busy}>
                {lc.busy ? '…' : 'Suivant'}
              </Button>
            )}
            {lc.wizardStep === 3 && (
              <Button type="button" onClick={() => void lc.submitWizardStep3()} disabled={lc.busy}>
                {lc.busy ? '…' : 'Terminer'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lc.stateDlgOpen} onOpenChange={lc.setStateDlgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle région</DialogTitle>
            <DialogDescription>Dans le pays sélectionné.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nom *</Label>
            <Input value={lc.stateDlgName} onChange={(e) => lc.setStateDlgName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => lc.setStateDlgOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void lc.submitAddStateDialog()} disabled={lc.createState.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lc.cityDlgOpen} onOpenChange={lc.setCityDlgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle ville</DialogTitle>
            <DialogDescription>Dans la région sélectionnée.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nom *</Label>
            <Input value={lc.cityDlgName} onChange={(e) => lc.setCityDlgName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => lc.setCityDlgOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void lc.submitAddCityDialog()} disabled={lc.createCity.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
