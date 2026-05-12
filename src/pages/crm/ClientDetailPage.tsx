import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, History, Loader2 } from 'lucide-react'
import { useFormatMoney } from '@/hooks/useSettings'
import type { ClientActivityData, ClientInvoiceRow } from '@/types/clientDetail'
import { ClientDetailHeader } from '@/components/crm/clientDetail/ClientDetailHeader'
import { ClientDetailOverviewTab } from '@/components/crm/clientDetail/ClientDetailOverviewTab'
import { ClientShipmentsTab } from '@/components/crm/clientDetail/ClientShipmentsTab'
import { ClientDetailTimelineTab } from '@/components/crm/clientDetail/ClientDetailTimelineTab'
import { ClientPurchasesTab } from '@/components/crm/clientDetail/ClientPurchasesTab'
import { ClientDetailNoticesTab } from '@/components/crm/clientDetail/ClientDetailNoticesTab'
import { ClientInvoicesTab } from '@/components/crm/clientDetail/ClientInvoicesTab'
import { ClientDetailContactsTab } from '@/components/crm/clientDetail/ClientDetailContactsTab'
import { ClientEditDialog, type ClientEditFormState } from '@/components/crm/clientDetail/ClientEditDialog'

const emptyEditForm = (): ClientEditFormState => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  phone_secondary: '',
  address: '',
  landmark: '',
  zip_code: '',
  country_id: '',
  state_id: '',
  city_id: '',
})

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { formatMoney } = useFormatMoney()
  const [activeTab, setActiveTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<ClientEditFormState>(() => emptyEditForm())
  const [editSaving, setEditSaving] = useState(false)

  const { data, isLoading, error } = useQuery<ClientActivityData>({
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
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      </div>
    )
  }

  const {
    client,
    sentShipments,
    receivedShipments,
    assistedPurchases,
    shipmentNotices,
    invoices,
    addressBookEntries,
    timeline,
  } = data

  const sentCount = sentShipments?.meta?.total || 0
  const receivedCount = receivedShipments?.meta?.total || 0
  const totalSpent = invoices?.data?.reduce(
    (sum: number, inv: ClientInvoiceRow) => sum + (inv.status === 'paid' ? inv.amount : 0),
    0,
  ) || 0
  const pendingAmount = invoices?.data?.reduce(
    (sum: number, inv: ClientInvoiceRow) => sum + (inv.status === 'pending' ? inv.amount : 0),
    0,
  ) || 0

  const editAddressValid = Boolean(
    String(editForm.address ?? '').trim() &&
      editForm.country_id &&
      editForm.state_id &&
      editForm.city_id,
  )

  const openEdit = () => {
    setEditForm({
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      email: client.email || '',
      phone: client.phone || '',
      phone_secondary: client.phone_secondary || '',
      address: client.address || '',
      landmark: client.landmark || '',
      zip_code: client.zip_code || '',
      country_id: client.country?.id || '',
      state_id: client.state?.id || '',
      city_id: client.city?.id || '',
    })
    setEditOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editAddressValid) {
      toast.error(
        "Complètez l'adresse : rue, pays, région et ville sont requis après un changement de pays.",
      )
      return
    }
    setEditSaving(true)
    try {
      await axios.patch(`/api/clients/${id}`, editForm)
      toast.success('Client mis à jour')
      queryClient.invalidateQueries({ queryKey: ['client-activity', id] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setEditOpen(false)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message || 'Erreur lors de la mise à jour')
    } finally {
      setEditSaving(false)
    }
  }

  const onEditFieldChange = (key: keyof ClientEditFormState, value: string | number) => {
    setEditForm((p) => ({ ...p, [key]: value }))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <ClientDetailHeader
        client={client}
        sentCount={sentCount}
        receivedCount={receivedCount}
        assistedPurchasesTotal={assistedPurchases?.meta?.total || 0}
        totalSpentDisplay={formatMoney(totalSpent)}
        pendingAmountDisplay={formatMoney(pendingAmount)}
        onOpenEdit={openEdit}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1 overflow-x-hidden bg-muted p-1 lg:w-fit">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="shipments">
            Expéditions ({sentCount + receivedCount})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <History className="h-4 w-4 mr-1" /> Historique
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

        <TabsContent value="overview" className="space-y-4">
          <ClientDetailOverviewTab
            client={client}
            timeline={timeline}
            sentShipments={sentShipments}
            receivedShipments={receivedShipments}
            onViewAllActivity={() => setActiveTab('timeline')}
          />
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          <ClientShipmentsTab
            sentCount={sentCount}
            receivedCount={receivedCount}
            sentShipments={sentShipments}
            receivedShipments={receivedShipments}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <ClientDetailTimelineTab timeline={timeline} />
        </TabsContent>

        <TabsContent value="purchases">
          <ClientPurchasesTab assistedPurchases={assistedPurchases} formatMoney={formatMoney} />
        </TabsContent>

        <TabsContent value="notices">
          <ClientDetailNoticesTab shipmentNotices={shipmentNotices} />
        </TabsContent>

        <TabsContent value="invoices">
          <ClientInvoicesTab invoices={invoices} formatMoney={formatMoney} />
        </TabsContent>

        <TabsContent value="contacts">
          <ClientDetailContactsTab addressBookEntries={addressBookEntries} />
        </TabsContent>
      </Tabs>

      <ClientEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        clientFullName={client.full_name}
        editForm={editForm}
        onFieldChange={onEditFieldChange}
        editAddressValid={editAddressValid}
        editSaving={editSaving}
        onSubmit={handleEditSubmit}
      />
    </motion.div>
  )
}
