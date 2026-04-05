import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Sparkles, ChevronRight, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  type NomenclatureProfile,
  tokensAllowedForProfile,
  buildPreviewSeriesForProfile,
  collectUsedTokens,
  NOMENCLATURE_DATE_TOKENS,
  NOMENCLATURE_LOCALE_TOKENS,
} from '@/lib/nomenclaturePreview'

type ConfigurableKeys = {
  keys: { prefixKey: string; padKey: string; nextSeqKey: string }
  defaults: { prefix: string; pad: number }
}

export type NomenclaturePatternPanelProps = {
  profile: NomenclatureProfile
  /** Valeur courante du champ format (ex. shipment_tracking_format) */
  pattern: string
  onPatternChange: (value: string) => void
  /** Données formulaire pour l’aperçu (doit inclure country, country_iso2, hub_brand_name si besoin) */
  previewForm: Record<string, unknown>
  /** Clé du prochain compteur affiché dans l’en-tête (optionnel) */
  nextSeqKey?: string
  /** Texte d’aide sous le titre « Vue d’ensemble » */
  sectionDescription?: string
  configurable?: ConfigurableKeys
  /** Champs annexes (préfixe, padding, etc.) sous l’éditeur */
  children?: ReactNode
}

export function NomenclaturePatternPanel({
  profile,
  pattern,
  onPatternChange,
  previewForm,
  nextSeqKey,
  sectionDescription,
  configurable,
  children,
}: NomenclaturePatternPanelProps) {
  const [lastTestAt, setLastTestAt] = useState<Date | null>(null)

  const allowed = useMemo(() => tokensAllowedForProfile(profile), [profile])

  const previewAt = useMemo(() => lastTestAt ?? new Date(), [lastTestAt])

  const series = useMemo(
    () =>
      buildPreviewSeriesForProfile(
        profile,
        previewForm,
        pattern,
        profile === 'configurable_seq' ? configurable : undefined,
        6,
        previewAt,
      ),
    [profile, previewForm, pattern, configurable, previewAt],
  )

  const usedTokens = useMemo(() => collectUsedTokens(pattern, allowed), [pattern, allowed])

  const counterDisplay = nextSeqKey ? String(previewForm[nextSeqKey] ?? '—') : null

  const runTest = useCallback(() => {
    setLastTestAt(new Date())
  }, [])

  const insertToken = useCallback(
    (token: string) => {
      onPatternChange(pattern + token)
    },
    [onPatternChange, pattern],
  )

  const nextPrimary = series[0] ?? '—'
  const following = series.slice(1)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Vue d&apos;ensemble</h3>
            {sectionDescription ? (
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{sectionDescription}</p>
            ) : null}
          </div>
          {counterDisplay !== null && (
            <Badge variant="outline" className="text-sm font-normal shrink-0">
              Compteur actuel : {counterDisplay}
            </Badge>
          )}
        </div>

        <div className="rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Label className="text-sm font-medium text-muted-foreground">Pattern actuel</Label>
            {series[0] && (
              <Badge variant="secondary" className="font-mono text-xs">
                Exemple : {series[0]}
              </Badge>
            )}
          </div>
          <div className="font-mono text-xl font-bold tracking-wide text-primary sm:text-2xl break-all">
            {pattern.trim() || '—'}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Jetons : dates ({'{year}'}, {'{month}'}…), localisation ({'{country_code}'}…), compteur ({'{seq}'}) selon le
            type. Les aperçus sont indicatifs (valeurs fictives pour l&apos;aléatoire).
          </p>
        </div>

        {series.length > 0 && (
          <div className="rounded-xl border-2 border-blue-200/80 bg-blue-50/80 p-6 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden />
                <Label className="text-sm font-semibold text-blue-950 dark:text-blue-100">
                  Prochain numéro (aperçu)
                </Label>
              </div>
              <RefreshCw className="h-4 w-4 text-blue-600 opacity-70 dark:text-blue-400" aria-hidden />
            </div>
            <div className="mb-3 font-mono text-2xl font-bold text-blue-800 break-all dark:text-blue-200 sm:text-3xl">
              {nextPrimary}
            </div>
            {following.length > 0 && (
              <div className="mt-4 border-t border-blue-200/80 pt-4 dark:border-blue-800/60">
                <div className="mb-2 flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                  <ChevronRight className="h-3 w-3" aria-hidden />
                  Numéros suivants
                </div>
                <div className="flex flex-wrap gap-2">
                  {following.map((num, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-blue-300 bg-white px-3 py-1 font-mono text-xs text-blue-800 dark:border-blue-700 dark:bg-background dark:text-blue-200"
                    >
                      {num}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Éditeur de pattern</h3>

        <div className="space-y-2">
          <Label htmlFor="nomenclature-pattern-input" className="text-sm font-medium">
            Pattern de numérotation
          </Label>
          <Input
            id="nomenclature-pattern-input"
            value={pattern}
            onChange={(e) => onPatternChange(e.target.value)}
            className="h-11 font-mono text-base"
            placeholder="{prefix}-{year}-{seq}"
            spellCheck={false}
          />
          {usedTokens.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground">Jetons détectés :</span>
              {usedTokens.map((t) => (
                <Badge key={t} variant="secondary" className="font-mono text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">Jetons disponibles</p>
          <TokenGroup label="Dates & calendrier" tokens={NOMENCLATURE_DATE_TOKENS} onInsert={insertToken} />
          <TokenGroup label="Localisation & marque" tokens={NOMENCLATURE_LOCALE_TOKENS} onInsert={insertToken} />
          <TokenGroup
            label="Compteur & spécifiques"
            tokens={allowed.filter(
              (t) =>
                !NOMENCLATURE_DATE_TOKENS.some((d) => d.token === t.token) &&
                !NOMENCLATURE_LOCALE_TOKENS.some((l) => l.token === t.token),
            )}
            onInsert={insertToken}
          />
        </div>

        {children}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground">Test et validation</h3>
          <Button type="button" variant="secondary" size="sm" onClick={runTest}>
            Tester le pattern
          </Button>
        </div>
        <div className="rounded-lg border border-blue-200/80 bg-blue-50/50 px-4 py-3 text-sm text-blue-900/90 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-100/90">
          Cliquez sur « Tester le pattern » pour rafraîchir l&apos;aperçu avec la date du jour et des exemples de
          remplacements.
        </div>
      </div>
    </div>
  )
}

function TokenGroup({
  label,
  tokens,
  onInsert,
}: {
  label: string
  tokens: { token: string; label: string }[]
  onInsert: (t: string) => void
}) {
  if (tokens.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tokens.map((t) => (
          <Button
            key={t.token}
            type="button"
            variant="outline"
            size="sm"
            className="h-8 font-mono text-xs"
            onClick={() => onInsert(t.token)}
          >
            {t.label}
            <span className="ml-1.5 text-muted-foreground">({t.token})</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
