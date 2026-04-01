import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  agencyHooks,
  officeHooks,
  useCountriesList,
  usePhoneCountries,
  type ApiCountryRow,
} from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { CrudSheet } from './CrudSheet'
import { SearchableSelectWithAdd, type SearchableOption } from './SearchableSelectWithAdd'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPinHouse, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Agency, Office } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import { CountryFlag } from '@/components/CountryFlag'
import { PhoneContactFields } from '@/components/PhoneContactFields'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CLEAR = '__clear'

export default function AgenciesTab() {
  const { data: agencies, isLoading: loadingA } = agencyHooks.useList()
  const createAgency = agencyHooks.useCreate()
  const updateAgency = agencyHooks.useUpdate()

  const { data: offices, isLoading: loadingO } = officeHooks.useList()
  const createOffice = officeHooks.useCreate()
  const updateOffice = officeHooks.useUpdate()
  const deleteOffice = officeHooks.useDelete()

  const { data: countries, isLoading: loadingCountries } = useCountriesList()
  const { data: phoneCountries = [], isLoading: loadingPhoneCountries } = usePhoneCountries()

  const [sheetType, setSheetType] = useState<'agency' | 'office' | null>(null)
  const [editItem, setEditItem] = useState<Agency | Office | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})

  const countryOptions: SearchableOption[] = useMemo(() => {
    const rows = countries ?? []
    return rows.map((c: ApiCountryRow) => ({
      value: String(c.id),
      label: (
        <span className="flex items-center gap-2">
          <CountryFlag emoji={c.emoji} iso2={c.iso2} code={c.code} />
          <span>{c.name}</span>
        </span>
      ),
      keywords: [c.name, c.code || '', c.iso2 || '', String(c.id)],
    }))
  }, [countries])

  const countrySelectValue = useMemo(() => {
    const id = form.country_id
    if (id === '' || id == null) return ''
    return String(id)
  }, [form.country_id])

  const openCreate = (type: 'agency' | 'office') => {
    setSheetType(type)
    setEditItem(null)
    if (type === 'agency') {
      setForm({ code: '', name: '', default_currency: 'USD', is_active: true })
    } else {
      setForm({
        type: 'office',
        name: '',
        address: '',
        city: '',
        country: '',
        country_id: '',
        agency_id: null as number | null,
        contact_name: '',
        contact_phone: '',
        contact_phone_secondary: '',
        contact_email: '',
        is_active: true,
      })
    }
  }

  const openEdit = (type: 'agency' | 'office', item: Agency | Office) => {
    setSheetType(type)
    setEditItem(item)
    if (type === 'agency') {
      const a = item as Agency
      setForm({
        code: a.code,
        name: displayLocalized(a.name as unknown),
        default_currency: a.default_currency ?? 'USD',
        is_active: a.is_active !== false,
      })
    } else {
      const o = item as Office
      const cid =
        o.country && countries
          ? countries.find((c) => c.name === o.country)?.id ?? ''
          : ''
      setForm({
        type: o.type ?? 'office',
        name: displayLocalized(o.name as unknown),
        address: o.address ?? '',
        city: o.city ?? '',
        country: o.country ?? '',
        country_id: cid === '' ? '' : cid,
        agency_id: o.agency_id ?? null,
        contact_name: o.contact_name ?? '',
        contact_phone: o.contact_phone ?? o.phone ?? '',
        contact_phone_secondary: o.contact_phone_secondary ?? '',
        contact_email: o.contact_email ?? '',
        is_active: o.is_active !== false,
      })
    }
  }

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (sheetType === 'agency') {
      const code = String(form.code ?? '').trim().toUpperCase()
      const name = String(form.name ?? '').trim()
      const default_currency = String(form.default_currency ?? 'USD').trim().toUpperCase()
      if (!name || (!editItem && !code)) return
      const payload: Record<string, unknown> = {
        name,
        default_currency,
        is_active: form.is_active !== false,
      }
      if (!editItem) payload.code = code
      if (editItem) {
        updateAgency.mutate({ id: (editItem as Agency).id, data: payload }, { onSuccess: () => setSheetType(null) })
      } else {
        createAgency.mutate(payload, { onSuccess: () => setSheetType(null) })
      }
    } else {
      const type = (form.type as string) === 'branch' ? 'branch' : 'office'
      const name = String(form.name ?? '').trim()
      if (!name) return
      const countryRow =
        form.country_id !== '' && form.country_id != null
          ? (countries ?? []).find((c) => String(c.id) === String(form.country_id))
          : null
      const payload: Record<string, unknown> = {
        type,
        name,
        address: String(form.address ?? '').trim() || null,
        city: String(form.city ?? '').trim() || null,
        country: (countryRow?.name ?? String(form.country ?? '').trim()) || null,
        contact_name: String(form.contact_name ?? '').trim() || null,
        contact_phone: String(form.contact_phone ?? '').trim() || null,
        contact_phone_secondary: String(form.contact_phone_secondary ?? '').trim() || null,
        contact_email: String(form.contact_email ?? '').trim() || null,
        is_active: form.is_active !== false,
        agency_id:
          form.agency_id != null && form.agency_id !== '' ? Number(form.agency_id) : null,
      }
      if (editItem) {
        updateOffice.mutate({ id: (editItem as Office).id, data: payload }, { onSuccess: () => setSheetType(null) })
      } else {
        createOffice.mutate(payload, { onSuccess: () => setSheetType(null) })
      }
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Agences & Bureaux</h2>
        <p className="text-sm text-muted-foreground">Gestion des succursales et points de service</p>
      </motion.div>

      <Tabs defaultValue="agencies" className="w-full">
        <TabsList className={settingsInnerTabsList}>
          <TabsTrigger value="agencies" className={settingsInnerTabsTrigger}>
            Agences
          </TabsTrigger>
          <TabsTrigger value="offices" className={settingsInnerTabsTrigger}>
            Bureaux
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agencies" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Agences / Succursales"
            icon={Building2}
            badge={`${agencies?.length ?? 0}`}
            isLoading={loadingA}
            actions={
              <Button size="sm" onClick={() => openCreate('agency')}>
                <Plus size={14} className="mr-1" />
                Ajouter
              </Button>
            }
          >
            <div className="space-y-2">
              {agencies?.map((a: Agency) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{displayLocalized(a.name as unknown)}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.code} · {a.default_currency}
                        {a.users_count != null ? ` · ${a.users_count} utilisateur(s)` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-xs">
                      {a.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit('agency', a)}>
                      <Pencil size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              {(!agencies || agencies.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune agence</p>
              )}
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="offices" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Bureaux / Points de service"
            icon={MapPinHouse}
            badge={`${offices?.length ?? 0}`}
            isLoading={loadingO}
            actions={
              <Button size="sm" onClick={() => openCreate('office')}>
                <Plus size={14} className="mr-1" />
                Ajouter
              </Button>
            }
          >
            <div className="space-y-2">
              {offices?.map((o: Office) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{displayLocalized(o.name as unknown)}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.city}
                      {o.country ? `, ${o.country}` : ''}
                      {(o.contact_phone || o.phone) && ` · ${o.contact_phone ?? o.phone}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit('office', o)}>
                      <Pencil size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce bureau ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteOffice.mutate(o.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {(!offices || offices.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun bureau</p>
              )}
            </div>
          </SettingsCard>
        </TabsContent>
      </Tabs>

      <CrudSheet
        open={!!sheetType}
        onOpenChange={() => setSheetType(null)}
        title={
          editItem
            ? `Modifier ${sheetType === 'agency' ? "l'agence" : 'le bureau'}`
            : `Nouveau ${sheetType === 'agency' ? 'agence' : 'bureau'}`
        }
        onSubmit={handleSubmit}
        isLoading={
          createAgency.isPending ||
          updateAgency.isPending ||
          createOffice.isPending ||
          updateOffice.isPending
        }
      >
        {sheetType === 'agency' ? (
          <div className="space-y-4">
            {!editItem && (
              <div className="space-y-2">
                <Label>Code unique *</Label>
                <Input
                  value={String(form.code ?? '')}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  placeholder="ex. BOG01"
                  maxLength={32}
                />
              </div>
            )}
            {editItem && (
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={String(form.code ?? '')} disabled className="bg-muted/50" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={String(form.name ?? '')} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Devise par défaut *</Label>
              <Input
                value={String(form.default_currency ?? 'USD')}
                onChange={(e) => set('default_currency', e.target.value.toUpperCase())}
                maxLength={8}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active !== false} onCheckedChange={(v) => set('is_active', v)} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={String(form.type ?? 'office')} onValueChange={(v) => set('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Bureau</SelectItem>
                  <SelectItem value="branch">Succursale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agence rattachée</Label>
              <Select
                value={form.agency_id != null && form.agency_id !== '' ? String(form.agency_id) : CLEAR}
                onValueChange={(v) => set('agency_id', v === CLEAR ? null : Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CLEAR}>(Aucune)</SelectItem>
                  {(agencies ?? []).map((a: Agency) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {displayLocalized(a.name as unknown)} ({a.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={String(form.name ?? '')} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input value={String(form.address ?? '')} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={String(form.city ?? '')} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Pays</Label>
                <SearchableSelectWithAdd
                  value={countrySelectValue || CLEAR}
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
                  options={[
                    {
                      value: CLEAR,
                      label: <span className="text-muted-foreground">(Aucun pays)</span>,
                      keywords: ['aucun'],
                    },
                    ...countryOptions,
                  ]}
                  placeholder="Choisir un pays…"
                  searchPlaceholder="Rechercher un pays…"
                  emptyText="Aucun pays."
                  isLoading={loadingCountries}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact (nom)</Label>
              <Input value={String(form.contact_name ?? '')} onChange={(e) => set('contact_name', e.target.value)} />
            </div>
            <PhoneContactFields
              label="Téléphone"
              primary={String(form.contact_phone ?? '')}
              secondary={String(form.contact_phone_secondary ?? '')}
              onPrimaryChange={(v) => set('contact_phone', v)}
              onSecondaryChange={(v) => set('contact_phone_secondary', v)}
              countries={phoneCountries}
              isLoadingCountries={loadingPhoneCountries}
            />
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={String(form.contact_email ?? '')}
                onChange={(e) => set('contact_email', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch checked={form.is_active !== false} onCheckedChange={(v) => set('is_active', v)} />
            </div>
          </div>
        )}
      </CrudSheet>
    </div>
  )
}
