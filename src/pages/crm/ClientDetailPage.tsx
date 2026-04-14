import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, User, Mail, Phone, MapPin, Package, ShoppingCart,
  FileText, CreditCard, Users, Clock, ChevronRight, Loader2,
  Send, Receipt, Truck, Inbox
} from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import { useFormatMoney } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

interface Profile {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string
  phone_secondary: string | null
  address: string | null
  landmark: string | null
  zip_code: string | null
  city: { id: number; name: string } | null
  state: { id: number; name: string } | null
  country: { id: number; name: string; code?: string; emoji?: string } | null
  agency_id: number | null
  is_active: boolean
  is_client: boolean
  is_staff: boolean
  is_recipient: boolean
  address_book_count: number
  has_account: boolean
  locker_number: string | null
  created_at: string
}

interface Shipment {
  id: number
  public_tracking: string
  status: string
  status_label: string
  sender_profile_id: number
  recipient_profile_id: number
  sender_name?: string
  recipient_name?: string
  weight_kg: number
  declared_value: number
  currency: string
  created_at: string
  senderProfile?: { full_name: string }
  recipientProfile?: { full_name: string }
}

interface Invoice {
  id: number
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
}

interface AssistedPurchase {
  id: number
  status: string
  status_label: string
  total_amount: number | null
  currency: string
  created_at: string
  converted_shipment_id: number | null
}

interface ShipmentNotice {
  id: number
  reference_code: string
  carrier_name: string
  tracking_number: string
  status: string
  status_label: string
  created_at: string
}

interface ActivityData {
  client: Profile
  sentShipments: { data: Shipment[]; meta: { total: number } }
  receivedShipments: { data: Shipment[]; meta: { total: number } }
  assistedPurchases: { data: AssistedPurchase[]; meta: { total: number } }
  shipmentNotices: { data: ShipmentNotice[]; meta: { total: number } }
  invoices: { data: Invoice[]; meta: { total: number } }
  addressBookEntries: { data: any[]; meta: { total: number } }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  awaiting_payment: 'bg-orange-100 text-orange-700',
  processing: 'bg-purple-100 text-purple-700',
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatMoney } = useFormatMoney()
  const [activeTab, setActiveTab] = useState('overview')

  const { data, isLoading, error } = useQuery<ActivityData>({
    queryKey: ['client-activity', id],
    queryFn: async () => {
      const res = await axios.get(`/api/clients/${id}/activity`)
      return res.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Erreur lors du chargement du client</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    )
  }

  const { client, sentShipments, receivedShipments, assistedPurchases, shipmentNotices, invoices, addressBookEntries } = data

  const totalShipments = (sentShipments?.meta?.total || 0) + (receivedShipments?.meta?.total || 0)
  const totalSpent = invoices?.data?.reduce((sum: number, inv: Invoice) => sum + (inv.status === 'paid' ? inv.amount : 0), 0) || 0
  const pendingAmount = invoices?.data?.reduce((sum: number, inv: Invoice) => sum + (inv.status === 'pending' ? inv.amount : 0), 0) || 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/clients')} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux clients
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{displayLocalized(client.full_name)}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant={client.is_active ? 'default' : 'secondary'}>
                {client.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              {client.is_client && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Client</Badge>
              )}
              {client.is_recipient && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Destinataire</Badge>
              )}
              {client.has_account && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Compte portail</Badge>
              )}
              {client.locker_number && (
                <Badge variant="outline" className="font-mono">Locker: {client.locker_number}</Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/clients/${id}/edit`)}>
            Modifier la fiche
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Package className="h-4 w-4 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{totalShipments}</p>
                <p className="text-xs text-muted-foreground">Expéditions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><ShoppingCart className="h-4 w-4 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{assistedPurchases?.meta?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Achats assistés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CreditCard className="h-4 w-4 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{formatMoney(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">Total payé</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Receipt className="h-4 w-4 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{formatMoney(pendingAmount)}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 lg:w-fit">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="shipments">
            Expéditions ({totalShipments})
          </TabsTrigger>
          <TabsTrigger value="purchases">
            Achats ({assistedPurchases?.meta?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="notices">
            Avis ({shipmentNotices?.meta?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Factures ({invoices?.meta?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts ({addressBookEntries?.meta?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                  {client.phone_secondary && <span className="text-muted-foreground">/ {client.phone_secondary}</span>}
                </div>
                {(client.address || client.city || client.country) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>
                      {[client.address, client.city?.name, client.country?.name].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Client depuis: {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sentShipments?.data?.slice(0, 3).map((s: Shipment) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{s.public_tracking}</span>
                    </div>
                    <Badge className={cn('text-xs', statusColors[s.status] || 'bg-gray-100')}>
                      {s.status_label}
                    </Badge>
                  </div>
                ))}
                {assistedPurchases?.data?.slice(0, 2).map((p: AssistedPurchase) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Achat #{p.id}</span>
                    </div>
                    <Badge className={cn('text-xs', statusColors[p.status] || 'bg-gray-100')}>
                      {p.status_label}
                    </Badge>
                  </div>
                ))}
                {!sentShipments?.data?.length && !assistedPurchases?.data?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          {/* Sent Shipments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" /> Expéditions envoyées ({sentShipments?.meta?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sentShipments?.data?.length ? (
                <div className="space-y-2">
                  {sentShipments.data.map((s: Shipment) => (
                    <Link key={s.id} to={`/shipments/${s.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{s.public_tracking}</p>
                            <p className="text-xs text-muted-foreground">
                              À: {s.recipientProfile?.full_name || s.recipient_name || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{s.weight_kg} kg</span>
                          <Badge className={cn('text-xs', statusColors[s.status] || 'bg-gray-100')}>
                            {s.status_label}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune expédition envoyée</p>
              )}
            </CardContent>
          </Card>

          {/* Received Shipments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Inbox className="h-5 w-5" /> Expéditions reçues ({receivedShipments?.meta?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receivedShipments?.data?.length ? (
                <div className="space-y-2">
                  {receivedShipments.data.map((s: Shipment) => (
                    <Link key={s.id} to={`/shipments/${s.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{s.public_tracking}</p>
                            <p className="text-xs text-muted-foreground">
                              De: {s.senderProfile?.full_name || s.sender_name || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn('text-xs', statusColors[s.status] || 'bg-gray-100')}>
                            {s.status_label}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune expédition reçue</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assisted Purchases Tab */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Achats assistés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assistedPurchases?.data?.length ? (
                <div className="space-y-2">
                  {assistedPurchases.data.map((p: AssistedPurchase) => (
                    <Link key={p.id} to={`/purchase-orders/${p.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Demande #{p.id}</p>
                            {p.total_amount && (
                              <p className="text-xs text-muted-foreground">
                                {formatMoney(p.total_amount)} {p.currency}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {p.converted_shipment_id && (
                            <Badge variant="outline" className="text-xs">Converti</Badge>
                          )}
                          <Badge className={cn('text-xs', statusColors[p.status] || 'bg-gray-100')}>
                            {p.status_label}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun achat assisté</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipment Notices Tab */}
        <TabsContent value="notices">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5" /> Avis d'expédition (Pré-alerts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipmentNotices?.data?.length ? (
                <div className="space-y-2">
                  {shipmentNotices.data.map((n: ShipmentNotice) => (
                    <div key={n.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{n.reference_code}</p>
                          <p className="text-xs text-muted-foreground">
                            {n.carrier_name} - {n.tracking_number}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn('text-xs', statusColors[n.status] || 'bg-gray-100')}>
                        {n.status_label}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun avis d'expédition</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" /> Factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices?.data?.length ? (
                <div className="space-y-2">
                  {invoices.data.map((inv: Invoice) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatMoney(inv.amount)}</span>
                        <Badge 
                          variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {inv.status === 'paid' ? 'Payée' : inv.status === 'pending' ? 'En attente' : 'Annulée'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune facture</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Book Tab */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> Contacts enregistrés (Carnet d'adresses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addressBookEntries?.data?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addressBookEntries.data.map((entry: any) => (
                    <div key={entry.id} className="p-3 rounded-lg border">
                      <p className="font-medium">{entry.contactProfile?.full_name || entry.alias || 'Contact'}</p>
                      {entry.contactProfile?.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {entry.contactProfile.email}
                        </p>
                      )}
                      {entry.contactProfile?.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {entry.contactProfile.phone}
                        </p>
                      )}
                      {entry.is_default && (
                        <Badge variant="outline" className="text-xs mt-2">Par défaut</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun contact enregistré</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
