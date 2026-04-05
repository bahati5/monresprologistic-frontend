import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CountryFlag } from '@/components/CountryFlag'
import {
  type PhoneCountryOption,
  buildInternational,
  parseStoredInternational,
} from '@/lib/phoneInternational'

type RowProps = {
  countries: PhoneCountryOption[]
  value: string
  onChange: (full: string) => void
  disabled?: boolean
  /** Pays (countries.id) associé à l’indicatif courant — pour préremplir l’adresse. */
  onDialCountryChange?: (countryId: number | null) => void
}

function PhoneDialRow({ countries, value, onChange, disabled, onDialCountryChange }: RowProps) {
  const [open, setOpen] = useState(false)
  const [countryId, setCountryId] = useState<number | null>(null)
  const [national, setNational] = useState('')

  const byId = useMemo(() => new Map(countries.map((c) => [c.id, c])), [countries])

  useEffect(() => {
    const { countryId: cid, nationalDigits } = parseStoredInternational(value, countries)
    setCountryId(cid)
    setNational(nationalDigits)
  }, [value, countries])

  useEffect(() => {
    onDialCountryChange?.(countryId)
  }, [countryId, onDialCountryChange])

  const selected = countryId != null ? byId.get(countryId) : undefined
  const displayCode = selected?.phonecode ? `+${String(selected.phonecode).replace(/^\+/, '')}` : ''

  const commit = (cid: number | null, nat: string) => {
    const c = cid != null ? byId.get(cid) : undefined
    onChange(buildInternational(c, nat))
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10 w-[120px] shrink-0 justify-between px-2 font-normal"
            aria-label="Pays et indicatif"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              {selected ? (
                <CountryFlag emoji={selected.emoji} iso2={selected.iso2} code={selected.iso2} className="!h-4 !w-5" />
              ) : null}
              <span className="truncate text-sm">{displayCode || '—'}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Pays, indicatif…" />
            <CommandList>
              <CommandEmpty>Aucun pays.</CommandEmpty>
              <CommandGroup className="max-h-56 overflow-y-auto">
                {countries.map((c) => {
                  const dial = String(c.phonecode || '').replace(/^\+/, '')
                  const label = dial ? `+${dial}` : ''
                  return (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${label} ${c.iso2 ?? ''}`}
                      onSelect={() => {
                        setCountryId(c.id)
                        setOpen(false)
                        commit(c.id, national)
                      }}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', countryId === c.id ? 'opacity-100' : 'opacity-0')}
                      />
                      <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.iso2} className="!h-4 !w-5 mr-2" />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">{label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        className="h-10 flex-1 font-mono text-sm"
        placeholder="Numéro (sans indicatif)"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        value={national}
        onChange={(e) => {
          const v = e.target.value.replace(/[^\d\s]/g, '')
          setNational(v)
          commit(countryId, v)
        }}
      />
    </div>
  )
}

type Props = {
  label: string
  primary: string
  secondary: string
  onPrimaryChange: (v: string) => void
  onSecondaryChange: (v: string) => void
  countries: PhoneCountryOption[]
  isLoadingCountries?: boolean
  disabled?: boolean
  className?: string
  /** Indicatif du numéro principal → pays (id) pour préremplissage cascade adresse. */
  onPrimaryDialCountryChange?: (countryId: number | null) => void
}

/**
 * Un ou deux numéros avec drapeau + indicatif (liste pays API) et bouton pour ajouter un 2e contact.
 */
export function PhoneContactFields({
  label,
  primary,
  secondary,
  onPrimaryChange,
  onSecondaryChange,
  countries,
  isLoadingCountries,
  disabled,
  className,
  onPrimaryDialCountryChange,
}: Props) {
  const [showSecond, setShowSecond] = useState(() => secondary.trim().length > 0)

  useEffect(() => {
    if (secondary.trim().length > 0) setShowSecond(true)
  }, [secondary])

  const busy = disabled || isLoadingCountries

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        {!showSecond ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            disabled={busy}
            onClick={() => setShowSecond(true)}
          >
            Ajouter un numéro
          </Button>
        ) : null}
      </div>
      {isLoadingCountries ? (
        <p className="text-sm text-muted-foreground">Chargement des indicatifs…</p>
      ) : (
        <>
          <PhoneDialRow
            countries={countries}
            value={primary}
            onChange={onPrimaryChange}
            disabled={busy}
            onDialCountryChange={onPrimaryDialCountryChange}
          />
          {showSecond ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Contact secondaire</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  disabled={busy}
                  onClick={() => {
                    onSecondaryChange('')
                    setShowSecond(false)
                  }}
                >
                  Retirer
                </Button>
              </div>
              <PhoneDialRow countries={countries} value={secondary} onChange={onSecondaryChange} disabled={busy} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
