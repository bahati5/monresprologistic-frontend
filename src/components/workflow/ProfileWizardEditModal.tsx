import { useState } from 'react'
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
import { useUpdateClient } from '@/hooks/useCrm'
import { usePhoneCountries } from '@/hooks/useSettings'
import { PhoneContactFields } from '@/components/PhoneContactFields'
import { LocationCascadeWithEnrichment, type LocationCascadeValue } from '@/components/location/LocationCascadeWithEnrichment'
import { Loader2 } from 'lucide-react'

export type WizardEditProfile = {
  id: number
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  phone_secondary?: string | null
  email?: string | null
  address?: string | null
  landmark?: string | null
  zip_code?: string | null
  country?: { id?: number } | null
  country_id?: number | null
  state?: { id?: number } | null
  state_id?: number | null
  city?: { id?: number } | null
  city_id?: number | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: WizardEditProfile | null | undefined
  onUpdated: (profileId: number) => void
}

function ProfileWizardEditForm({
  profile,
  onOpenChange,
  onUpdated,
}: {
  profile: WizardEditProfile
  onOpenChange: (open: boolean) => void
  onUpdated: (profileId: number) => void
}) {
  const updateClient = useUpdateClient()
  const { data: phoneCountries = [], isLoading: loadingPhoneCountries } = usePhoneCountries()

  const [firstName, setFirstName] = useState(() => profile.first_name || '')
  const [lastName, setLastName] = useState(() => profile.last_name || '')
  const [phone, setPhone] = useState(() => profile.phone || '')
  const [phoneSecondary, setPhoneSecondary] = useState(() => profile.phone_secondary || '')
  const [email, setEmail] = useState(() => profile.email || '')
  const [address, setAddress] = useState(() => profile.address || '')
  const [landmark, setLandmark] = useState(() => profile.landmark || '')
  const [zipCode, setZipCode] = useState(() => profile.zip_code || '')
  const [countryId, setCountryId] = useState<number | ''>(() => profile.country?.id || profile.country_id || '')
  const [stateId, setStateId] = useState<number | ''>(() => profile.state?.id || profile.state_id || '')
  const [cityId, setCityId] = useState<number | ''>(() => profile.city?.id || profile.city_id || '')

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    phone.trim() &&
    address.trim() &&
    countryId &&
    stateId &&
    cityId

  const handleSubmit = () => {
    if (!canSubmit || !profile.id) return
    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      phone_secondary: phoneSecondary.trim() || null,
      email: email.trim() || null,
      address: address.trim(),
      landmark: landmark.trim() || null,
      zip_code: zipCode.trim() || null,
      country_id: Number(countryId),
      state_id: Number(stateId),
      city_id: Number(cityId),
    }

    updateClient.mutate(
      { id: profile.id, payload },
      {
        onSuccess: () => {
          onUpdated(profile.id)
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Modifier la fiche client</DialogTitle>
        <DialogDescription>
          Mettre à jour les informations de contact et l&apos;adresse du client.
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
              placeholder="Ex: 123 Rue de la Paix, Quartier Plateau"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Repère (optionnel)</Label>
            <Input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Ex: Près de la pharmacie"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Code postal (optionnel)</Label>
            <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Ex: 00225" />
          </div>

          <div className="sm:col-span-2">
            <LocationCascadeWithEnrichment
              value={{
                countryId: countryId || null,
                stateId: stateId || null,
                cityId: cityId || null,
              } as LocationCascadeValue}
              onChange={(loc) => {
                setCountryId(loc.countryId || '')
                setStateId(loc.stateId || '')
                setCityId(loc.cityId || '')
              }}
            />
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 bg-background pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateClient.isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || updateClient.isPending}>
            {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </DialogFooter>
    </>
  )
}

export function ProfileWizardEditModal({
  open,
  onOpenChange,
  profile,
  onUpdated,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(100vw-1.5rem,720px)] max-w-[720px] overflow-y-auto sm:max-w-[720px]">
        {open && profile ? (
          <ProfileWizardEditForm
            key={profile.id}
            profile={profile}
            onOpenChange={onOpenChange}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
