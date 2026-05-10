import { CountryFlag } from '@/components/CountryFlag'
import { displayLocalized } from '@/lib/localizedString'
import { cn } from '@/lib/utils'

export type CountryLike =
  | {
      id?: number
      name?: string | Record<string, string> | null
      code?: string | null
      iso2?: string | null
      emoji?: string | null
    }
  | null
  | undefined

/**
 * N’affiche pas le champ `emoji` seul s’il ressemble à un code ISO (ex. « cd » mal stocké en base).
 * Dans ce cas, on s’appuie sur {@link CountryFlag} (iso2 / code / images).
 */
function emojiForFlag(emoji: string | null | undefined): string | undefined {
  const t = emoji?.trim()
  if (!t) return undefined
  if (/^[a-zA-Z]{2}$/.test(t)) return undefined
  return t
}

function countryDisplayName(name: unknown, localize: boolean): string {
  if (name == null) return ''
  if (typeof name === 'object' && name !== null && !Array.isArray(name)) {
    return localize ? displayLocalized(name as Record<string, string>) : ''
  }
  return String(name)
}

type CountryNameWithFlagProps = {
  country: CountryLike
  className?: string
  flagClassName?: string
  /** Pour les noms localisés (objet JSON) du backend */
  localize?: boolean
  /** Taille du drapeau */
  flagSize?: 'sm' | 'md'
}

const flagSizeClass = {
  sm: '!h-3.5 !w-[1.15rem]',
  md: '!h-5 !w-7',
} as const

/**
 * Drapeau (PNG / SVG / emoji) + libellé pays, partout où un pays est affiché.
 */
export function CountryNameWithFlag({
  country,
  className,
  flagClassName,
  localize = true,
  flagSize = 'md',
}: CountryNameWithFlagProps) {
  if (!country) return null

  const label = countryDisplayName(country.name, localize)
  const emoji = emojiForFlag(country.emoji)

  return (
    <span className={cn('inline-flex items-center gap-2 min-w-0', className)} title={label || undefined}>
      <CountryFlag
        emoji={emoji}
        iso2={country.iso2}
        code={country.code}
        className={cn(flagSizeClass[flagSize], flagClassName)}
      />
      {label ? <span className="min-w-0 leading-snug">{label}</span> : null}
    </span>
  )
}
