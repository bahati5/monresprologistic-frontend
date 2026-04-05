import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DbCombobox, type DbComboboxOption } from '@/components/ui/DbCombobox'
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
import { CountryFlag } from '@/components/CountryFlag'
import { useLocationCountries, useLocationStates, useLocationCities } from '@/hooks/useLocationCascade'
import { useCreateCountry, useCreateState, useCreateCity } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

export type LocationCascadeValue = {
  countryId: number | '' | null
  stateId: number | '' | null
  cityId: number | '' | null
}

const LOC_CLEAR = '__loc_clear__'

type Props = {
  value: LocationCascadeValue
  onChange: (next: LocationCascadeValue) => void
  disabled?: boolean
  className?: string
  /** Affiche « (Aucun) » pour vider pays / région / ville (ex. identité entreprise). */
  allowEmpty?: boolean
}

export function LocationCascadeWithEnrichment({ value, onChange, disabled, className, allowEmpty }: Props) {
  const countryNum = value.countryId === '' || value.countryId == null ? undefined : Number(value.countryId)
  const stateNum = value.stateId === '' || value.stateId == null ? undefined : Number(value.stateId)

  const { data: countries = [], isLoading: loadingCountries } = useLocationCountries()
  const { data: states = [], isLoading: loadingStates } = useLocationStates(countryNum)
  const { data: cities = [], isLoading: loadingCities } = useLocationCities(stateNum)

  const createCountry = useCreateCountry()
  const createState = useCreateState()
  const createCity = useCreateCity()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [wizCountryId, setWizCountryId] = useState<number | null>(null)
  const [wizStateId, setWizStateId] = useState<number | null>(null)

  const [cName, setCName] = useState('')
  const [cCode, setCCode] = useState('')
  const [cIso2, setCIso2] = useState('')
  const [cEmoji, setCEmoji] = useState('')
  const [rName, setRName] = useState('')
  const [vName, setVName] = useState('')

  const [stateDlgOpen, setStateDlgOpen] = useState(false)
  const [stateDlgName, setStateDlgName] = useState('')

  const [cityDlgOpen, setCityDlgOpen] = useState(false)
  const [cityDlgName, setCityDlgName] = useState('')

  const resetWizardFields = useCallback(() => {
    setWizardStep(1)
    setWizCountryId(null)
    setWizStateId(null)
    setCName('')
    setCCode('')
    setCIso2('')
    setCEmoji('')
    setRName('')
    setVName('')
  }, [])

  useEffect(() => {
    if (!wizardOpen) resetWizardFields()
  }, [wizardOpen, resetWizardFields])

  const countryOptions: DbComboboxOption[] = useMemo(() => {
    const rows = countries.map((c) => ({
      value: String(c.id),
      label: (
        <span className="flex items-center gap-2">
          <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} className="!h-4 !w-5" />
          <span>{c.name}</span>
          {c.iso2 ? <span className="text-muted-foreground text-xs">({c.iso2})</span> : null}
        </span>
      ),
      keywords: [c.name, String(c.id), c.code ?? '', c.iso2 ?? ''].filter(Boolean) as string[],
    }))
    if (allowEmpty) {
      return [
        {
          value: LOC_CLEAR,
          label: <span className="text-muted-foreground">(Aucun)</span>,
          keywords: ['aucun', 'clear'],
        },
        ...rows,
      ]
    }
    return rows
  }, [countries, allowEmpty])

  const stateOptions: DbComboboxOption[] = useMemo(
    () =>
      states.map((s) => ({
        value: String(s.id),
        label: s.name,
        keywords: [s.name, String(s.id)],
      })),
    [states],
  )

  const cityOptions: DbComboboxOption[] = useMemo(
    () =>
      cities.map((c) => ({
        value: String(c.id),
        label: c.name,
        keywords: [c.name, String(c.id)],
      })),
    [cities],
  )

  const setCountry = (v: string) => {
    if (!v || v === LOC_CLEAR) {
      onChange({ countryId: '', stateId: '', cityId: '' })
      return
    }
    onChange({ countryId: Number(v), stateId: '', cityId: '' })
  }

  const setState = (v: string) => {
    if (!v) {
      onChange({ ...value, stateId: '', cityId: '' })
      return
    }
    onChange({ ...value, stateId: Number(v), cityId: '' })
  }

  const setCity = (v: string) => {
    onChange({ ...value, cityId: v ? Number(v) : '' })
  }

  const openAddCountryWizard = () => {
    if (disabled) return
    resetWizardFields()
    setWizardOpen(true)
  }

  const openAddState = () => {
    if (disabled) return
    if (!countryNum) {
      toast.error('Choisissez d’abord un pays')
      return
    }
    setStateDlgName('')
    setStateDlgOpen(true)
  }

  const openAddCity = () => {
    if (disabled) return
    if (!stateNum) {
      toast.error('Choisissez d’abord une région')
      return
    }
    setCityDlgName('')
    setCityDlgOpen(true)
  }

  const submitWizardStep1 = async () => {
    const name = cName.trim()
    const code = cCode.trim().toUpperCase()
    if (!name || !code) {
      toast.error('Nom et code pays requis')
      return
    }
    try {
      const res = await createCountry.mutateAsync({
        name,
        code,
        iso2: cIso2.trim() || undefined,
        emoji: cEmoji.trim() || undefined,
      })
      const id = res.country?.id
      if (id == null) throw new Error('Réponse API invalide')
      setWizCountryId(id)
      setWizardStep(2)
      setRName('')
    } catch {
      /* toast géré par le hook */
    }
  }

  const submitWizardStep2 = async () => {
    const name = rName.trim()
    if (!name || wizCountryId == null) {
      toast.error('Nom de région requis')
      return
    }
    try {
      const res = await createState.mutateAsync({ name, country_id: wizCountryId })
      const id = res.state?.id
      if (id == null) throw new Error('Réponse API invalide')
      setWizStateId(id)
      setWizardStep(3)
      setVName('')
    } catch {
      /* hook */
    }
  }

  const submitWizardStep3 = async () => {
    const name = vName.trim()
    if (!name || wizStateId == null || wizCountryId == null) {
      toast.error('Nom de ville requis')
      return
    }
    try {
      const res = await createCity.mutateAsync({ name, state_id: wizStateId })
      const cid = res.city?.id
      if (cid == null) throw new Error('Réponse API invalide')
      onChange({
        countryId: wizCountryId,
        stateId: wizStateId,
        cityId: cid,
      })
      setWizardOpen(false)
    } catch {
      /* hook */
    }
  }

  const submitAddStateDialog = async () => {
    const name = stateDlgName.trim()
    if (!name || !countryNum) return
    try {
      const res = await createState.mutateAsync({ name, country_id: countryNum })
      const id = res.state?.id
      if (id == null) return
      onChange({ ...value, stateId: id, cityId: '' })
      setStateDlgOpen(false)
    } catch {
      /* hook */
    }
  }

  const submitAddCityDialog = async () => {
    const name = cityDlgName.trim()
    if (!name || !stateNum) return
    try {
      const res = await createCity.mutateAsync({ name, state_id: stateNum })
      const id = res.city?.id
      if (id == null) return
      onChange({ ...value, cityId: id })
      setCityDlgOpen(false)
    } catch {
      /* hook */
    }
  }

  const busy =
    createCountry.isPending || createState.isPending || createCity.isPending

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label>Pays</Label>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <DbCombobox
              value={
                value.countryId === '' || value.countryId == null
                  ? allowEmpty
                    ? LOC_CLEAR
                    : ''
                  : String(value.countryId)
              }
              onValueChange={setCountry}
              options={countryOptions}
              disabled={disabled}
              isLoading={loadingCountries}
              placeholder="Choisir un pays…"
              searchPlaceholder="Filtrer…"
              emptyText="Aucun pays."
              onOpenCreateModal={openAddCountryWizard}
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
          value={value.stateId === '' || value.stateId == null ? '' : String(value.stateId)}
          onValueChange={setState}
          options={stateOptions}
          disabled={disabled || !countryNum}
          isLoading={loadingStates}
          placeholder={countryNum ? 'Choisir une région…' : 'Choisissez d’abord un pays'}
          searchPlaceholder="Filtrer…"
          emptyText="Aucune région."
          onOpenCreateModal={openAddState}
          createButtonTitle={countryNum ? 'Nouvelle région' : 'Nouvelle région (choisissez un pays)'}
          showCreateButton={!disabled}
          createButtonDisabled={!countryNum}
        />
      </div>

      <div className="space-y-2">
        <Label>Ville</Label>
        <DbCombobox
          value={value.cityId === '' || value.cityId == null ? '' : String(value.cityId)}
          onValueChange={setCity}
          options={cityOptions}
          disabled={disabled || !stateNum}
          isLoading={loadingCities}
          placeholder={stateNum ? 'Choisir une ville…' : 'Choisissez d’abord une région'}
          searchPlaceholder="Filtrer…"
          emptyText="Aucune ville."
          onOpenCreateModal={openAddCity}
          createButtonTitle={stateNum ? 'Nouvelle ville' : 'Nouvelle ville (choisissez une région)'}
          showCreateButton={!disabled}
          createButtonDisabled={!stateNum}
        />
      </div>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {wizardStep === 1 && 'Nouveau pays'}
              {wizardStep === 2 && 'Région pour ce pays'}
              {wizardStep === 3 && 'Ville pour cette région'}
            </DialogTitle>
            <DialogDescription>
              Étape {wizardStep} sur 3 — chaque niveau enrichit le référentiel pour les prochains formulaires.
            </DialogDescription>
          </DialogHeader>

          {wizardStep === 1 && (
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label>Nom du pays *</Label>
                <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Ex. Belgique" />
              </div>
              <div className="space-y-2">
                <Label>Code (3 car. max) *</Label>
                <Input
                  value={cCode}
                  onChange={(e) => setCCode(e.target.value.toUpperCase())}
                  placeholder="BE"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label>ISO2 (optionnel)</Label>
                <Input value={cIso2} onChange={(e) => setCIso2(e.target.value.toUpperCase())} maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label>Drapeau emoji (optionnel)</Label>
                <Input value={cEmoji} onChange={(e) => setCEmoji(e.target.value)} placeholder="🇧🇪" />
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-2 py-2">
              <Label>Nom de la région / province *</Label>
              <Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Ex. Bruxelles-Capitale" />
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-2 py-2">
              <Label>Nom de la ville *</Label>
              <Input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Ex. Bruxelles" />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setWizardOpen(false)} disabled={busy}>
              Annuler
            </Button>
            {wizardStep === 1 && (
              <Button type="button" onClick={() => void submitWizardStep1()} disabled={busy}>
                {busy ? '…' : 'Suivant'}
              </Button>
            )}
            {wizardStep === 2 && (
              <Button type="button" onClick={() => void submitWizardStep2()} disabled={busy}>
                {busy ? '…' : 'Suivant'}
              </Button>
            )}
            {wizardStep === 3 && (
              <Button type="button" onClick={() => void submitWizardStep3()} disabled={busy}>
                {busy ? '…' : 'Terminer'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stateDlgOpen} onOpenChange={setStateDlgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle région</DialogTitle>
            <DialogDescription>Dans le pays sélectionné.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nom *</Label>
            <Input value={stateDlgName} onChange={(e) => setStateDlgName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStateDlgOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void submitAddStateDialog()} disabled={createState.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cityDlgOpen} onOpenChange={setCityDlgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle ville</DialogTitle>
            <DialogDescription>Dans la région sélectionnée.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nom *</Label>
            <Input value={cityDlgName} onChange={(e) => setCityDlgName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCityDlgOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void submitAddCityDialog()} disabled={createCity.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
