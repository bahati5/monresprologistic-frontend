import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Box, Copy, Eye, Lightbulb, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  buildLockerAddressTemplate,
  formatLockerPreviewId,
  LOCKER_TEMPLATE_LINE,
  normalizeLockerDigits,
  parseLockerAddressTemplate,
  previewLockerLine,
  type LockerHubFields,
} from '@/lib/lockerAddressTemplate'
import { SearchableSelectWithAdd, type SearchableOption } from './SearchableSelectWithAdd'
import { NomenclaturePatternPanel } from './NomenclaturePatternPanel'
import { cn } from '@/lib/utils'

type Props = {
  form: Record<string, unknown>
  set: (key: string, value: unknown) => void
}

function PreviewRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  const copy = useCallback(() => {
    if (!value) return
    void navigator.clipboard.writeText(value).then(
      () => toast.success('Copié dans le presse-papiers'),
      () => toast.error('Impossible de copier'),
    )
  }, [value])

  return (
    <div className="group relative flex items-start gap-3 rounded-lg py-2 pl-2 pr-10 transition-colors hover:bg-blue-100/80 dark:hover:bg-blue-950/40">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn('text-sm text-foreground break-words', valueClassName)}>{value || '—'}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        disabled={!value}
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-all',
          'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
          'hover:bg-background/80 hover:text-foreground',
          'focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !value && 'hidden',
        )}
        aria-label={`Copier ${label}`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  )
}

export function LockerSettings({ form, set }: Props) {
  const lockerModeOptions: SearchableOption[] = useMemo(
    () => [
      { value: 'random', label: 'Aléatoire', keywords: ['random', 'aleatoire'] },
      { value: 'sequential', label: 'Séquentiel', keywords: ['sequential', 'sequentiel'] },
    ],
    [],
  )

  const hub = useMemo(
    () => parseLockerAddressTemplate(String(form.locker_address ?? '')),
    [form.locker_address],
  )

  const pushTemplate = useCallback(
    (next: LockerHubFields) => {
      const built = buildLockerAddressTemplate(next)
      set('locker_address', built)
    },
    [set],
  )

  const prefix = String(form.locker_prefix ?? '')
  const digits = normalizeLockerDigits(form.locker_digits)
  const previewId = formatLockerPreviewId(form.locker_prefix, form.locker_digits)
  const line2Display = previewLockerLine(LOCKER_TEMPLATE_LINE, previewId)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Configuration du casier</h3>
            <p className="text-xs text-muted-foreground">Préfixe, chiffres et adresse du hub</p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Nomenclature du code casier</CardTitle>
            </div>
            <CardDescription>Identifiant affiché au client (ex. MRP-0042)</CardDescription>
          </CardHeader>
          <CardContent>
            <NomenclaturePatternPanel
              profile="locker"
              pattern={String(form.locker_code_format ?? '{prefix}-{randnum}')}
              onPatternChange={(v) => set('locker_code_format', v)}
              previewForm={form}
              nextSeqKey="locker_next_seq"
              sectionDescription="Le mode aléatoire / séquentiel et le nombre de chiffres s’appliquent surtout à {randnum}."
            >
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="locker-prefix">Préfixe</Label>
                  <Input
                    id="locker-prefix"
                    value={prefix}
                    onChange={(e) => set('locker_prefix', e.target.value)}
                    placeholder="MRP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locker-digits">Nombre de chiffres ({'{randnum}'})</Label>
                  <Input
                    id="locker-digits"
                    type="number"
                    min={2}
                    max={10}
                    value={digits}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      set(
                        'locker_digits',
                        Number.isFinite(n) ? Math.min(10, Math.max(2, Math.floor(n))) : 4,
                      )
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locker-seq-pad">Padding compteur {'{seq}'}</Label>
                  <Input
                    id="locker-seq-pad"
                    type="number"
                    min={1}
                    max={12}
                    value={String(form.locker_seq_pad ?? '')}
                    placeholder="(défaut = chiffres)"
                    onChange={(e) => set('locker_seq_pad', e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="locker-next-seq">Prochain compteur {'{seq}'}</Label>
                  <Input
                    id="locker-next-seq"
                    type="number"
                    min={1}
                    value={String(form.locker_next_seq ?? '1')}
                    onChange={(e) => set('locker_next_seq', e.target.value)}
                  />
                </div>
              </div>
            </NomenclaturePatternPanel>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Adresse du hub</CardTitle>
            </div>
            <CardDescription>Utilisée dans l’adresse de livraison type marketplaces</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locker-street">Rue</Label>
              <Input
                id="locker-street"
                value={hub.street}
                onChange={(e) => pushTemplate({ ...hub, street: e.target.value })}
                placeholder="Rue de la Logistique 42"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locker-city">Code postal &amp; ville</Label>
              <Input
                id="locker-city"
                value={hub.cityLine}
                onChange={(e) => pushTemplate({ ...hub, cityLine: e.target.value })}
                placeholder="1000 Bruxelles"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locker-country">Pays</Label>
              <Input
                id="locker-country"
                value={hub.country}
                onChange={(e) => pushTemplate({ ...hub, country: e.target.value })}
                placeholder="Belgique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locker-phone">Téléphone du hub</Label>
              <Input
                id="locker-phone"
                value={hub.phone}
                onChange={(e) => pushTemplate({ ...hub, phone: e.target.value })}
                placeholder="+32 2 123 45 67"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mode de génération</CardTitle>
            <CardDescription>Attribution du numéro de casier aux nouveaux comptes</CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="sr-only">Mode de génération</Label>
            <SearchableSelectWithAdd
              value={String(form.locker_mode ?? 'random')}
              onValueChange={(v) => set('locker_mode', v)}
              options={lockerModeOptions}
              placeholder="Mode…"
              searchPlaceholder="Rechercher…"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Eye className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Aperçu en direct</h3>
            <p className="text-xs text-muted-foreground">Vue client (ex. Amazon, etc.)</p>
          </div>
        </div>

        <Card className="border-blue-200/80 bg-blue-50 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/35">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-blue-950 dark:text-blue-50">
              <Box className="h-4 w-4 shrink-0" />
              Adresse de livraison
            </CardTitle>
            <CardDescription className="text-blue-900/70 dark:text-blue-200/70">
              Exemple avec un client fictif
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 border-t border-blue-200/60 pt-4 dark:border-blue-900/50">
            <PreviewRow label="Nom complet" value="Jean Dupont" />
            <PreviewRow label="Adresse ligne 1" value={hub.street} />
            <PreviewRow label="Adresse ligne 2" value={line2Display} valueClassName="font-semibold" />
            <PreviewRow label="Ville / CP" value={hub.cityLine} />
            <PreviewRow label="Pays" value={hub.country} />
            <PreviewRow label="Téléphone" value={hub.phone} />
          </CardContent>
        </Card>

        <p className="flex gap-2 rounded-lg border border-dashed border-blue-200/80 bg-blue-50/50 px-3 py-2 text-xs text-blue-900/80 dark:border-blue-900/50 dark:bg-blue-950/25 dark:text-blue-100/80">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span>C’est ce bloc que le client copiera dans son formulaire de commande.</span>
        </p>
      </div>
    </div>
  )
}
