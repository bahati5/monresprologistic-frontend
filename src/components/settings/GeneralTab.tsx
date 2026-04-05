import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  useAppSettings,
  useUpdateAppSettings,
  useUploadLogo,
  useUploadFavicon,
  useTimezonesList,
  usePhoneCountries,
} from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { SearchableSelectWithAdd, type SearchableOption } from './SearchableSelectWithAdd'
import { LocationCascadeWithEnrichment } from '@/components/location/LocationCascadeWithEnrichment'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import { ISO_4217_CURRENCIES } from '@/lib/iso4217'
import { PhoneContactFields } from '@/components/PhoneContactFields'
import { resolveImageUrl } from '@/lib/resolveImageUrl'
import { Settings, UserCheck, Globe, DollarSign, Image } from 'lucide-react'

const CLEAR = '__clear'

export default function GeneralTab() {
  const { data: settings, isLoading } = useAppSettings()
  const updateSettings = useUpdateAppSettings()
  const uploadLogo = useUploadLogo()
  const uploadFavicon = useUploadFavicon()
  const { data: timezones, isLoading: loadingTz } = useTimezonesList()
  const { data: phoneCountries = [], isLoading: loadingPhoneCountries } = usePhoneCountries()

  const [form, setForm] = useState<Record<string, unknown>>({})

  const [currencyDlg, setCurrencyDlg] = useState(false)
  const [curCode, setCurCode] = useState('')
  const [curSymbol, setCurSymbol] = useState('')
  const [curName, setCurName] = useState('')

  const [timezoneDlg, setTimezoneDlg] = useState(false)
  const [tzManual, setTzManual] = useState('')
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false)
  const [faviconPreviewFailed, setFaviconPreviewFailed] = useState(false)

  useEffect(() => {
    if (settings) setForm({ ...settings, language: 'fr' })
  }, [settings])

  useEffect(() => {
    setLogoPreviewFailed(false)
    setFaviconPreviewFailed(false)
  }, [form.logo_url, form.favicon_url])

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    const y = window.scrollY
    updateSettings.mutate(
      { ...(form as Record<string, any>), language: 'fr' },
      {
        onSettled: () => requestAnimationFrame(() => window.scrollTo(0, y)),
      }
    )
  }

  const currencyOptions: SearchableOption[] = useMemo(() => {
    const custom = (form.custom_currencies as { code: string; symbol: string; name: string }[]) ?? []
    const seen = new Set<string>()
    const opts: SearchableOption[] = []
    for (const x of [...ISO_4217_CURRENCIES, ...custom]) {
      const code = x.code.toUpperCase()
      if (seen.has(code)) continue
      seen.add(code)
      const name = 'name' in x ? x.name : (x as { name: string }).name
      const symbol = 'symbol' in x ? x.symbol : (x as { symbol: string }).symbol
      opts.push({
        value: code,
        label: (
          <span>
            <span className="font-medium">{code}</span>
            <span className="text-muted-foreground"> — {name}</span>
            {symbol ? <span className="ml-1 text-xs text-muted-foreground">({symbol})</span> : null}
          </span>
        ),
        keywords: [code, name, symbol || ''],
      })
    }
    return opts
  }, [form.custom_currencies])

  const timezoneOptions: SearchableOption[] = useMemo(() => {
    const list = [...(timezones ?? [])]
    const tz = String(form.timezone ?? '')
    if (tz && !list.includes(tz)) list.unshift(tz)
    return list.map((t) => ({
      value: t,
      label: t,
      keywords: [t],
    }))
  }, [timezones, form.timezone])

  const decimalsOptions: SearchableOption[] = useMemo(
    () => [
      { value: '0', label: '0 (100)', keywords: ['0'] },
      { value: '2', label: '2 (100.00)', keywords: ['2', 'decimales'] },
    ],
    []
  )

  const symbolPositionOptions: SearchableOption[] = useMemo(
    () => [
      { value: 'before', label: 'Avant ($ 100)', keywords: ['avant', 'before'] },
      { value: 'after', label: 'Après (100 $)', keywords: ['apres', 'after'] },
    ],
    []
  )

  const submitCurrency = () => {
    const code = curCode.trim().toUpperCase()
    if (!code || !curSymbol.trim()) return
    const name = curName.trim() || code
    const row = { code, symbol: curSymbol.trim(), name }
    const prev = (form.custom_currencies as typeof row[]) ?? []
    const next = [...prev.filter((x) => x.code.toUpperCase() !== code), row]
    setForm((f) => ({
      ...f,
      custom_currencies: next,
      currency: code,
      currency_symbol: row.symbol,
    }))
    setCurrencyDlg(false)
    setCurCode('')
    setCurSymbol('')
    setCurName('')
  }

  const submitTimezoneManual = () => {
    const t = tzManual.trim()
    if (!t) return
    set('timezone', t)
    setTimezoneDlg(false)
    setTzManual('')
  }

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Parametres generaux</h2>
        <p className="text-sm text-muted-foreground">Identite, devise, langue et configuration de base</p>
      </motion.div>

      <Tabs defaultValue="identity" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="identity" className={settingsInnerTabsTrigger}>
            Identite
          </TabsTrigger>
          <TabsTrigger value="accounts" className={settingsInnerTabsTrigger}>
            Inscriptions
          </TabsTrigger>
          <TabsTrigger value="locale" className={settingsInnerTabsTrigger}>
            Region
          </TabsTrigger>
          <TabsTrigger value="currency" className={settingsInnerTabsTrigger}>
            Devise
          </TabsTrigger>
          <TabsTrigger value="branding" className={settingsInnerTabsTrigger}>
            Logo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className={settingsInnerTabsContent}>
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
        </TabsContent>

        <TabsContent value="accounts" className={settingsInnerTabsContent}>
          <SettingsCard title="Comptes et inscriptions" icon={UserCheck} description="Verification et notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Verification automatique</p>
                  <p className="text-xs text-muted-foreground">Les nouveaux comptes sont immediatement actifs</p>
                </div>
                <Switch checked={!!form.auto_verify} onCheckedChange={(v) => set('auto_verify', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Inscription autorisee</p>
                  <p className="text-xs text-muted-foreground">La page d'inscription est accessible au public</p>
                </div>
                <Switch checked={!!form.allow_registration} onCheckedChange={(v) => set('allow_registration', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Notification admin</p>
                  <p className="text-xs text-muted-foreground">L'admin recoit un email a chaque inscription</p>
                </div>
                <Switch checked={!!form.admin_notification} onCheckedChange={(v) => set('admin_notification', v)} />
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="locale" className={settingsInnerTabsContent}>
          <SettingsCard title="Localisation" icon={Globe} description="Langue et fuseau horaire">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Langue</Label>
                <p className="text-sm text-muted-foreground">
                  Application en français uniquement (paramètre enregistré sur <code className="text-xs">fr</code>).
                </p>
                <Input value="Français (fr)" disabled className="bg-muted max-w-md" readOnly />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Fuseau horaire (IANA)</Label>
                <SearchableSelectWithAdd
                  value={String(form.timezone ?? '')}
                  onValueChange={(v) => set('timezone', v)}
                  options={timezoneOptions}
                  placeholder="Choisir un fuseau…"
                  searchPlaceholder="Rechercher (ex. Paris, New_York)…"
                  emptyText="Aucun fuseau. Utilisez + pour une saisie manuelle."
                  isLoading={loadingTz}
                  onAdd={() => {
                    setTzManual(String(form.timezone ?? ''))
                    setTimezoneDlg(true)
                  }}
                  addLabel="Saisie manuelle du fuseau"
                />
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="currency" className={settingsInnerTabsContent}>
          <SettingsCard title="Devise et format" icon={DollarSign} description="Monnaie et format des nombres">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Devise</Label>
                <SearchableSelectWithAdd
                  value={String(form.currency ?? '').toUpperCase()}
                  onValueChange={(v) => {
                    set('currency', v)
                    const iso = ISO_4217_CURRENCIES.find((c) => c.code === v)
                    const custom = ((form.custom_currencies as { code: string; symbol: string }[]) ?? []).find(
                      (c) => c.code.toUpperCase() === v
                    )
                    if (iso) set('currency_symbol', iso.symbol)
                    else if (custom) set('currency_symbol', custom.symbol)
                  }}
                  options={currencyOptions}
                  placeholder="Choisir une devise…"
                  searchPlaceholder="Code ou nom…"
                  emptyText="Aucune devise. Ajoutez-en une avec +."
                  onAdd={() => setCurrencyDlg(true)}
                  addLabel="Ajouter une devise"
                />
              </div>
              <div className="space-y-2">
                <Label>Symbole</Label>
                <Input
                  value={String(form.currency_symbol ?? '')}
                  onChange={(e) => set('currency_symbol', e.target.value)}
                  placeholder="$"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Position du symbole</Label>
                <SearchableSelectWithAdd
                  value={String(form.currency_position ?? 'before')}
                  onValueChange={(v) => set('currency_position', v)}
                  options={symbolPositionOptions}
                  placeholder="Position…"
                  searchPlaceholder="Rechercher…"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Decimales</Label>
                <SearchableSelectWithAdd
                  value={String(form.decimals ?? 2)}
                  onValueChange={(v) => set('decimals', Number(v))}
                  options={decimalsOptions}
                  placeholder="Decimales…"
                  searchPlaceholder="Rechercher…"
                />
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="branding" className={settingsInnerTabsContent}>
          <SettingsCard title="Logo et favicon" icon={Image} description="Identite visuelle">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2 flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sidebar-brand-logo">Afficher le nom à côté du logo</Label>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Lorsqu&apos;un logo est affiché dans la barre latérale, afficher ou masquer le texte à
                    côté. Sans logo, le nom reste toujours visible.
                  </p>
                </div>
                <Switch
                  id="sidebar-brand-logo"
                  checked={form.show_sidebar_brand_with_logo !== false}
                  onCheckedChange={(v) => set('show_sidebar_brand_with_logo', v)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="hub-brand-name">Nom dans la barre latérale</Label>
                <Input
                  id="hub-brand-name"
                  value={String(form.hub_brand_name ?? '')}
                  onChange={(e) => set('hub_brand_name', e.target.value)}
                  placeholder={String(form.app_name || 'Monrespro')}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">
                  Texte affiché en haut de la sidebar (à côté du logo si activé). Laisser vide pour réutiliser
                  le « Nom de l&apos;application » défini dans l&apos;onglet Identité.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                {form.logo_url != null && String(form.logo_url) !== '' && !logoPreviewFailed ? (
                  <img
                    src={resolveImageUrl(String(form.logo_url))}
                    alt=""
                    className="h-12 mb-2 rounded border border-border/60 bg-background object-contain object-left"
                    onError={() => setLogoPreviewFailed(true)}
                  />
                ) : null}
                {form.logo_url != null && String(form.logo_url) !== '' && logoPreviewFailed ? (
                  <p className="text-xs text-destructive mb-2">
                    Impossible de charger l&apos;aperçu (vérifiez le lien symbolique{' '}
                    <code className="rounded bg-muted px-1">storage</code> et{' '}
                    <code className="rounded bg-muted px-1">APP_URL</code> / proxy Vite).
                  </p>
                ) : null}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadLogo.mutate(f)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Favicon</Label>
                {form.favicon_url != null && String(form.favicon_url) !== '' && !faviconPreviewFailed ? (
                  <img
                    src={resolveImageUrl(String(form.favicon_url))}
                    alt=""
                    className="h-8 w-8 mb-2 rounded border border-border/60 bg-background object-contain"
                    onError={() => setFaviconPreviewFailed(true)}
                  />
                ) : null}
                {form.favicon_url != null && String(form.favicon_url) !== '' && faviconPreviewFailed ? (
                  <p className="text-xs text-destructive mb-2">Impossible de charger le favicon.</p>
                ) : null}
                <Input
                  type="file"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadFavicon.mutate(f)
                  }}
                />
              </div>
            </div>
          </SettingsCard>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les parametres'}
        </Button>
      </div>

      <Dialog open={currencyDlg} onOpenChange={setCurrencyDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle devise</DialogTitle>
            <DialogDescription>Code ISO 4217 (3 lettres) et symbole d&apos;affichage.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={curCode} onChange={(e) => setCurCode(e.target.value.toUpperCase())} placeholder="XOF" maxLength={8} />
            </div>
            <div className="space-y-2">
              <Label>Symbole</Label>
              <Input value={curSymbol} onChange={(e) => setCurSymbol(e.target.value)} placeholder="CFA" />
            </div>
            <div className="space-y-2">
              <Label>Nom (optionnel)</Label>
              <Input value={curName} onChange={(e) => setCurName(e.target.value)} placeholder="Franc CFA" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCurrencyDlg(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submitCurrency}>
              Ajouter et selectionner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={timezoneDlg} onOpenChange={setTimezoneDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fuseau horaire manuel</DialogTitle>
            <DialogDescription>
              Saisissez un identifiant IANA valide (ex. <code className="text-xs">Europe/Brussels</code>).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Fuseau</Label>
            <Input value={tzManual} onChange={(e) => setTzManual(e.target.value)} placeholder="Europe/Paris" className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setTimezoneDlg(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submitTimezoneManual}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
