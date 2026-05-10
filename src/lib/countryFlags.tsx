/* eslint-disable react-refresh/only-export-components */
import { useState, type CSSProperties } from 'react'

const BASE = 0x1f1e6

/**
 * Drapeau Unicode (emoji). Sur Windows, s’affiche souvent comme deux lettres (ex. GA) — préférer {@link FlagImg}.
 */
export function flagEmojiFromIso2(iso2: string | null | undefined): string {
  if (!iso2 || iso2.length !== 2) return ''
  const u = iso2.toUpperCase()
  const a = u.charCodeAt(0)
  const b = u.charCodeAt(1)
  if (a < 65 || a > 90 || b < 65 || b > 90) return ''
  return String.fromCodePoint(a - 65 + BASE, b - 65 + BASE)
}

/** PNG net sur tous les OS (Windows inclus). flagcdn.com — codes ISO2 minuscules. */
export function flagImageUrl(iso2: string, pixelWidth: 20 | 40 | 80 = 40): string | null {
  if (!iso2 || iso2.length !== 2) return null
  const code = iso2.toLowerCase()
  if (!/^[a-z]{2}$/.test(code)) return null
  return `https://flagcdn.com/w${pixelWidth}/${code}.png`
}

type FlagImgProps = {
  iso2: string | null | undefined
  /** Libellé pour l’accessibilité */
  label?: string | null
  /** Largeur d’affichage CSS (hauteur proportionnelle ~3:2) */
  displayWidth?: number
  className?: string
}

export function FlagImg({ iso2, label, displayWidth = 22, className = '' }: FlagImgProps) {
  const [broken, setBroken] = useState(false)
  if (!iso2 || iso2.length !== 2) return null
  const upper = iso2.toUpperCase()
  if (!/^[A-Z]{2}$/.test(upper)) return null

  const src = flagImageUrl(upper, 40)
  if (!src) return null

  const h = Math.round((displayWidth * 2) / 3)

  if (broken) {
    return (
      <span
        className={`inline-flex min-w-[1.5rem] shrink-0 items-center justify-center rounded border border-border/60 bg-muted px-1 text-[10px] font-mono text-muted-foreground ${className}`.trim()}
        title={label || upper}
      >
        {upper}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={label ? `Drapeau : ${label}` : `Drapeau ${upper}`}
      width={displayWidth}
      height={h}
      className={`inline-block shrink-0 rounded-sm border border-border/60 object-cover align-middle shadow-sm ${className}`.trim()}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  )
}

type CorridorFlagsProps = {
  originIso2?: string | null
  destIso2?: string | null
  originLabel?: string | null
  destLabel?: string | null
  className?: string
  /** @deprecated Les drapeaux sont des images ; utilisé comme classes sur les <img> */
  emojiClassName?: string
  style?: CSSProperties
  displayWidth?: number
}

/** Départ → arrivée avec drapeaux (images, compatibles Windows). */
export function CorridorFlags({
  originIso2,
  destIso2,
  originLabel,
  destLabel,
  className,
  emojiClassName,
  style,
  displayWidth = 22,
}: CorridorFlagsProps) {
  const title = [originLabel || originIso2, destLabel || destIso2].filter(Boolean).join(' → ')
  const hasO = !!(originIso2 && originIso2.length === 2)
  const hasD = !!(destIso2 && destIso2.length === 2)
  if (!hasO && !hasD) return null

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 ${className ?? ''}`.trim()}
      style={style}
      title={title || undefined}
    >
      {hasO ? (
        <FlagImg iso2={originIso2} label={originLabel} displayWidth={displayWidth} className={emojiClassName} />
      ) : null}
      {hasO && hasD ? (
        <span className="text-muted-foreground text-xs" aria-hidden>
          →
        </span>
      ) : null}
      {hasD ? (
        <FlagImg iso2={destIso2} label={destLabel} displayWidth={displayWidth} className={emojiClassName} />
      ) : null}
    </span>
  )
}

type LotRouteFlagsProps = {
  originIso2s?: string[]
  destIso2s?: string[]
  label?: string | null
  className?: string
  displayWidth?: number
}

/** Résumé d’un lot : plusieurs pays d’origine / destination. */
export function LotRouteFlags({
  originIso2s = [],
  destIso2s = [],
  label,
  className,
  displayWidth = 22,
}: LotRouteFlagsProps) {
  const oCodes = [...new Set(originIso2s.map((c) => c?.toUpperCase()).filter((c): c is string => !!c && c.length === 2))]
  const dCodes = [...new Set(destIso2s.map((c) => c?.toUpperCase()).filter((c): c is string => !!c && c.length === 2))]
  if (oCodes.length === 0 && dCodes.length === 0) return null

  return (
    <span
      className={`inline-flex shrink-0 flex-wrap items-center gap-1.5 ${className ?? ''}`.trim()}
      title={label || undefined}
    >
      {oCodes.length > 0 ? (
        <span className="inline-flex items-center gap-1" aria-hidden>
          {oCodes.map((code) => (
            <FlagImg key={`o-${code}`} iso2={code} displayWidth={displayWidth} />
          ))}
        </span>
      ) : null}
      {oCodes.length > 0 && dCodes.length > 0 ? (
        <span className="text-muted-foreground text-xs" aria-hidden>
          →
        </span>
      ) : null}
      {dCodes.length > 0 ? (
        <span className="inline-flex items-center gap-1" aria-hidden>
          {dCodes.map((code) => (
            <FlagImg key={`d-${code}`} iso2={code} displayWidth={displayWidth} />
          ))}
        </span>
      ) : null}
    </span>
  )
}
