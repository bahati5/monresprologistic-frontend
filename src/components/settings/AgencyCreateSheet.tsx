import { useEffect, useRef, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { PhoneContactFields } from '@/components/PhoneContactFields'
import { LocationCascadeWithEnrichment } from '@/components/location/LocationCascadeWithEnrichment'
import { usePhoneCountries } from '@/hooks/useSettings'
import { suggestAgencyCodeFromName } from '@/lib/agencyCodeSuggest'
import { displayLocalized } from '@/lib/localizedString'
import type { Agency } from '@/types/settings'
import { Building2, MapPin } from 'lucide-react'

export type AgencySheetPayload = {
  name: string
  code: string
  is_active: boolean
  contact_phone: string
  contact_phone_secondary: string
  contact_email: string
  address: string
  country_id: number | '' | null
  state_id: number | '' | null
  city_id: number | '' | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  /** En édition : agence existante (id + champs). */
  initialAgency?: Agency | null
  isLoading: boolean
  onSave: (payload: AgencySheetPayload) => void
}

function emptyPayload(): AgencySheetPayload {
  return {
    name: '',
    code: '',
    is_active: true,
    contact_phone: '',
    contact_phone_secondary: '',
    contact_email: '',
    address: '',
    country_id: '',
    state_id: '',
    city_id: '',
  }
}

export function AgencyCreateSheet({
  open,
  onOpenChange,
  mode,
  initialAgency,
  isLoading,
  onSave,
}: Props) {
  const codeTouchedRef = useRef(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [contactPhone, setContactPhone] = useState('')
  const [contactPhoneSecondary, setContactPhoneSecondary] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [address, setAddress] = useState('')
  const [countryId, setCountryId] = useState<number | '' | null>('')
  const [stateId, setStateId] = useState<number | '' | null>('')
  const [cityId, setCityId] = useState<number | '' | null>('')

  const { data: phoneCountries = [], isLoading: loadingPhoneCountries } = usePhoneCountries()

  useEffect(() => {
    if (!open) return
    if (mode === 'create') {
      const z = emptyPayload()
      setName(z.name)
      setCode(z.code)
      setIsActive(z.is_active)
      setContactPhone(z.contact_phone)
      setContactPhoneSecondary(z.contact_phone_secondary)
      setContactEmail(z.contact_email)
      setAddress(z.address)
      setCountryId(z.country_id)
      setStateId(z.state_id)
      setCityId(z.city_id)
      codeTouchedRef.current = false
      return
    }
    if (mode === 'edit' && initialAgency) {
      const a = initialAgency
      setName(displayLocalized(a.name as unknown))
      setCode(a.code ?? '')
      setIsActive(a.is_active !== false)
      setContactPhone(a.contact_phone ?? '')
      setContactPhoneSecondary(a.contact_phone_secondary ?? '')
      setContactEmail(a.contact_email ?? '')
      setAddress(a.address ?? '')
      setCountryId(a.country_id ?? '')
      setStateId(a.state_id ?? '')
      setCityId(a.city_id ?? '')
      codeTouchedRef.current = true
    }
  }, [open, mode, initialAgency?.id])

  useEffect(() => {
    if (!open || mode !== 'create' || codeTouchedRef.current) return
    setCode(suggestAgencyCodeFromName(name))
  }, [name, open, mode])

  const handleSubmit = () => {
    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      is_active: isActive,
      contact_phone: contactPhone,
      contact_phone_secondary: contactPhoneSecondary,
      contact_email: contactEmail.trim(),
      address: address.trim(),
      country_id: countryId,
      state_id: stateId,
      city_id: cityId,
    })
  }

  const title = mode === 'create' ? 'Nouvelle agence' : "Modifier l'agence"
  const submitLabel = mode === 'create' ? 'Créer' : 'Enregistrer'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </span>
            {title}
          </SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Le code est proposé à partir du nom ; vous pouvez le corriger. La devise suit les paramètres généraux.'
              : 'Mettez à jour les informations et coordonnées de cette agence.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="-mx-6 min-h-0 flex-1 px-6">
          <div className="space-y-8 pb-4 pr-3 pt-2">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Informations générales</h3>
              <div className="space-y-2">
                <Label htmlFor="agency-name">Nom de l&apos;agence *</Label>
                <Input
                  id="agency-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Paris Nord"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agency-code">Code de l&apos;agence *</Label>
                <Input
                  id="agency-code"
                  value={code}
                  onChange={(e) => {
                    codeTouchedRef.current = true
                    setCode(e.target.value.toUpperCase())
                  }}
                  placeholder="Ex. PAR"
                  maxLength={32}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Suggestion automatique à partir du nom (modifiable). Lettres, chiffres, tirets ou underscores.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <div>
                  <Label htmlFor="agency-active" className="text-sm font-medium">
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground">Visible pour l&apos;affectation et les opérations.</p>
                </div>
                <Switch id="agency-active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Coordonnées &amp; adresse
              </h3>

              <PhoneContactFields
                label="Téléphone"
                primary={contactPhone}
                secondary={contactPhoneSecondary}
                onPrimaryChange={setContactPhone}
                onSecondaryChange={setContactPhoneSecondary}
                countries={phoneCountries}
                isLoadingCountries={loadingPhoneCountries}
              />

              <div className="space-y-2">
                <Label htmlFor="agency-email">Email de contact</Label>
                <Input
                  id="agency-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@exemple.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency-address">Adresse physique</Label>
                <Textarea
                  id="agency-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rue, numéro, bâtiment, étage…"
                  rows={3}
                  className="min-h-[88px] resize-y"
                />
              </div>

              <LocationCascadeWithEnrichment
                allowEmpty
                value={{ countryId, stateId, cityId }}
                onChange={(loc) => {
                  setCountryId(loc.countryId)
                  setStateId(loc.stateId)
                  setCityId(loc.cityId)
                }}
              />
            </section>
          </div>
        </ScrollArea>

        <SheetFooter className="gap-2 border-t pt-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading || !name.trim() || !code.trim()}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Enregistrement…
              </span>
            ) : (
              submitLabel
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
