import { useState, useCallback, useMemo, useRef, useEffect, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Paperclip, Package, UserSearch } from 'lucide-react'
import api from '@/api/client'
import { toast } from 'sonner'
import { useCreateSavTicket, useSavTickets } from '@/hooks/useSav'
import { useSearchClients, useShipments } from '@/hooks/useShipments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { DbComboboxAsync, type DbComboboxOption } from '@/components/ui/DbCombobox'
import { ProfileWizardCreateModal } from '@/components/workflow/ProfileWizardCreateModal'
import { useAuthStore } from '@/stores/authStore'
import { getSavBasePath, isPortalClientUser } from '@/lib/savPortalPaths'
import type { Shipment } from '@/types/shipment'
import type { WizardClientSearchRow } from '@/components/shopping/assistedShoppingSchema'

const CHANNELS = [
  { value: 'portal', label: 'Portail client' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telephone', label: 'Téléphone' },
]

const RELATED_SHIPMENT_TYPE = 'App\\Models\\Shipment'

export default function SavTicketCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const savBase = getSavBasePath(user)
  const isClient = isPortalClientUser(user)
  const createMut = useCreateSavTicket()
  const { data: listData } = useSavTickets({ per_page: 1 })

  const categories = Array.isArray(listData?.categories) ? listData.categories : []
  const priorities = Array.isArray(listData?.priorities) ? listData.priorities : []

  const [ticketFamily, setTicketFamily] = useState<'dossier' | 'general'>('dossier')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientLabel, setSelectedClientLabel] = useState('')
  const [resolvingClient, setResolvingClient] = useState(false)
  const [createClientModalOpen, setCreateClientModalOpen] = useState(false)

  const [dossierSearch, setDossierSearch] = useState('')
  const dossierDeferred = useDeferredValue(dossierSearch.trim())
  const [selectedDossierLabel, setSelectedDossierLabel] = useState('')

  const [form, setForm] = useState({
    subject: '',
    category: '',
    priority: '',
    channel: 'portal',
    description: '',
    client_id: '',
    related_type: '',
    related_id: '',
  })

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }))

  const { data: clientsRaw, isFetching: clientsLoading } = useSearchClients(clientSearch)

  const clientsRawRef = useRef(clientsRaw)
  clientsRawRef.current = clientsRaw

  const clientComboboxOptions: DbComboboxOption[] = useMemo(() => {
    const rows = Array.isArray(clientsRaw) ? (clientsRaw as WizardClientSearchRow[]) : []
    return rows.map((r) => {
      const hasPortal = r.has_portal === true || (r.user_id != null && Number(r.user_id) > 0)
      const uid = hasPortal ? Number(r.user_id) : 0
      const sub = [r.email, r.phone].filter(Boolean).join(' · ')
      const portalTag = hasPortal ? 'Portail' : 'Sans portail'
      const value = hasPortal ? String(uid) : `profile:${r.id}`
      return {
        value,
        label: (
          <div className="flex flex-col items-start gap-0.5 py-0.5 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium leading-tight">{r.name ?? 'Client'}</span>
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  hasPortal
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {portalTag}
              </span>
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              {sub || 'Aucun contact'}
              {r.locker_code ? ` · Casier ${r.locker_code}` : ''}
            </span>
          </div>
        ),
        keywords: [r.name ?? '', r.email ?? '', r.phone ?? '', r.locker_code ?? ''].filter(Boolean) as string[],
      }
    })
  }, [clientsRaw])

  const trackClientSelection = useCallback((comboValue: string) => {
    if (!comboValue) {
      setSelectedClientLabel('')
      return
    }
    const rows = Array.isArray(clientsRawRef.current) ? (clientsRawRef.current as WizardClientSearchRow[]) : []
    const hasPortalPrefix = comboValue.startsWith('profile:')
    const profileId = hasPortalPrefix ? Number(comboValue.replace('profile:', '')) : null
    const userId = !hasPortalPrefix ? Number(comboValue) : null
    const row = rows.find((r) => {
      if (profileId != null) return r.id === profileId
      if (userId != null) return Number(r.user_id) === userId
      return false
    })
    if (row) setSelectedClientLabel(row.name ?? 'Client')
  }, [])

  const resolveClientToUserId = useCallback(async (comboValue: string): Promise<number | undefined> => {
    if (!comboValue.startsWith('profile:')) {
      const n = Number(comboValue)
      return Number.isFinite(n) && n > 0 ? n : undefined
    }
    const profileId = Number(comboValue.replace('profile:', ''))
    if (!Number.isFinite(profileId) || profileId <= 0) return undefined
    try {
      const res = await api.post<{ user_id?: number }>('/api/shipment-wizard/quick-create-portal', {
        profile_id: profileId,
      })
      const uid = res.data?.user_id
      if (uid && uid > 0) return uid
    } catch {
      /* liaison portail impossible */
    }
    toast.error("Impossible d'associer ce profil à un compte portail.")
    return undefined
  }, [])

  const onClientComboboxChange = useCallback(
    async (v: string) => {
      if (!v) {
        set('client_id', '')
        setSelectedClientLabel('')
        set('related_id', '')
        set('related_type', '')
        trackClientSelection('')
        return
      }
      trackClientSelection(v)
      if (!v.startsWith('profile:')) {
        set('client_id', v)
        set('related_id', '')
        set('related_type', '')
        setSelectedDossierLabel('')
        return
      }
      setResolvingClient(true)
      try {
        const uid = await resolveClientToUserId(v)
        if (uid) {
          set('client_id', String(uid))
          set('related_id', '')
          set('related_type', '')
          setSelectedDossierLabel('')
        }
      } finally {
        setResolvingClient(false)
      }
    },
    [resolveClientToUserId, trackClientSelection],
  )

  const handleNewClientCreated = useCallback(
    async (profileId: number, clientName?: string) => {
      setCreateClientModalOpen(false)
      const uid = await resolveClientToUserId(`profile:${profileId}`)
      if (uid) {
        setForm((prev) => ({ ...prev, client_id: String(uid) }))
        setSelectedClientLabel(clientName ?? 'Client')
      } else if (clientName) {
        setSelectedClientLabel(clientName)
        toast.message('Client créé — associez un compte portail pour lier le ticket à ce client.')
      }
      await queryClient.invalidateQueries({ queryKey: ['wizard', 'clients'] })
    },
    [queryClient, resolveClientToUserId],
  )

  const shipmentFilters = useMemo(
    () => ({
      page: 1,
      per_page: 15,
      search: dossierDeferred || undefined,
      user_id: form.client_id ? Number(form.client_id) : undefined,
    }),
    [dossierDeferred, form.client_id],
  )

  const dossierMinSearch = form.client_id ? 0 : 2
  const shipmentListEnabled =
    ticketFamily === 'dossier' &&
    (!!form.client_id || dossierDeferred.length >= dossierMinSearch)

  const { data: shipmentsPage, isFetching: shipmentsLoading } = useShipments(shipmentFilters, {
    enabled: shipmentListEnabled,
  })

  const dossierComboboxOptions: DbComboboxOption[] = useMemo(() => {
    const rows = Array.isArray(shipmentsPage?.data) ? (shipmentsPage.data as Shipment[]) : []
    return rows.map((s) => {
      const ref = s.tracking_number || `#${s.id}`
      const st =
        typeof s.status === 'object' && s.status !== null && 'name' in s.status
          ? String((s.status as { name?: string }).name ?? '')
          : String(s.status ?? '')
      const sender = s.sender_name ?? ''
      return {
        value: String(s.id),
        label: (
          <div className="flex flex-col gap-0.5 py-0.5 text-left">
            <span className="font-mono font-medium">{ref}</span>
            <span className="text-xs font-normal text-muted-foreground">{[sender, st].filter(Boolean).join(' · ')}</span>
          </div>
        ),
        keywords: [ref, sender, st],
      }
    })
  }, [shipmentsPage])

  useEffect(() => {
    setForm((prev) => ({ ...prev, related_id: '', related_type: '' }))
    setSelectedDossierLabel('')
  }, [form.client_id])

  const onDossierComboboxChange = useCallback(
    (v: string) => {
      if (!v) {
        set('related_id', '')
        set('related_type', '')
        setSelectedDossierLabel('')
        return
      }
      const id = Number(v)
      const row = (shipmentsPage?.data as Shipment[] | undefined)?.find((s) => s.id === id)
      const ref = row?.tracking_number || (row ? `#${row.id}` : v)
      set('related_id', v)
      set('related_type', RELATED_SHIPMENT_TYPE)
      setSelectedDossierLabel(ref)
    },
    [shipmentsPage],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      subject: form.subject,
      category: form.category,
      channel: form.channel,
      description: form.description,
    }
    if (form.priority) payload.priority = form.priority
    if (form.client_id) payload.client_id = Number(form.client_id)
    if (form.related_type && form.related_id) {
      payload.related_type = form.related_type
      payload.related_id = Number(form.related_id)
    }

    createMut.mutate(payload, {
      onSuccess: (data) => {
        const uuid = data?.ticket?.uuid
        navigate(uuid ? `${savBase}/${uuid}` : savBase)
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(savBase)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Signaler un problème</h1>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Nouveau ticket SAV</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label>Concerne</Label>
                <RadioGroup
                  value={ticketFamily}
                  onValueChange={(v) => setTicketFamily(v as 'dossier' | 'general')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dossier" id="family-dossier" />
                    <Label htmlFor="family-dossier" className="font-normal cursor-pointer">
                      Un dossier spécifique
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="family-general" />
                    <Label htmlFor="family-general" className="font-normal cursor-pointer">
                      Question générale (pas de dossier)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {!isClient && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/[0.03] p-4 shadow-sm ring-1 ring-primary/10 dark:bg-primary/5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <UserSearch className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor="sav-create-client" className="text-base font-semibold">
                          Client concerné
                        </Label>
                        <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
                          Si dossier
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Même recherche que les expéditions et l’achat assisté (nom, e-mail ou téléphone).
                      </p>
                    </div>
                  </div>
                  <DbComboboxAsync
                    id="sav-create-client"
                    value={form.client_id || ''}
                    selectedDisplayLabel={selectedClientLabel || undefined}
                    onValueChange={onClientComboboxChange}
                    options={clientComboboxOptions}
                    filterQuery={clientSearch}
                    onFilterQueryChange={setClientSearch}
                    searchMinLength={2}
                    belowMinText="Saisissez au moins 2 caractères (nom, e-mail ou téléphone)."
                    placeholder={resolvingClient ? 'Chargement…' : 'Rechercher un client…'}
                    searchPlaceholder="Nom, e-mail ou téléphone…"
                    emptyText="Aucun résultat. Utilisez le bouton + pour créer un nouveau client."
                    isLoading={clientsLoading || resolvingClient}
                    showCreateButton
                    createButtonTitle="Nouveau client"
                    onOpenCreateModal={() => setCreateClientModalOpen(true)}
                  />
                  <ProfileWizardCreateModal
                    open={createClientModalOpen}
                    onOpenChange={setCreateClientModalOpen}
                    mode="sender"
                    searchHint={clientSearch}
                    onCreated={handleNewClientCreated}
                    showPortalCheckbox
                  />
                </div>
              )}

              {ticketFamily === 'dossier' && (
                <div className="space-y-2 rounded-lg border border-muted p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Package className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <Label htmlFor="sav-create-dossier" className="text-base font-semibold">
                        Dossier lié
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {form.client_id
                          ? 'Expéditions de ce client — filtrez par suivi ou nom comme dans la liste des expéditions.'
                          : 'Saisissez au moins 2 caractères (suivi, expéditeur ou destinataire), ou choisissez d’abord un client.'}
                      </p>
                    </div>
                  </div>
                  <DbComboboxAsync
                    id="sav-create-dossier"
                    value={form.related_id || ''}
                    selectedDisplayLabel={selectedDossierLabel || undefined}
                    onValueChange={onDossierComboboxChange}
                    options={dossierComboboxOptions}
                    filterQuery={dossierSearch}
                    onFilterQueryChange={setDossierSearch}
                    searchMinLength={dossierMinSearch}
                    belowMinText="Saisissez au moins 2 caractères (comme dans la liste des expéditions), ou choisissez un client."
                    placeholder={shipmentsLoading ? 'Chargement…' : 'Rechercher par tracking, client…'}
                    searchPlaceholder="Rechercher par tracking, client…"
                    emptyText="Aucune expédition trouvée."
                    isLoading={shipmentsLoading}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Type de problème *</Label>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sélectionner…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel">Canal</Label>
                  <Select value={form.channel} onValueChange={(v) => set('channel', v)}>
                    <SelectTrigger id="channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(isClient ? CHANNELS.filter((c) => c.value === 'portal') : CHANNELS).map((ch) => (
                        <SelectItem key={ch.value} value={ch.value}>
                          {ch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={form.priority || '__default__'}
                  onValueChange={(v) => set('priority', v === '__default__' ? '' : v)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Par défaut (selon la catégorie)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Par défaut (selon la catégorie)</SelectItem>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  placeholder="Décrivez le problème en une ligne"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={5}
                  placeholder="Décrivez le problème en détail…"
                />
              </div>

              <div className="space-y-2">
                <Label>Pièces jointes (photos, documents)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Paperclip className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Joindre des fichiers</p>
                  <p className="text-xs text-muted-foreground mt-1">Photos, PDF, documents</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(savBase)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!form.subject || !form.category || createMut.isPending}>
                  {createMut.isPending ? 'Création…' : 'Soumettre le signalement'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
