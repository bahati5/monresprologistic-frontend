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
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import type { SearchableOption } from './SearchableSelectWithAdd'
import { IdentitySettingsCard } from './general/IdentitySettingsCard'
import { AccountsSettingsCard } from './general/AccountsSettingsCard'
import { RegionalSettingsCard } from './general/RegionalSettingsCard'
import { CurrencySettingsCard } from './general/CurrencySettingsCard'
import { BrandingCard } from './general/BrandingCard'
import { CurrencyDialog } from './general/CurrencyDialog'
import { TimezoneDialog } from './general/TimezoneDialog'
import { ISO_4217_CURRENCIES } from '@/lib/iso4217'

/* eslint-disable react-hooks/set-state-in-effect */
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <IdentitySettingsCard
            form={form}
            set={set}
            phoneCountries={phoneCountries}
            loadingPhoneCountries={loadingPhoneCountries}
          />
        </TabsContent>

        <TabsContent value="accounts" className={settingsInnerTabsContent}>
          <AccountsSettingsCard form={form} set={set} />
        </TabsContent>

        <TabsContent value="locale" className={settingsInnerTabsContent}>
          <RegionalSettingsCard
            form={form}
            set={set}
            timezoneOptions={timezoneOptions}
            loadingTz={loadingTz}
            onManualTimezone={() => {
              setTzManual(String(form.timezone ?? ''))
              setTimezoneDlg(true)
            }}
          />
        </TabsContent>

        <TabsContent value="currency" className={settingsInnerTabsContent}>
          <CurrencySettingsCard
            form={form}
            set={set}
            currencyOptions={currencyOptions}
            decimalsOptions={decimalsOptions}
            symbolPositionOptions={symbolPositionOptions}
            onAddCurrency={() => setCurrencyDlg(true)}
          />
        </TabsContent>

        <TabsContent value="branding" className={settingsInnerTabsContent}>
          <BrandingCard
            form={form}
            set={set}
            uploadLogo={uploadLogo}
            uploadFavicon={uploadFavicon}
            logoPreviewFailed={logoPreviewFailed}
            setLogoPreviewFailed={setLogoPreviewFailed}
            faviconPreviewFailed={faviconPreviewFailed}
            setFaviconPreviewFailed={setFaviconPreviewFailed}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Enregistrement...' : 'Enregistrer les parametres'}
        </Button>
      </div>

      <CurrencyDialog
        open={currencyDlg}
        onOpenChange={setCurrencyDlg}
        curCode={curCode}
        setCurCode={setCurCode}
        curSymbol={curSymbol}
        setCurSymbol={setCurSymbol}
        curName={curName}
        setCurName={setCurName}
        onSubmit={submitCurrency}
      />

      <TimezoneDialog
        open={timezoneDlg}
        onOpenChange={setTimezoneDlg}
        tzManual={tzManual}
        setTzManual={setTzManual}
        onSubmit={submitTimezoneManual}
      />
    </div>
  )
}
