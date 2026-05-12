import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { useCreateClient } from '@/hooks/useCrm'
import { usePhoneCountries } from '@/hooks/useSettings'
import { useWizardCreateRecipient } from '@/hooks/useShipments'
import { PhoneContactFields } from '@/components/PhoneContactFields'
import { LocationCascadeWithEnrichment } from '@/components/location/LocationCascadeWithEnrichment'
export type ProfileWizardCreateMode = 'sender' | 'recipient'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ProfileWizardCreateMode
  senderProfileId?: number
  searchHint?: string
  onCreated: (profileId: number, clientName?: string) => void
  showPortalCheckbox?: boolean
  createPortalDefault?: boolean
}

function parseNameHint(hint: string): { first: string; last: string } {
  const t = hint.trim()
  if (!t) return { first: '', last: '' }
  const i = t.lastIndexOf(' ')
  if (i <= 0) return { first: t, last: '' }
  return { first: t.slice(0, i).trim(), last: t.slice(i + 1).trim() }
}

function getInitialWizardCreateState(searchHint: string | undefined) {
  const hint = searchHint?.trim() ?? ''
  let firstName = ''
  let lastName = ''
  let phone = ''
  const phoneSecondary = ''
  let email = ''
  if (hint.includes('@')) {
    email = hint
  } else if (/^[\d\s+().-]{6,}$/.test(hint)) {
    phone = hint
    const parsed = parseNameHint('')
    firstName = parsed.first
    lastName = parsed.last
  } else {
    const parsed = parseNameHint(hint)
    firstName = parsed.first
    lastName = parsed.last
  }
  return {
    firstName,
    lastName,
    phone,
    phoneSecondary,
    email,
    address: '',
    landmark: '',
    zipCode: '',
    countryId: '',
    stateId: '',
    cityId: '',
  }
}

type InnerProps = {
  mode: ProfileWizardCreateMode
  senderProfileId?: number
  searchHint?: string
  onCreated: (profileId: number, clientName?: string) => void
  onOpenChange: (open: boolean) => void
  showPortalCheckbox?: boolean
  createPortalDefault?: boolean
}

function ProfileWizardCreateForm({
  mode,
  senderProfileId,
  searchHint,
  onCreated,
  onOpenChange,
  showPortalCheckbox = false,
  createPortalDefault = false,
}: InnerProps) {
  const initial = useMemo(() => getInitialWizardCreateState(searchHint), [searchHint])
  const createClient = useCreateClient()
  const createRecipient = useWizardCreateRecipient()
  const { data: phoneCountries = [], isLoading: loadingPhoneCountries } = usePhoneCountries()
  const [portalChecked, setPortalChecked] = useState(createPortalDefault)

  const [firstName, setFirstName] = useState(initial.firstName)
  const [lastName, setLastName] = useState(initial.lastName)
  const [phone, setPhone] = useState(initial.phone)
  const [phoneSecondary, setPhoneSecondary] = useState(initial.phoneSecondary)
  const [email, setEmail] = useState(initial.email)
  const [address, setAddress] = useState(initial.address)
  const [landmark, setLandmark] = useState(initial.landmark)
  const [zipCode, setZipCode] = useState(initial.zipCode)
  const [countryId, setCountryId] = useState(initial.countryId)
  const [stateId, setStateId] = useState(initial.stateId)
  const [cityId, setCityId] = useState(initial.cityId)
  const countryIdRef = useRef(countryId)
  useEffect(() => {
    countryIdRef.current = countryId
  }, [countryId])

  const handlePrimaryDialCountryChange = useCallback((dialCountryId: number | null) => {
    if (dialCountryId == null) return
    const cur = countryIdRef.current
    if (cur !== '' && cur != null) return
    setStateId('')
    setCityId('')
    setCountryId(String(dialCountryId))
  }, [])

  const pending = createClient.isPending || createRecipient.isPending
  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    address.trim() &&
    countryId &&
    stateId &&
    cityId &&
    (mode === 'sender' || (senderProfileId != null && senderProfileId > 0))

  const handleSubmit = () => {
    if (!canSubmit) return
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const base = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      phone_secondary: phoneSecondary.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      zip_code: zipCode.trim() || undefined,
      country_id: Number(countryId),
      state_id: Number(stateId),
      city_id: Number(cityId),
    }

    if (mode === 'sender') {
      createClient.mutate(
        { ...base, create_portal: portalChecked },
        {
          onSuccess: (data: { client?: { id: number } }) => {
            const id = data?.client?.id
            if (id != null) {
              onCreated(id, fullName)
              onOpenChange(false)
            }
          },
        },
      )
    } else {
      createRecipient.mutate(
        { ...base, client_profile_id: senderProfileId },
        {
          onSuccess: (data: { id?: number }) => {
            const id = data?.id
            if (id != null) {
              onCreated(id, fullName)
              onOpenChange(false)
            }
          },
        },
      )
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === 'sender' ? 'Nouvel expéditeur (client)' : 'Nouveau destinataire'}
        </DialogTitle>
        <DialogDescription>
          Les données sont enregistrées comme sur le CRM / l&apos;assistant (même API). La devise des tarifs est celle
          des paramètres généraux.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Prénom *</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
        </div>
        <div className="space-y-1.5">
          <Label>Nom *</Label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <PhoneContactFields
            label="Téléphone *"
            primary={phone}
            secondary={phoneSecondary}
            onPrimaryChange={setPhone}
            onSecondaryChange={setPhoneSecondary}
            countries={phoneCountries}
            isLoadingCountries={loadingPhoneCountries}
            onPrimaryDialCountryChange={handlePrimaryDialCountryChange}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Adresse (rue, n°, quartier) *</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex. 12 av. de la Liberté, immeuble B"
            autoComplete="street-address"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Code postal</Label>
          <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} autoComplete="postal-code" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Pays, région et ville *</Label>
          <LocationCascadeWithEnrichment
            value={{
              countryId: countryId === '' ? '' : Number(countryId),
              stateId: stateId === '' ? '' : Number(stateId),
              cityId: cityId === '' ? '' : Number(cityId),
            }}
            onChange={(loc) => {
              setCountryId(loc.countryId === '' || loc.countryId == null ? '' : String(loc.countryId))
              setStateId(loc.stateId === '' || loc.stateId == null ? '' : String(loc.stateId))
              setCityId(loc.cityId === '' || loc.cityId == null ? '' : String(loc.cityId))
            }}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{mode === 'recipient' ? 'Complément / repère (optionnel)' : 'Complément (optionnel)'}</Label>
          <Input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Ex. près du marché, 2e porte à gauche, digicode…"
          />
        </div>
      </div>
      {showPortalCheckbox && mode === 'sender' && (
        <div className="flex items-center gap-2 py-2 border-t">
          <Checkbox
            id="modal-create-portal"
            checked={portalChecked}
            onCheckedChange={(checked) => setPortalChecked(checked === true)}
          />
          <Label htmlFor="modal-create-portal" className="text-sm font-medium cursor-pointer">
            Créer un accès portail (le client recevra un e-mail pour définir son mot de passe)
          </Label>
        </div>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit || pending}>
          {pending ? 'Enregistrement…' : 'Créer'}
        </Button>
      </DialogFooter>
    </>
  )
}

export function ProfileWizardCreateModal({
  open,
  onOpenChange,
  mode,
  senderProfileId,
  searchHint,
  onCreated,
  showPortalCheckbox = false,
  createPortalDefault = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(100vw-1.5rem,720px)] max-w-[720px] overflow-y-auto sm:max-w-[720px]">
        {open ? (
          <ProfileWizardCreateForm
            key={`${mode}-${searchHint ?? ''}`}
            mode={mode}
            senderProfileId={senderProfileId}
            searchHint={searchHint}
            onCreated={onCreated}
            onOpenChange={onOpenChange}
            showPortalCheckbox={showPortalCheckbox}
            createPortalDefault={createPortalDefault}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
