import { SettingsCard } from '../SettingsCard'
import { LocationCascadeWithEnrichment } from '@/components/location/LocationCascadeWithEnrichment'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneContactFields } from '@/components/PhoneContactFields'
import type { PhoneCountryOption } from '@/lib/phoneInternational'
import { Settings } from 'lucide-react'

interface IdentitySettingsCardProps {
  form: Record<string, unknown>
  set: (key: string, value: unknown) => void
  phoneCountries: PhoneCountryOption[]
  loadingPhoneCountries: boolean
}

export function IdentitySettingsCard({
  form,
  set,
  phoneCountries,
  loadingPhoneCountries,
}: IdentitySettingsCardProps) {
  return (
    <SettingsCard title="Identite de l'entreprise" icon={Settings} description="Nom, contact et adresse">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nom de l&apos;application</Label>
          <Input value={String(form.app_name ?? '')} onChange={(e) => set('app_name', e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Nom légal / général (factures, PDF…). Le libellé de la barre latérale se règle dans l&apos;onglet
            Logo.
          </p>
        </div>
        <div className="space-y-2">
          <Label>URL du site</Label>
          <Input value={String(form.app_url ?? '')} onChange={(e) => set('app_url', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={String(form.app_email ?? '')}
            onChange={(e) => set('app_email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>N° entreprise / NIT</Label>
          <Input value={String(form.nit ?? '')} onChange={(e) => set('nit', e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <PhoneContactFields
            label="Téléphone fixe"
            primary={String(form.phone ?? '')}
            secondary={String(form.phone_secondary ?? '')}
            onPrimaryChange={(v) => set('phone', v)}
            onSecondaryChange={(v) => set('phone_secondary', v)}
            countries={phoneCountries}
            isLoadingCountries={loadingPhoneCountries}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <PhoneContactFields
            label="Téléphone mobile"
            primary={String(form.mobile ?? '')}
            secondary={String(form.mobile_secondary ?? '')}
            onPrimaryChange={(v) => set('mobile', v)}
            onSecondaryChange={(v) => set('mobile_secondary', v)}
            countries={phoneCountries}
            isLoadingCountries={loadingPhoneCountries}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Localisation (pays, région, ville)</Label>
          <LocationCascadeWithEnrichment
            allowEmpty
            value={{
              countryId: form.country_id as number | '' | null,
              stateId: form.state_id as number | '' | null,
              cityId: form.city_id as number | '' | null,
            }}
            onChange={(loc) => {
              set('country_id', loc.countryId)
              set('state_id', loc.stateId)
              set('city_id', loc.cityId)
              if (loc.countryId === '' || loc.countryId == null) {
                set('country', '')
                set('city', '')
              }
            }}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Adresse postale</Label>
          <Input
            value={String(form.address ?? '')}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Rue, numéro, bâtiment, quartier…"
            autoComplete="street-address"
          />
          <p className="text-xs text-muted-foreground">
            Saisissez uniquement la voie et le lieu précis ; pays, région et ville viennent des listes ci-dessus.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Code postal</Label>
          <Input
            value={String(form.postal_code ?? '')}
            onChange={(e) => set('postal_code', e.target.value)}
            placeholder="Ex. 1000"
            autoComplete="postal-code"
          />
        </div>
      </div>
    </SettingsCard>
  )
}
