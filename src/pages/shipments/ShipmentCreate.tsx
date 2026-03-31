import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateShipment, useWizardAgencies, useSearchClients, useSearchRecipients, useQuickCreateClient, useQuickCreateRecipient } from '@/hooks/useShipments'
import { shippingModeHooks, deliveryTimeHooks } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Trash2, AlertCircle, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { toast } from 'sonner'
import { displayLocalized } from '@/lib/localizedString'

interface ShipmentItem {
  description: string
  quantity: number
  weight_kg: number
  value: number
}

interface Recipient {
  id: number
  name: string
  email: string
  phone: string
  city: string
  country: string
}

export default function ShipmentCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Form state
  const [clientId, setClientId] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  })
  const [items, setItems] = useState<ShipmentItem[]>([{ description: '', quantity: 1, weight_kg: 0, value: 0 }])
  const [shippingModeId, setShippingModeId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [deliveryTimeId, setDeliveryTimeId] = useState('')
  const [notes, setNotes] = useState('')

  // Data fetching via hooks
  const { data: clientsRaw } = useSearchClients('')
  const { data: recipientsRaw } = useSearchRecipients('', clientId ? Number(clientId) : undefined)
  const { data: agenciesRaw } = useWizardAgencies()
  const { data: modesRaw } = shippingModeHooks.useList()
  const { data: timesRaw } = deliveryTimeHooks.useList()
  const createMutation = useCreateShipment()

  const clientList = Array.isArray(clientsRaw) ? clientsRaw : clientsRaw?.clients || []
  const recipientList = Array.isArray(recipientsRaw) ? recipientsRaw : recipientsRaw?.recipients || []
  const agencyList = Array.isArray(agenciesRaw) ? agenciesRaw : agenciesRaw?.agencies || []
  const modeList = Array.isArray(modesRaw) ? modesRaw : []
  const timeList = Array.isArray(timesRaw) ? timesRaw : []

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, weight_kg: 0, value: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ShipmentItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = () => {
    const payload: any = {
      client_id: parseInt(clientId),
      items: items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        weight: i.weight_kg,
        declared_value: i.value || undefined,
      })),
      shipping_mode_id: shippingModeId ? parseInt(shippingModeId) : undefined,
      origin_office_id: agencyId ? parseInt(agencyId) : undefined,
      delivery_time_id: deliveryTimeId ? parseInt(deliveryTimeId) : undefined,
      notes: notes || undefined,
    }

    if (recipientId === 'new') {
      payload.recipient_name = newRecipient.name
      payload.recipient_phone = newRecipient.phone
      payload.recipient_email = newRecipient.email || undefined
      payload.recipient_address = newRecipient.address || undefined
      payload.recipient_city = newRecipient.city || undefined
      payload.recipient_country = newRecipient.country || undefined
    } else {
      payload.recipient_id = parseInt(recipientId)
    }

    createMutation.mutate(payload, {
      onSuccess: (data: any) => {
        const newId = data?.shipment?.id || data?.id
        if (newId) navigate(`/shipments/${newId}`)
        else navigate('/shipments')
      },
      onError: (err: any) => {
        if (err.response?.status === 422) {
          setErrors(err.response.data.errors || {})
        }
      },
    })
  }

  const canProceedStep1 = clientId && recipientId && (recipientId !== 'new' || (newRecipient.name && newRecipient.phone))
  const canProceedStep2 = items.length > 0 && items.every(i => i.description && i.quantity > 0)
  const canSubmit = canProceedStep1 && canProceedStep2 && shippingModeId

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/shipments')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Nouvelle expedition</h1>
      </div>

      <Tabs value={`step-${step}`} onValueChange={(v) => setStep(parseInt(v.split('-')[1]))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step-1" disabled={step < 1}>1. Expéditeur & Destinataire</TabsTrigger>
          <TabsTrigger value="step-2" disabled={step < 2}>2. Articles</TabsTrigger>
          <TabsTrigger value="step-3" disabled={step < 3}>3. Options & Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="step-1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Client expediteur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selectionner un client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientList.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{displayLocalized(c.name)} ({c.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sender_id && <p className="text-sm text-destructive">{errors.sender_id[0]}</p>}
              </div>
            </CardContent>
          </Card>

          {clientId && (
            <Card>
              <CardHeader>
                <CardTitle>Destinataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selectionner un destinataire</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un destinataire..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientList.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{displayLocalized(r.name)} - {r.city}, {r.country}</SelectItem>
                      ))}
                      <SelectItem value="new">+ Nouveau destinataire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipientId === 'new' && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <h4 className="font-medium">Nouveau destinataire</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nom *</Label>
                        <Input value={newRecipient.name} onChange={e => setNewRecipient({...newRecipient, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telephone *</Label>
                        <Input value={newRecipient.phone} onChange={e => setNewRecipient({...newRecipient, phone: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={newRecipient.email} onChange={e => setNewRecipient({...newRecipient, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input value={newRecipient.city} onChange={e => setNewRecipient({...newRecipient, city: e.target.value})} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Adresse</Label>
                        <Input value={newRecipient.address} onChange={e => setNewRecipient({...newRecipient, address: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Pays</Label>
                        <Input value={newRecipient.country} onChange={e => setNewRecipient({...newRecipient, country: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
              Suivant <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="step-2" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Articles a expedier</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={e => updateItem(index, 'description', e.target.value)}
                      placeholder="Description de l'article"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Qte</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poids (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.weight_kg}
                      onChange={e => updateItem(index, 'weight_kg', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Valeur</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.value}
                        onChange={e => updateItem(index, 'value', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Resume</AlertTitle>
                <AlertDescription>
                  {items.reduce((sum, i) => sum + i.quantity, 0)} articles | 
                  Poids total: {items.reduce((sum, i) => sum + (i.weight_kg * i.quantity), 0).toFixed(2)} kg | 
                  Valeur totale: {items.reduce((sum, i) => sum + (i.value * i.quantity), 0).toFixed(2)}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
              Suivant <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="step-3" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Options d'expedition</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mode de transport *</Label>
                  <Select value={shippingModeId} onValueChange={setShippingModeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {modeList.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>{displayLocalized(m.name)}{m.code ? ` (${m.code})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shipping_mode_id && <p className="text-sm text-destructive">{errors.shipping_mode_id[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Agence</Label>
                  <Select value={agencyId} onValueChange={setAgencyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agencyList.map((a: any) => (
                        <SelectItem key={a.id} value={String(a.id)}>{displayLocalized(a.name)} - {a.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delai de livraison</Label>
                <Select value={deliveryTimeId} onValueChange={setDeliveryTimeId}>
                  <SelectTrigger><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                  <SelectContent>
                    {timeList.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{displayLocalized(t.label || t.name)}{t.min_days ? ` (${t.min_days}-${t.max_days}j)` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Notes / Instructions</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions speciales..." rows={4} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? 'Creation...' : 'Creer l\'expedition'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
