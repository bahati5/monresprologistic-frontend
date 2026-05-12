import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CountryFlag } from '@/components/CountryFlag'
import { useLocationCountries, useLocationCities, useLocationStates } from '@/hooks/useLocationCascade'

type Props = {
  countryId: number | null
  stateId: number | null
  cityId: number | null
  onCountryChange: (id: number | null) => void
  onStateChange: (id: number | null) => void
  onCityChange: (id: number | null) => void
  disabled?: boolean
}

export function ProfileLocationFields({
  countryId,
  stateId,
  cityId,
  onCountryChange,
  onStateChange,
  onCityChange,
  disabled,
}: Props) {
  const { data: countries = [] } = useLocationCountries()
  const { data: states = [] } = useLocationStates(countryId ?? undefined)
  const { data: cities = [] } = useLocationCities(stateId ?? undefined)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pays</Label>
        <Select
          value={countryId != null ? String(countryId) : ''}
          onValueChange={(v) => {
            onCountryChange(v ? Number(v) : null)
            onStateChange(null)
            onCityChange(null)
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un pays" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {countries.map((c) => {
              const emoji = c.emoji?.trim()
              const showEmoji = emoji && !/^[a-zA-Z]{2}$/.test(emoji)
              return (
                <SelectItem key={c.id} value={String(c.id)}>
                  <span className="flex items-center gap-2">
                    {showEmoji ? (
                      <span className="text-base leading-none" aria-hidden>
                        {emoji}{' '}
                      </span>
                    ) : (
                      <CountryFlag emoji={undefined} iso2={c.iso2} code={c.code} className="!h-3.5 !w-[1.15rem] shrink-0" />
                    )}
                    <span>{c.name}</span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {countryId != null && states.length > 0 && (
        <div className="space-y-2">
          <Label>Région / État</Label>
          <Select
            value={stateId != null ? String(stateId) : ''}
            onValueChange={(v) => {
              onStateChange(v ? Number(v) : null)
              onCityChange(null)
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une région" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {states.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {stateId != null && cities.length > 0 && (
        <div className="space-y-2">
          <Label>Ville</Label>
          <Select
            value={cityId != null ? String(cityId) : ''}
            onValueChange={(v) => onCityChange(v ? Number(v) : null)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une ville" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {cities.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
