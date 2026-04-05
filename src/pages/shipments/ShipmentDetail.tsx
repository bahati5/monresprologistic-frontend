import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { openApiPdf, printApiPdf, downloadApiPdf } from '@/lib/openPdf'
import { fetchShipmentDocumentHtml } from '@/lib/shipmentDocumentPreview'
import { ShipmentDocumentDigitalFrame } from '@/components/shipments/ShipmentDocumentDigitalFrame'
import { useShipment, useUpdateShipmentStatus, useAssignDriver, useRecordPayment, useDeliverShipment } from '@/hooks/useShipments'
import { useAssignableDrivers } from '@/hooks/useCrm'
import { useRegroupementsPicker, useAttachShipmentToRegroupement, useCreateRegroupement } from '@/hooks/useOperations'
import { useAuthStore } from '@/stores/authStore'
import { userCanManageRegroupementShipments } from '@/lib/permissions'
import { SHIPMENT_STATUS_FILTER_OPTIONS } from '@/types/shipment'
import { paymentMethodHooks, useFormatMoney, usePaymentGateways } from '@/hooks/useSettings'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { WorkflowStepper, type WorkflowStep } from '@/components/workflow/WorkflowStepper'
import { TimelineLog, type TimelineEvent } from '@/components/workflow/TimelineLog'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { STATUS_COLORS } from '@/lib/animations'
import { displayLocalized, resolveLocalized } from '@/lib/localizedString'
import { CorridorFlags, LotRouteFlags } from '@/lib/countryFlags'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft, Package, MapPin, User, Phone, Mail,
  Calendar, Weight, Ruler, DollarSign, FileText, Truck,
  Copy, Printer, MoreHorizontal, RefreshCw, UserPlus, CreditCard,
  Download, CheckCircle, Tag, Loader2, Layers,
} from 'lucide-react'
/** Comptoir : sans « en attente de dépôt ». Pré-alerte : commence à cette étape. */
const DIRECT_SHIPMENT_STEP_ORDER = [
  'draft',
  'received_at_hub',
  'ready_for_dispatch',
  'in_transit',
  'arrived_at_destination',
  'delivered',
] as const

const PREALERT_SHIPMENT_STEP_ORDER = [
  'pending_drop_off',
  'received_at_hub',
  'ready_for_dispatch',
  'in_transit',
  'arrived_at_destination',
  'delivered',
] as const

const FALLBACK_DIRECT_STEPS: WorkflowStep[] = [
  { id: 'draft', title: 'Brouillon', icon: FileText },
  { id: 'received_at_hub', title: 'Réceptionné au hub', icon: CheckCircle },
  { id: 'ready_for_dispatch', title: 'Prêt à l’expédition', icon: Package },
  { id: 'in_transit', title: 'En transit', icon: Truck },
  { id: 'arrived_at_destination', title: 'Arrivé à destination', icon: MapPin },
  { id: 'delivered', title: 'Livré', icon: Package },
]

const FALLBACK_PREALERT_STEPS: WorkflowStep[] = [
  { id: 'pending_drop_off', title: 'En attente de dépôt', icon: Package },
  { id: 'received_at_hub', title: 'Réceptionné au hub', icon: CheckCircle },
  { id: 'ready_for_dispatch', title: 'Prêt à l’expédition', icon: Package },
  { id: 'in_transit', title: 'En transit', icon: Truck },
  { id: 'arrived_at_destination', title: 'Arrivé à destination', icon: MapPin },
  { id: 'delivered', title: 'Livré', icon: Package },
]

function completedBeforeCurrent(currentStatusCode: string, fromPreAlert: boolean): string[] {
  const order = fromPreAlert ? PREALERT_SHIPMENT_STEP_ORDER : DIRECT_SHIPMENT_STEP_ORDER
  const idx = order.indexOf(currentStatusCode as (typeof order)[number])
  if (idx <= 0) return []
  return [...order.slice(0, idx)]
}

function labelForRegroupementStatus(status: unknown): string {
  const code = typeof status === 'string' ? status : (status as { code?: string })?.code
  if (!code) return '—'
  return SHIPMENT_STATUS_FILTER_OPTIONS.find((o) => o.code === code)?.name ?? code
}

function paymentStatusBadge(paymentStatus: string | undefined) {
  const ps = paymentStatus || 'unpaid'
  if (ps === 'paid') return { label: 'Payé', style: { backgroundColor: '#16a34a20', color: '#16a34a', borderColor: '#16a34a40' } }
  if (ps === 'partial') return { label: 'Paiement partiel', style: { backgroundColor: '#d9770620', color: '#d97706', borderColor: '#d9770640' } }
  return { label: 'Impayé', style: { backgroundColor: '#64748b20', color: '#64748b', borderColor: '#64748b40' } }
}

const PAYMENT_METHOD_FALLBACK: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement bancaire',
  card: 'Carte bancaire',
  other: 'Autre',
}

function paymentMethodDisplayLabel(
  code: string,
  methods: { code?: string | null; id: number; name: unknown; is_active?: boolean }[] | undefined,
): string {
  const active = methods?.filter((m) => m.is_active !== false) ?? []
  const found = active.find((m) => (m.code || String(m.id)) === code)
  if (found) return displayLocalized(found.name)
  return PAYMENT_METHOD_FALLBACK[code] ?? code
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function ShipmentDetail() {
  const { id } = useParams()
  const { data, isLoading, dataUpdatedAt } = useShipment(id)
  const updateStatus = useUpdateShipmentStatus()
  const assignDriver = useAssignDriver()
  const recordPayment = useRecordPayment()
  const deliverShipment = useDeliverShipment()
  const { data: drivers } = useAssignableDrivers()
  const { data: paymentMethods } = paymentMethodHooks.useList()
  const { data: gateways } = usePaymentGateways()
  const { formatMoney } = useFormatMoney()
  const { user } = useAuthStore()
  const attachToRegroupement = useAttachShipmentToRegroupement()
  const createRegroupement = useCreateRegroupement()

  const [statusDialog, setStatusDialog] = useState(false)
  const [driverDialog, setDriverDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [selectedStatusCode, setSelectedStatusCode] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: '', reference: '', note: '' })

  const [detailTab, setDetailTab] = useState('items')
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null)
  const [labelHtml, setLabelHtml] = useState<string | null>(null)
  const [docFetchState, setDocFetchState] = useState({ invoice: true, label: true })
  const [docDownloadKind, setDocDownloadKind] = useState<'invoice' | 'label' | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setInvoiceHtml(null)
    setLabelHtml(null)
    setDocFetchState({ invoice: true, label: true })

    const sid = Number(id)

    void (async () => {
      const inv = await fetchShipmentDocumentHtml(sid, 'invoice', { suppressToast: true })
      if (cancelled) return
      if (inv) setInvoiceHtml(inv)
      setDocFetchState((s) => ({ ...s, invoice: false }))

      const lab = await fetchShipmentDocumentHtml(sid, 'label', { suppressToast: true })
      if (cancelled) return
      if (lab) setLabelHtml(lab)
      setDocFetchState((s) => ({ ...s, label: false }))
    })()

    return () => {
      cancelled = true
    }
  }, [id, dataUpdatedAt])

  const canRegrouper = userCanManageRegroupementShipments(user)
  const { data: consPickerData, isLoading: consPickerLoading } = useRegroupementsPicker(
    consolidateOpen && canRegrouper,
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 rounded bg-muted animate-shimmer" />
        <div className="h-20 rounded-xl bg-card border animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 rounded-xl bg-card border animate-pulse" />
          <div className="h-48 rounded-xl bg-card border animate-pulse" />
        </div>
      </div>
    )
  }

  const s = data || ({} as any)
  const statusCode = s.status?.code || 'draft'
  const statusName = typeof s.status?.name === 'string' ? s.status.name : resolveLocalized(s.status?.name) || statusCode
  const statusColor = (s.status?.color_hex as string) || STATUS_COLORS[statusCode] || '#64748B'
  const payBadge = paymentStatusBadge(s.payment_status)
  const driverList = drivers ?? []
  const fromPreAlert = Boolean(s.pre_alert_id)

  const apiWf = Array.isArray(s.workflow_steps) ? s.workflow_steps : []
  const fallbackSteps = fromPreAlert ? FALLBACK_PREALERT_STEPS : FALLBACK_DIRECT_STEPS
  const stepperSteps: WorkflowStep[] =
    apiWf.length > 0
      ? apiWf.map((ws: { code: string; label: string; date?: string | null }) => {
          const fallback = [...FALLBACK_DIRECT_STEPS, ...FALLBACK_PREALERT_STEPS].find((x) => x.id === ws.code)
          return {
            id: ws.code,
            title: ws.label,
            icon: fallback?.icon,
            description: ws.date
              ? new Date(ws.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
              : undefined,
          }
        })
      : fallbackSteps

  const currentStepId =
    (apiWf.find((x: { current?: boolean }) => x.current) as { code?: string } | undefined)?.code || statusCode
  const completedSteps =
    apiWf.length > 0
      ? apiWf.filter((x: { completed?: boolean }) => x.completed).map((x: { code: string }) => x.code)
      : completedBeforeCurrent(statusCode, fromPreAlert)
  const rejectedStepIds = statusCode === 'cancelled' ? ['cancelled'] : []

  const transitions = Array.isArray(s.available_transitions) ? s.available_transitions : []

  const regroupementRows = consPickerData?.regroupements ?? []

  /**
   * Chauffeur : ramassage (pending_drop_off) ou livraison en cours (transit / arrivée chez le client).
   * Pas à « prêt à l’expédition » : c’est la préparation au hub, avant le dernier kilomètre.
   */
  const showAssignDriver =
    statusCode === 'pending_drop_off' ||
    statusCode === 'in_transit' ||
    statusCode === 'arrived_at_destination'
  const showPaymentButton = s.payment_status !== 'paid'
  const showRegrouper =
    canRegrouper &&
    !s.regroupement_id &&
    statusCode !== 'delivered' &&
    statusCode !== 'cancelled'

  const timelineEvents: TimelineEvent[] = (s.logs || [])
    .slice()
    .sort((a: { created_at?: string }, b: { created_at?: string }) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
    .map((log: any, i: number) => {
      const when = log.created_at ? new Date(log.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''
      const statusLabel = log.status?.name || log.title || 'Mise à jour'
      const by = log.changed_by_name || log.user_name
      const note = log.description || log.note
      const descParts = [when ? `Le ${when}` : '', note ? String(note) : ''].filter(Boolean)
      return {
        id: String(log.id || i),
        title: statusLabel,
        description: descParts.length ? descParts.join(' — ') : undefined,
        date: '',
        actor: by ? `Par ${by}` : undefined,
        type: 'status' as const,
      }
    })

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(s.tracking_number || '')
    toast.success('Numero de suivi copie')
  }

  const handlePrintInvoice = () => {
    if (id) void printApiPdf(`/api/shipments/${id}/pdf/invoice`)
  }

  const handlePrintLabel = () => {
    if (id) void printApiPdf(`/api/shipments/${id}/pdf/label`)
  }

  const handleStatusChange = () => {
    if (!selectedStatusCode) return
    updateStatus.mutate(
      { id: Number(id), status: selectedStatusCode, notes: statusNote || undefined },
      { onSuccess: () => { setStatusDialog(false); setSelectedStatusCode(''); setStatusNote('') } },
    )
  }

  const handleAssignDriver = () => {
    if (!selectedDriverId) return
    assignDriver.mutate(
      { id: Number(id), driver_id: Number(selectedDriverId) },
      { onSuccess: () => { setDriverDialog(false); setSelectedDriverId('') } }
    )
  }

  const handleRecordPayment = () => {
    if (!paymentForm.amount || !paymentForm.method) return
    recordPayment.mutate(
      { id: Number(id), amount: Number(paymentForm.amount), method: paymentForm.method, reference: paymentForm.reference || undefined, note: paymentForm.note || undefined },
      { onSuccess: () => { setPaymentDialog(false); setPaymentForm({ amount: '', method: '', reference: '', note: '' }) } }
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/shipments">
            <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft size={18} /></Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{s.tracking_number || `EXP-${id}`}</h1>
              <Badge className="text-xs font-semibold px-2.5 py-0.5 border" style={{ backgroundColor: statusColor + '20', color: statusColor, borderColor: statusColor + '40' }}>
                {statusName}
              </Badge>
              <Badge className="text-xs font-semibold px-2.5 py-0.5 border" style={payBadge.style}>
                {payBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Creee le {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              {s.shipping_mode && <> &middot; {s.shipping_mode}</>}
              {s.driver && <> &middot; Chauffeur: {displayLocalized(s.driver.name)}</>}
            </p>
            {s.route_display || s.corridor ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-sm text-muted-foreground">Itinéraire</p>
                <div className="shrink-0">
                  <CorridorFlags
                    originIso2={s.corridor?.origin_iso2}
                    destIso2={s.corridor?.dest_iso2}
                    originLabel={s.corridor?.origin_country}
                    destLabel={s.corridor?.dest_country}
                  />
                </div>
                {s.route_display ? (
                  <p className="text-sm leading-relaxed text-foreground/90 break-words">{s.route_display}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyTracking}><Copy size={14} className="mr-1.5" />Copier tracking</Button>
          <Button variant="outline" size="sm" onClick={() => setStatusDialog(true)}><RefreshCw size={14} className="mr-1.5" />Changer statut</Button>
          {showAssignDriver ? (
            <Button variant="outline" size="sm" onClick={() => setDriverDialog(true)}><UserPlus size={14} className="mr-1.5" />Assigner chauffeur</Button>
          ) : null}
          {showPaymentButton ? (
            <Button variant="default" size="sm" onClick={() => setPaymentDialog(true)}>
              <CreditCard size={14} className="mr-1.5" />
              Caisse / paiement
            </Button>
          ) : null}
          {showRegrouper ? (
            <Button variant="outline" size="sm" onClick={() => setConsolidateOpen(true)}>
              <Layers size={14} className="mr-1.5" />
              Regrouper
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal size={16} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (!id) return
                  void downloadApiPdf(
                    `/api/shipments/${id}/pdf/invoice`,
                    `facture-${s.tracking_number || id}.pdf`,
                  )
                }}
              >
                <Download size={14} className="mr-2" />Télécharger facture (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!id) return
                  void downloadApiPdf(
                    `/api/shipments/${id}/pdf/label`,
                    `etiquette-${s.tracking_number || id}.pdf`,
                  )
                }}
              >
                <Download size={14} className="mr-2" />Télécharger étiquette (PDF)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => id && void openApiPdf(`/api/shipments/${id}/pdf/tracking`)}>
                <Download size={14} className="mr-2" />Rapport de suivi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {s.regroupement_id && s.regroupement ? (
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden border-primary/25 bg-primary/[0.04] shadow-sm">
            <CardHeader className="pb-3 space-y-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    Cette expédition fait partie d&apos;un lot (regroupement)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Numéro de lot{' '}
                    <span className="font-mono font-semibold text-foreground">{s.regroupement.batch_number}</span>
                    {typeof s.regroupement.same_lot_count === 'number'
                      ? ` · ${s.regroupement.same_lot_count} colis dans ce lot`
                      : null}
                  </p>
                  {s.regroupement.lot_route ? (
                    <div className="space-y-1.5 pt-1 text-sm">
                      <p className="text-muted-foreground">Corridor agrégé du lot</p>
                      <div className="shrink-0">
                        <LotRouteFlags
                          originIso2s={s.regroupement.lot_route.origin_iso2s}
                          destIso2s={s.regroupement.lot_route.dest_iso2s}
                          label={s.regroupement.lot_route.label ?? undefined}
                        />
                      </div>
                      {s.regroupement.lot_route.label ? (
                        <p className="text-xs leading-relaxed text-muted-foreground break-words">
                          {s.regroupement.lot_route.label}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end shrink-0">
                  {s.regroupement.status ? (
                    <Badge
                      className="text-xs w-fit"
                      style={{
                        backgroundColor: `${s.regroupement.status.color_hex || STATUS_COLORS[s.regroupement.status.code || ''] || '#64748B'}20`,
                        color: s.regroupement.status.color_hex || STATUS_COLORS[s.regroupement.status.code || ''] || '#64748B',
                        borderColor: `${s.regroupement.status.color_hex || STATUS_COLORS[s.regroupement.status.code || ''] || '#64748B'}40`,
                      }}
                    >
                      Lot : {displayLocalized(s.regroupement.status.name)}
                    </Badge>
                  ) : null}
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                    <Link to="/regroupements">Voir tous les regroupements</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            {Array.isArray(s.regroupement.shipments_in_lot) && s.regroupement.shipments_in_lot.length > 0 ? (
              <CardContent className="pt-0">
                <p className="text-xs font-medium text-muted-foreground mb-2">Colis rattachés à ce même lot</p>
                <div className="rounded-lg border bg-background overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/45 text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Colis</th>
                        <th className="px-3 py-2 font-medium whitespace-nowrap">Départ → arrivée</th>
                        <th className="px-3 py-2 font-medium">Statut</th>
                        <th className="px-3 py-2 font-medium text-right">Poids</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.regroupement.shipments_in_lot.map((row: {
                        id: number
                        public_tracking?: string | null
                        recipient_name?: string | null
                        route_display?: string | null
                        corridor?: { origin_iso2?: string | null; dest_iso2?: string | null; origin_country?: string | null; dest_country?: string | null }
                        status?: { code?: string; name?: string; color_hex?: string | null }
                        weight_kg?: number | null
                      }) => {
                        const st = row.status?.code || ''
                        const stColor = row.status?.color_hex || STATUS_COLORS[st] || '#64748B'
                        const isCurrent = row.id === Number(id)
                        return (
                          <tr
                            key={row.id}
                            className={`border-b last:border-0 ${isCurrent ? 'bg-primary/10' : 'hover:bg-muted/25'}`}
                          >
                            <td className="px-3 py-2 align-top">
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                  <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/shipments/${row.id}`}
                                    className="block font-mono text-xs font-medium text-primary hover:underline break-all"
                                  >
                                    {row.public_tracking || `#${row.id}`}
                                  </Link>
                                  {isCurrent ? (
                                    <Badge variant="secondary" className="text-[10px] mt-1 block w-fit">
                                      Vous êtes ici
                                    </Badge>
                                  ) : null}
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {row.recipient_name || '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="flex max-w-[min(100%,14rem)] flex-col gap-1.5">
                                <div className="shrink-0">
                                  <CorridorFlags
                                    originIso2={row.corridor?.origin_iso2}
                                    destIso2={row.corridor?.dest_iso2}
                                  />
                                </div>
                                <span className="text-xs leading-snug text-muted-foreground break-words">
                                  {row.route_display || '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              {row.status ? (
                                <Badge
                                  className="text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: `${stColor}20`,
                                    color: stColor,
                                    borderColor: `${stColor}40`,
                                  }}
                                >
                                  {displayLocalized(row.status.name)}
                                </Badge>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-3 py-2 align-top text-right tabular-nums text-xs">
                              {row.weight_kg != null && row.weight_kg !== undefined
                                ? `${Number(row.weight_kg).toFixed(1)} kg`
                                : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            ) : null}
          </Card>
        </motion.div>
      ) : null}

      {/* Workflow Stepper */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="py-6 px-4 md:px-8">
            <WorkflowStepper
              steps={stepperSteps}
              currentStepId={currentStepId}
              completedStepIds={completedSteps}
              rejectedStepIds={rejectedStepIds}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Info cards grid */}
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><User size={14} className="text-blue-500" /> Expediteur</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <InfoRow icon={User} label="Nom complet" value={resolveLocalized(s.sender_name || s.client?.name) || undefined} />
            <InfoRow icon={Mail} label="Email" value={s.sender_email || s.client?.email} />
            <InfoRow icon={Phone} label="Téléphone" value={s.sender_phone} />
            <InfoRow icon={Phone} label="Téléphone secondaire" value={s.sender_phone_secondary} />
            <InfoRow icon={MapPin} label="Adresse" value={s.sender_address} />
            <InfoRow icon={MapPin} label="Point de repère" value={s.sender_landmark} />
            <InfoRow icon={MapPin} label="Code postal" value={s.sender_zip_code} />
            <InfoRow icon={MapPin} label="Ville" value={resolveLocalized(s.sender_city) || undefined} />
            <InfoRow icon={MapPin} label="Région / État" value={resolveLocalized(s.sender_state) || undefined} />
            <InfoRow icon={MapPin} label="Pays" value={resolveLocalized(s.sender_country) || undefined} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><MapPin size={14} className="text-emerald-500" /> Destinataire</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <InfoRow icon={User} label="Nom complet" value={resolveLocalized(s.recipient_name) || undefined} />
            <InfoRow icon={Mail} label="Email" value={s.recipient_email} />
            <InfoRow icon={Phone} label="Téléphone" value={s.recipient_phone} />
            <InfoRow icon={Phone} label="Téléphone secondaire" value={s.recipient_phone_secondary} />
            <InfoRow icon={MapPin} label="Adresse" value={s.recipient_address} />
            <InfoRow icon={MapPin} label="Point de repère" value={s.recipient_landmark} />
            <InfoRow icon={MapPin} label="Code postal" value={s.recipient_zip_code} />
            <InfoRow icon={MapPin} label="Ville" value={resolveLocalized(s.recipient_city) || undefined} />
            <InfoRow icon={MapPin} label="Région / État" value={resolveLocalized(s.recipient_state) || undefined} />
            <InfoRow icon={MapPin} label="Pays" value={resolveLocalized(s.recipient_country) || undefined} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Package size={14} className="text-amber-500" /> Details expedition</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <InfoRow icon={Truck} label="Mode" value={s.shipping_mode} />
            <InfoRow icon={Package} label="Emballage" value={s.packaging_type} />
            <InfoRow icon={Weight} label="Poids total" value={s.total_weight ? `${s.total_weight} kg` : undefined} />
            <InfoRow icon={Ruler} label="Volume" value={s.total_volume ? `${s.total_volume} cm³` : undefined} />
            <InfoRow icon={DollarSign} label="Valeur declaree" value={s.declared_value ? `${s.declared_value}` : undefined} />
            <InfoRow icon={Calendar} label="Livraison estimee" value={s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString('fr-FR') : undefined} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs : articles, paiements, documents PDF */}
      <motion.div variants={fadeInUp}>
        <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
          <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="items">Articles ({s.items?.length || 0})</TabsTrigger>
            <TabsTrigger value="payments">Paiements ({s.payments?.length || 0})</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="invoice" className="gap-1">
              <FileText size={14} className="shrink-0 opacity-70" />
              Facture
            </TabsTrigger>
            <TabsTrigger value="label" className="gap-1">
              <Tag size={14} className="shrink-0 opacity-70" />
              Étiquette
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {s.items && s.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-left font-medium">Origine</th>
                        <th className="px-4 py-3 text-right font-medium">Qte</th>
                        <th className="px-4 py-3 text-right font-medium">Poids (kg)</th>
                        <th className="px-4 py-3 text-right font-medium">Valeur</th>
                      </tr></thead>
                      <tbody>
                        {s.items.map((item: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {item.origin_country?.name
                                ? `${item.origin_country.name}${item.origin_country.iso2 ? ` (${item.origin_country.iso2})` : ''}`
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{item.weight_kg ?? item.weight ?? '—'}</td>
                            <td className="px-4 py-3 text-right font-medium">{item.value ?? item.declared_value ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package size={40} className="mb-3 opacity-30" /><p className="text-sm">Aucun article enregistre</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardContent className="py-6 space-y-6">
                <div>
                  <p className="text-sm font-medium mb-3">Synthèse</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Sous-total</p>
                      <p className="text-lg font-semibold tabular-nums mt-0.5">
                        {s.subtotal != null ? formatMoney(Number(s.subtotal)) : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Taxes</p>
                      <p className="text-lg font-semibold tabular-nums mt-0.5">
                        {s.tax_total != null ? formatMoney(Number(s.tax_total)) : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-blue-500/5 p-3">
                      <p className="text-xs text-muted-foreground">Total dû</p>
                      <p className="text-lg font-semibold tabular-nums text-blue-700 dark:text-blue-400 mt-0.5">
                        {s.total != null ? formatMoney(Number(s.total)) : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Statut de paiement</p>
                      <Badge className="mt-2 text-xs font-semibold px-2.5 py-0.5 border" style={payBadge.style}>
                        {payBadge.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Déjà payé : </span>
                      <span className="font-semibold tabular-nums text-emerald-600">
                        {formatMoney(Number(s.amount_paid ?? 0))}
                      </span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Solde : </span>
                      <span className={`font-semibold tabular-nums ${(s.balance_due ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {s.balance_due != null ? formatMoney(Number(s.balance_due)) : '—'}
                      </span>
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Historique des paiements</p>
                  {s.payments && s.payments.length > 0 ? (
                    <ul className="space-y-3">
                      {s.payments.map((p: any) => {
                        const methodLabel = paymentMethodDisplayLabel(String(p.method || ''), paymentMethods)
                        return (
                          <li key={p.id} className="rounded-lg border p-4 space-y-2">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-base font-semibold tabular-nums">
                                {formatMoney(Number(p.amount))}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {p.created_at
                                  ? new Date(p.created_at).toLocaleString('fr-FR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                  : '—'}
                              </p>
                            </div>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Mode : </span>
                              <span className="font-medium">{methodLabel}</span>
                            </p>
                            {p.reference ? (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Référence : </span>
                                {p.reference}
                              </p>
                            ) : null}
                            {p.note ? (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Note : </span>
                                {p.note}
                              </p>
                            ) : null}
                            {p.recorded_by ? (
                              <p className="text-xs text-muted-foreground">
                                Enregistré par {p.recorded_by}
                              </p>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  ) : (s.payment_status === 'paid' || s.payment_status === 'partial' || Number(s.amount_paid ?? 0) > 0) ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Paiement reflété sur l&apos;expédition, sans ligne détaillée
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Le solde indique{' '}
                        {formatMoney(Number(s.amount_paid ?? 0))} enregistré
                        {s.paid_at ? (
                          <> (dernière mise à jour : {new Date(s.paid_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })})</>
                        ) : null}
                        . Les prochains encaissements via &laquo; Caisse / paiement &raquo; apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground rounded-lg border border-dashed">
                      <CreditCard size={40} className="mb-3 opacity-30" />
                      <p className="text-sm">Aucun paiement enregistré</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="py-6">
                {timelineEvents.length > 0 ? (
                  <TimelineLog events={timelineEvents} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Calendar size={40} className="mb-3 opacity-30" /><p className="text-sm">Aucun historique disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="mt-4 space-y-3">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handlePrintInvoice}>
                    <Printer size={14} className="mr-1.5" />
                    Imprimer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!!docDownloadKind}
                    onClick={async () => {
                      if (!id) return
                      setDocDownloadKind('invoice')
                      try {
                        await downloadApiPdf(
                          `/api/shipments/${id}/pdf/invoice`,
                          `facture-${s.tracking_number || id}.pdf`
                        )
                      } finally {
                        setDocDownloadKind(null)
                      }
                    }}
                  >
                    {docDownloadKind === 'invoice' ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Download size={14} className="mr-1.5" />
                    )}
                    Télécharger
                  </Button>
                </div>
                <div className="relative min-h-[320px] rounded-lg border bg-muted/10 overflow-hidden">
                  {docFetchState.invoice && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {invoiceHtml ? (
                    <ShipmentDocumentDigitalFrame
                      html={invoiceHtml}
                      title="Aperçu facture"
                      heightClass="h-[min(70vh,720px)] min-h-[320px]"
                      className="border-0 shadow-none rounded-lg"
                    />
                  ) : (
                    !docFetchState.invoice && (
                      <p className="p-8 text-center text-sm text-muted-foreground">
                        Impossible de charger l&apos;aperçu numérique.
                      </p>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="label" className="mt-4 space-y-3">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handlePrintLabel}>
                    <Printer size={14} className="mr-1.5" />
                    Imprimer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!!docDownloadKind}
                    onClick={async () => {
                      if (!id) return
                      setDocDownloadKind('label')
                      try {
                        await downloadApiPdf(
                          `/api/shipments/${id}/pdf/label`,
                          `etiquette-${s.tracking_number || id}.pdf`
                        )
                      } finally {
                        setDocDownloadKind(null)
                      }
                    }}
                  >
                    {docDownloadKind === 'label' ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Download size={14} className="mr-1.5" />
                    )}
                    Télécharger
                  </Button>
                </div>
                <div className="relative min-h-[320px] rounded-lg border bg-muted/10 overflow-hidden">
                  {docFetchState.label && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {labelHtml ? (
                    <ShipmentDocumentDigitalFrame
                      html={labelHtml}
                      title="Aperçu étiquette"
                      heightClass="h-[min(70vh,720px)] min-h-[320px]"
                      className="border-0 shadow-none rounded-lg"
                    />
                  ) : (
                    !docFetchState.label && (
                      <p className="p-8 text-center text-sm text-muted-foreground">
                        Impossible de charger l&apos;aperçu numérique.
                      </p>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription className="sr-only">Mettre à jour le statut de l&apos;expédition.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <Select value={selectedStatusCode} onValueChange={setSelectedStatusCode}>
                <SelectTrigger><SelectValue placeholder="Choisir un statut..." /></SelectTrigger>
                <SelectContent>
                  {transitions.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">Aucune transition disponible</div>
                  ) : (
                    transitions.map((t: { code: string; label: string }) => (
                      <SelectItem key={t.code} value={t.code}>
                        {t.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (optionnelle)</Label>
              <Textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Commentaire..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>Annuler</Button>
            <Button onClick={handleStatusChange} disabled={!selectedStatusCode || transitions.length === 0 || updateStatus.isPending}>
              {updateStatus.isPending ? 'Mise a jour...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un chauffeur</DialogTitle>
            <DialogDescription>
              {statusCode === 'pending_drop_off'
                ? 'Ramassage : chauffeur qui récupère le colis chez l’expéditeur.'
                : 'Livraison : chauffeur qui achemine ou remet le colis au destinataire.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Chauffeur</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger><SelectValue placeholder="Choisir un chauffeur..." /></SelectTrigger>
                <SelectContent>
                  {driverList.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{displayLocalized(d.name)}{d.phone ? ` (${d.phone})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialog(false)}>Annuler</Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriverId || assignDriver.isPending}>
              {assignDriver.isPending ? 'Assignation...' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription className="sr-only">Saisir le montant et le mode de paiement reçu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Montant</Label>
              <Input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} placeholder={`Solde: ${s.balance_due ?? 0}`} />
            </div>
            <div className="space-y-2">
              <Label>Methode de paiement</Label>
              <Select value={paymentForm.method} onValueChange={v => setPaymentForm(p => ({ ...p, method: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {/* Default basic methods if none in database */}
                  {!paymentMethods || paymentMethods.length === 0 ? (
                    <>
                      <SelectItem value="cash">Especes</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="card">Carte bancaire</SelectItem>
                    </>
                  ) : (
                    paymentMethods.filter(m => m.is_active).map(m => (
                      <SelectItem key={m.id} value={m.code || String(m.id)}>
                        {displayLocalized(m.name as unknown)}
                      </SelectItem>
                    ))
                  )}
                  {/* Active and functional online gateways */}
                  {gateways?.wire_transfer?.is_active && (
                    <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  )}
                  {(!paymentMethods || paymentMethods.length === 0) && (
                    <SelectItem value="other">Autre</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference (optionnelle)</Label>
              <Input value={paymentForm.reference} onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))} placeholder="Ref. transaction" />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={paymentForm.note} onChange={e => setPaymentForm(p => ({ ...p, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>Annuler</Button>
            <Button onClick={handleRecordPayment} disabled={!paymentForm.amount || !paymentForm.method || recordPayment.isPending}>
              {recordPayment.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regroupement : nouveau lot ou lot existant (sans quitter la page) */}
      <Dialog open={consolidateOpen} onOpenChange={setConsolidateOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Regrouper cette expédition</DialogTitle>
            <DialogDescription>
              Créez un nouveau lot ou ajoutez ce colis à un lot déjà ouvert. Aucune navigation vers la page Regroupements n’est nécessaire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-1">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Nouveau lot</p>
              <p className="text-xs text-muted-foreground">
                Un numéro de lot (ex. LOT-2604-001) sera généré automatiquement.
              </p>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={createRegroupement.isPending || !id}
                onClick={() => {
                  createRegroupement.mutate(
                    { shipment_ids: [Number(id)] },
                    {
                      onSuccess: () => setConsolidateOpen(false),
                    },
                  )
                }}
              >
                {createRegroupement.isPending ? 'Création…' : 'Créer un nouveau lot avec cette expédition'}
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
              <p className="relative mx-auto w-fit bg-background px-2 text-xs text-muted-foreground text-center">
                Ou ajouter à un lot existant
              </p>
            </div>
            {consPickerLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : regroupementRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun autre lot pour l’instant — utilisez « Nouveau lot » ci-dessus.
              </p>
            ) : (
              <ScrollArea className="h-[min(55vh,420px)] pr-3">
                <div className="space-y-3">
                  {regroupementRows.map((c) => (
                    <Card key={c.id} className="border-border/80">
                      <CardHeader className="space-y-0 py-3 px-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="text-base font-mono tracking-tight">{c.batch_number}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {labelForRegroupementStatus(c.status)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="shrink-0"
                            disabled={attachToRegroupement.isPending || !id}
                            onClick={() => {
                              attachToRegroupement.mutate(
                                { regroupementId: c.id, shipmentId: Number(id) },
                                { onSuccess: () => setConsolidateOpen(false) },
                              )
                            }}
                          >
                            Placer ici
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 pt-0">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Colis dans ce regroupement ({c.shipments?.length ?? 0})
                        </p>
                        {(c.shipments?.length ?? 0) === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Aucun colis (regroupement vide)</p>
                        ) : (
                          <ul className="space-y-1.5 text-sm">
                            {(c.shipments ?? []).map((sh: { id: number; public_tracking?: string | null; recipient_name?: string | null; recipient_profile?: { full_name?: string | null } }) => (
                              <li key={sh.id} className="flex flex-wrap gap-x-2 gap-y-0.5 border-l-2 border-muted pl-2 py-0.5">
                                <span className="font-mono text-xs">{sh.public_tracking || `#${sh.id}`}</span>
                                <span className="text-muted-foreground truncate max-w-[220px]">
                                  {sh.recipient_name ?? sh.recipient_profile?.full_name ?? '—'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConsolidateOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
