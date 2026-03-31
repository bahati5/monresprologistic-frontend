import { useEffect, useState, type ComponentType, type SVGAttributes } from 'react'
import { Globe } from 'lucide-react'
import * as FlagIcons from 'country-flag-icons/react/3x2'
import { cn } from '@/lib/utils'
import { pickIso2ForFlag } from '@/lib/flagEmoji'

type Props = {
  emoji?: string | null
  iso2?: string | null
  code?: string | null
  className?: string
}

type SvgFlagProps = SVGAttributes<SVGSVGElement>

function getBundledSvgFlag(iso: string): ComponentType<SvgFlagProps> | null {
  const C = (FlagIcons as Record<string, ComponentType<SvgFlagProps> | undefined>)[iso]
  return C && typeof C === 'function' ? C : null
}

/**
 * Drapeau : image flagcdn en priorité (léger), puis SVG embarqué (country-flag-icons),
 * puis emoji base, puis globe.
 */
export function CountryFlag({ emoji, iso2, code, className }: Props) {
  const iso = pickIso2ForFlag(iso2, code)
  const [cdnFailed, setCdnFailed] = useState(false)

  useEffect(() => {
    setCdnFailed(false)
  }, [iso])

  const stored = emoji?.trim()
  const SvgFlag = iso ? getBundledSvgFlag(iso) : null

  const frame = cn(
    'h-5 w-7 shrink-0 rounded-sm border border-black/10 object-cover dark:border-white/15',
    className
  )

  if (iso && !cdnFailed) {
    return (
      <img
        src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
        alt=""
        width={28}
        height={21}
        className={frame}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setCdnFailed(true)}
      />
    )
  }

  if (iso && cdnFailed && SvgFlag) {
    return <SvgFlag className={cn(frame, 'object-contain')} aria-hidden />
  }

  if (stored) {
    return (
      <span
        className={cn('flex h-5 w-7 shrink-0 items-center justify-center text-lg leading-none', className)}
        aria-hidden
      >
        {stored}
      </span>
    )
  }

  return <Globe className={cn('h-4 w-4 shrink-0 text-muted-foreground', className)} aria-hidden />
}
