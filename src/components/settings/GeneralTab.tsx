import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  useAppSettings,
  useUpdateAppSettings,
  useUploadLogo,
  useUploadFavicon,
  useCountriesList,
  useTimezonesList,
  useCreateCountry,
  type ApiCountryRow,
} from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { SearchableSelectWithAdd, type SearchableOption } from './SearchableSelectWithAdd'
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
import { CountryFlag } from '@/components/CountryFlag'
import { resolveImageUrl } from '@/lib/resolveImageUrl'
import { Settings, MapPin, UserCheck, Globe, DollarSign, Image } from 'lucide-react'

const CLEAR = '__clear'

export default function GeneralTab() {
  const { data: settings, isLoading } = useAppSettings()
  const updateSettings = useUpdateAppSettings()
  const uploadLogo = useUploadLogo()
  const uploadFavicon = useUploadFavicon()
  const { data: countries, isLoading: loadingCountries } = useCountriesList()
  const { data: timezones, isLoading: loadingTz } = useTimezonesList()
  const createCountry = useCreateCountry()

  const [form, setForm] = useState<Record<string, unknown>>({})

  const [countryDlg, setCountryDlg] = useState(false)
  const [cName, setCName] = useState('')
  const [cCode, setCCode] = useState('')
  const [cEmoji, setCEmoji] = useState('')

  const [currencyDlg, setCurrencyDlg] = useState(false)
  const [curCode, setCurCode] = useState('')
  const [curSymbol, setCurSymbol] = useState('')
  const [curName, setCurName] = useState('')

  const [timezoneDlg, setTimezoneDlg] = useState(false)
  const [tzManual, setTzManual] = useState('')

  useEffect(() => {
    if (settings) setForm({ ...settings, language: 'fr' })
  }, [settings])

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

  const countryOptions: SearchableOption[] = useMemo(() => {
    const rows = countries ?? []
    const opts: SearchableOption[] = [
      {
        value: CLEAR,
        label: <span className="text-muted-foreground">(Aucun pays)</span>,
        keywords: ['aucun', 'clear'],
      },
      ...rows.map((c: ApiCountryRow) => ({
        value: String(c.id),
        label: (
          <span className="flex items-center gap-2">
            <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} />
            <span>{c.name}</span>
            <span className="text-xs text-muted-foreground">
              {(c.iso2 || c.code || '').toString().toUpperCase()}
            </span>
          </span>
        ),
        keywords: [c.name, c.code || '', c.iso2 || '', String(c.id)],
      })),
    ]
    return opts
  }, [countries])

  const countrySelectValue =
    form.country_id === '' || form.country_id == null ? CLEAR : String(form.country_id)

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

  const lockerModeOptions: SearchableOption[] = useMemo(
    () => [
      { value: 'random', label: 'Aléatoire', keywords: ['random', 'aleatoire'] },
      { value: 'sequential', label: 'Séquentiel', keywords: ['sequential', 'sequentiel'] },
    ],
    []
  )

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

  const submitCountry = () => {
    const code = cCode.trim().toUpperCase()
    if (!cName.trim() || !code) return
    createCountry.mutate(
      { name: cName.trim(), code, iso2: code.length === 2 ? code : undefined, emoji: cEmoji.trim() || undefined },
      {
        onSuccess: () => {
          setCountryDlg(false)
          setCName('')
          setCCode('')
          setCEmoji('')
        },
      }
    )
  }

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
          <TabsTrigger value="locker" className={settingsInnerTabsTrigger}>
            Casier
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
                <Label>Nom de l'application</Label>
                <Input value={String(form.app_name ?? '')} onChange={(e) => set('app_name', e.target.value)} />
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
              <div className="space-y-2">
                <Label>Telephone fixe</Label>
                <Input value={String(form.phone ?? '')} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telephone mobile</Label>
                <Input value={String(form.mobile ?? '')} onChange={(e) => set('mobile', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Adresse postale</Label>
                <Input value={String(form.address ?? '')} onChange={(e) => set('address', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Pays (base de donnees)</Label>
                <SearchableSelectWithAdd
                  value={countrySelectValue}
                  onValueChange={(v) => {
                    if (v === CLEAR) {
                      set('country_id', '')
                      set('country', '')
                      return
                    }
                    const row = (countries ?? []).find((c) => String(c.id) === v)
                    if (row) {
                      set('country_id', row.id)
                      set('country', row.name)
                    }
                  }}
                  options={countryOptions}
                  placeholder="Choisir un pays…"
                  searchPlaceholder="Rechercher un pays, code…"
                  emptyText="Aucun pays."
                  isLoading={loadingCountries}
                  onAdd={() => setCountryDlg(true)}
                  addLabel="Ajouter un pays"
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={String(form.city ?? '')} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input value={String(form.postal_code ?? '')} onChange={(e) => set('postal_code', e.target.value)} />
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="locker" className={settingsInnerTabsContent}>
          <SettingsCard title="Casier virtuel (Locker)" icon={MapPin} description="Adresse et format du casier client">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Adresse du locker (entrepot)</Label>
                <Input
                  value={String(form.locker_address ?? '')}
                  onChange={(e) => set('locker_address', e.target.value)}
                  placeholder="Rue de la Logistique 42, 1000 Bruxelles"
                />
              </div>
              <div className="space-y-2">
                <Label>Prefixe du locker</Label>
                <Input
                  value={String(form.locker_prefix ?? '')}
                  onChange={(e) => set('locker_prefix', e.target.value)}
                  placeholder="MRP"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre de chiffres</Label>
                <Input
                  type="number"
                  min={3}
                  max={8}
                  value={Number(form.locker_digits ?? 4)}
                  onChange={(e) => set('locker_digits', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Mode de generation</Label>
                <SearchableSelectWithAdd
                  value={String(form.locker_mode ?? 'random')}
                  onValueChange={(v) => set('locker_mode', v)}
                  options={lockerModeOptions}
                  placeholder="Mode…"
                  searchPlaceholder="Rechercher…"
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
              <div className="space-y-2">
                <Label>Logo</Label>
                {form.logo_url && <img src={resolveImageUrl(String(form.logo_url))} alt="Logo" className="h-12 mb-2 rounded" />}
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
                {form.favicon_url && <img src={resolveImageUrl(String(form.favicon_url))} alt="Favicon" className="h-8 mb-2" />}
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

      <Dialog open={countryDlg} onOpenChange={setCountryDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau pays</DialogTitle>
            <DialogDescription>Ajout rapide dans la base (code ISO2 recommande, ex. FR).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="France" />
            </div>
            <div className="space-y-2">
              <Label>Code pays (ISO2 / unique)</Label>
              <Input value={cCode} onChange={(e) => setCCode(e.target.value.toUpperCase())} placeholder="FR" maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Drapeau (emoji, optionnel)</Label>
              <Input value={cEmoji} onChange={(e) => setCEmoji(e.target.value)} placeholder="🇫🇷" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCountryDlg(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={submitCountry} disabled={createCountry.isPending}>
              {createCountry.isPending ? 'Creation…' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
