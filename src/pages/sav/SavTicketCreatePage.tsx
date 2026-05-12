import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Paperclip, Search } from 'lucide-react'
import api from '@/api/client'
import { useCreateSavTicket, useSavTickets } from '@/hooks/useSav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuthStore } from '@/stores/authStore'
import { getSavBasePath, isPortalClientUser } from '@/lib/savPortalPaths'

const CHANNELS = [
  { value: 'portal', label: 'Portail client' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telephone', label: 'Téléphone' },
]

const URGENCY_LEVELS = [
  { value: 'low', label: 'Ça peut attendre', color: 'text-yellow-600' },
  { value: 'normal', label: 'C\'est urgent', color: 'text-orange-600' },
  { value: 'urgent', label: 'Critique', color: 'text-red-600' },
]

export default function SavTicketCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const savBase = getSavBasePath(user)
  const isClient = isPortalClientUser(user)
  const createMut = useCreateSavTicket()
  const { data: listData } = useSavTickets({ per_page: 1 })

  const categories = listData?.categories ?? []
  const priorities = listData?.priorities ?? []

  const [ticketFamily, setTicketFamily] = useState<'dossier' | 'general'>('dossier')
  const [clientSearch, setClientSearch] = useState('')
  const [dossierSearch, setDossierSearch] = useState('')

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

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const { data: clientsData } = useQuery({
    queryKey: ['sav-clients', clientSearch],
    queryFn: () => api.get('/api/clients', { params: { search: clientSearch, per_page: 10 } }).then(r => r.data),
    enabled: !isClient && clientSearch.length >= 2,
  })

  const clients = clientsData?.clients?.data ?? clientsData?.clients ?? []

  const { data: dossiersData } = useQuery({
    queryKey: ['sav-dossiers', form.client_id, dossierSearch],
    queryFn: () => {
      const params: Record<string, string> = { per_page: '10' }
      if (dossierSearch) params.search = dossierSearch
      if (form.client_id) params.user_id = form.client_id
      return api.get('/api/shipments', { params }).then(r => r.data)
    },
    enabled: ticketFamily === 'dossier',
  })

  const dossiers = dossiersData?.shipments?.data ?? dossiersData?.shipments ?? []

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

  const selectClient = useCallback((id: number, name: string) => {
    set('client_id', String(id))
    setClientSearch(name)
  }, [])

  const selectDossier = useCallback((id: number, ref: string, type: string) => {
    set('related_id', String(id))
    set('related_type', type)
    setDossierSearch(ref)
  }, [])

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
          <CardHeader><CardTitle>Nouveau ticket SAV</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Famille de ticket */}
              <div className="space-y-3">
                <Label>Concerne</Label>
                <RadioGroup value={ticketFamily} onValueChange={(v) => setTicketFamily(v as 'dossier' | 'general')} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dossier" id="family-dossier" />
                    <Label htmlFor="family-dossier" className="font-normal cursor-pointer">Un dossier spécifique</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="family-general" />
                    <Label htmlFor="family-general" className="font-normal cursor-pointer">Question générale (pas de dossier)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Client selector (staff uniquement) */}
              {!isClient && (
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client"
                    className="pl-10"
                    placeholder="Rechercher un client..."
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); set('client_id', '') }}
                  />
                </div>
                {clientSearch.length >= 2 && !form.client_id && clients.length > 0 && (
                  <div className="border rounded-md bg-popover shadow-md max-h-40 overflow-y-auto">
                    {clients.map((c: { id: number; name: string; email?: string; phone?: string; user_id?: number }) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                        onClick={() => selectClient(c.user_id ?? c.id, c.name)}
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.phone || c.email || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.client_id && (
                  <p className="text-xs text-emerald-600 font-medium">Client sélectionné : {clientSearch}</p>
                )}
              </div>
              )}

              {/* Dossier selector */}
              {ticketFamily === 'dossier' && (
                <div className="space-y-2">
                  <Label htmlFor="dossier">Dossier lié</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dossier"
                      className="pl-10"
                      placeholder="Rechercher un dossier (référence, tracking)..."
                      value={dossierSearch}
                      onChange={e => { setDossierSearch(e.target.value); set('related_id', ''); set('related_type', '') }}
                    />
                  </div>
                  {dossierSearch && !form.related_id && dossiers.length > 0 && (
                    <div className="border rounded-md bg-popover shadow-md max-h-40 overflow-y-auto">
                      {dossiers.map((d: { id: number; tracking_number?: string; reference_code?: string; status?: string }) => {
                        const ref = d.tracking_number || d.reference_code || `#${d.id}`
                        return (
                          <button
                            key={d.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                            onClick={() => selectDossier(d.id, ref, 'App\\Models\\Shipment')}
                          >
                            <span className="font-mono font-medium">{ref}</span>
                            <span className="text-xs text-muted-foreground capitalize">{d.status || ''}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {form.related_id && (
                    <p className="text-xs text-emerald-600 font-medium">Dossier lié : {dossierSearch}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Type de problème *</Label>
                  <Select value={form.category} onValueChange={v => set('category', v)}>
                    <SelectTrigger id="category"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel">Canal</Label>
                  <Select value={form.channel} onValueChange={v => set('channel', v)}>
                    <SelectTrigger id="channel"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(isClient ? CHANNELS.filter(c => c.value === 'portal') : CHANNELS).map(ch => (
                        <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input id="subject" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Décrivez le problème en une ligne" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée</Label>
                <Textarea id="description" value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="Décrivez le problème en détail..." />
              </div>

              {/* Pièces jointes */}
              <div className="space-y-2">
                <Label>Pièces jointes (photos, documents)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Paperclip className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Joindre des fichiers</p>
                  <p className="text-xs text-muted-foreground mt-1">Photos, PDF, documents</p>
                </div>
              </div>

              {/* Niveau d'urgence ressenti */}
              <div className="space-y-3">
                <Label>Niveau d'urgence ressenti</Label>
                <RadioGroup value={form.priority || 'normal'} onValueChange={v => set('priority', v)} className="flex gap-4">
                  {URGENCY_LEVELS.map(u => (
                    <div key={u.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={u.value} id={`urgency-${u.value}`} />
                      <Label htmlFor={`urgency-${u.value}`} className={`font-normal cursor-pointer ${u.color}`}>{u.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(savBase)}>Annuler</Button>
                <Button type="submit" disabled={!form.subject || !form.category || createMut.isPending}>
                  {createMut.isPending ? 'Création...' : 'Soumettre le signalement'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
