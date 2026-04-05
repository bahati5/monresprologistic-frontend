import { useCallback, useEffect, useRef, useState } from 'react'
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
  onCreated: (profileId: number) => void
}

function parseNameHint(hint: string): { first: string; last: string } {
  const t = hint.trim()
  if (!t) return { first: '', last: '' }
  const i = t.lastIndexOf(' ')
  if (i <= 0) return { first: t, last: '' }
  return { first: t.slice(0, i).trim(), last: t.slice(i + 1).trim() }
}

export function ProfileWizardCreateModal({
  open,
  onOpenChange,
  mode,
  senderProfileId,
  searchHint,
  onCreated,
}: Props) {
  const createClient = useCreateClient()
  const createRecipient = useWizardCreateRecipient()
  const { data: phoneCountries = [], isLoading: loadingPhoneCountries } = usePhoneCountries()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneSecondary, setPhoneSecondary] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [countryId, setCountryId] = useState('')
  const [stateId, setStateId] = useState('')
  const [cityId, setCityId] = useState('')
  const countryIdRef = useRef(countryId)
  countryIdRef.current = countryId

  useEffect(() => {
    if (!open) return
    const hint = searchHint?.trim() ?? ''
    if (hint.includes('@')) {
      setEmail(hint)
      setPhone('')
      setPhoneSecondary('')
      setFirstName('')
      setLastName('')
    } else if (/^[\d\s+().-]{6,}$/.test(hint)) {
      setPhone(hint)
      setPhoneSecondary('')
      setEmail('')
      const { first, last } = parseNameHint('')
      setFirstName(first)
      setLastName(last)
    } else {
      const { first, last } = parseNameHint(hint)
      setFirstName(first)
      setLastName(last)
      setEmail('')
      setPhone('')
      setPhoneSecondary('')
    }
    setAddress('')
    setLandmark('')
    setZipCode('')
    setCountryId('')
    setStateId('')
    setCityId('')
  }, [open, searchHint])

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
        { ...base, create_portal: false },
        {
          onSuccess: (data: { client?: { id: number } }) => {
            const id = data?.client?.id
            if (id != null) {
              onCreated(id)
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
              onCreated(id)
              onOpenChange(false)
            }
          },
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(100vw-1.5rem,720px)] max-w-[720px] overflow-y-auto sm:max-w-[720px]">
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || pending}>
            {pending ? 'Enregistrement…' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
