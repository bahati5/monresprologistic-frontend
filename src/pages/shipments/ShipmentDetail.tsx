import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { openApiPdf } from '@/lib/openPdf'
import { useShipment, useUpdateShipmentStatus, useAssignDriver, useRecordPayment, useDeliverShipment } from '@/hooks/useShipments'
import { useDrivers } from '@/hooks/useCrm'
import { statusHooks } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { WorkflowStepper, type WorkflowStep } from '@/components/workflow/WorkflowStepper'
import { TimelineLog, type TimelineEvent } from '@/components/workflow/TimelineLog'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { STATUS_COLORS } from '@/lib/animations'
import { displayLocalized, resolveLocalized } from '@/lib/localizedString'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft, Package, MapPin, User, Phone, Mail,
  Calendar, Weight, Ruler, DollarSign, FileText, Truck,
  Copy, Printer, MoreHorizontal, RefreshCw, UserPlus, CreditCard,
  Download, CheckCircle, Tag,
} from 'lucide-react'

const SHIPMENT_STEPS: WorkflowStep[] = [
  { id: 'created', title: 'Creee', icon: FileText },
  { id: 'accepted', title: 'Acceptee', icon: CheckCircle },
  { id: 'preparing', title: 'Preparation', icon: Package },
  { id: 'collected', title: 'Collectee', icon: Truck },
  { id: 'in_transit', title: 'En transit', icon: Truck },
  { id: 'customs', title: 'Douane', icon: Tag },
  { id: 'arrived', title: 'Arrivee', icon: MapPin },
  { id: 'out_for_delivery', title: 'En livraison', icon: Truck },
  { id: 'delivered', title: 'Livree', icon: Package },
]

function getCompletedSteps(currentStatusCode: string): string[] {
  const stepOrder = SHIPMENT_STEPS.map((s) => s.id)
  const idx = stepOrder.indexOf(currentStatusCode)
  if (idx <= 0) return []
  return stepOrder.slice(0, idx)
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
  const { data, isLoading } = useShipment(id)
  const updateStatus = useUpdateShipmentStatus()
  const assignDriver = useAssignDriver()
  const recordPayment = useRecordPayment()
  const deliverShipment = useDeliverShipment()
  const { data: drivers } = useDrivers()
  const { data: allStatuses } = statusHooks.useList()

  const [statusDialog, setStatusDialog] = useState(false)
  const [driverDialog, setDriverDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: '', reference: '', note: '' })

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

  const s = data || {} as any
  const statusCode = s.status?.code || 'created'
  const statusName = resolveLocalized(s.status?.name) || statusCode
  const statusColor = STATUS_COLORS[statusCode] || '#64748B'
  const completedSteps = getCompletedSteps(statusCode)
  const shipmentStatuses = (allStatuses || []).filter((st: any) => st.entity_type === 'shipment')
  const driverList = Array.isArray(drivers) ? drivers : (drivers as any)?.data || []

  const timelineEvents: TimelineEvent[] = (s.logs || []).map((log: any, i: number) => ({
    id: String(log.id || i),
    title: resolveLocalized(log.status?.name) || resolveLocalized(log.title) || 'Mise a jour',
    description: log.note || undefined,
    date: log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : '',
    actor: log.user_name || undefined,
    type: 'status' as const,
  }))

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(s.tracking_number || '')
    toast.success('Numero de suivi copie')
  }

  const handlePrintInvoice = () => {
    if (id) void openApiPdf(`/api/shipments/${id}/pdf/invoice`)
  }

  const handlePrintLabel = () => {
    if (id) void openApiPdf(`/api/shipments/${id}/pdf/label`)
  }

  const handleStatusChange = () => {
    if (!selectedStatusId) return
    updateStatus.mutate(
      { id: Number(id), status_id: Number(selectedStatusId), note: statusNote || undefined },
      { onSuccess: () => { setStatusDialog(false); setSelectedStatusId(''); setStatusNote('') } }
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
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{s.tracking_number || `EXP-${id}`}</h1>
              <Badge className="text-xs font-semibold px-2.5 py-0.5" style={{ backgroundColor: statusColor + '20', color: statusColor, borderColor: statusColor + '40' }}>
                {statusName}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Creee le {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              {s.shipping_mode && <> &middot; {s.shipping_mode}</>}
              {s.driver && <> &middot; Chauffeur: {displayLocalized(s.driver.name)}</>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyTracking}><Copy size={14} className="mr-1.5" />Copier tracking</Button>
          <Button variant="outline" size="sm" onClick={() => setStatusDialog(true)}><RefreshCw size={14} className="mr-1.5" />Changer statut</Button>
          <Button variant="outline" size="sm" onClick={() => setDriverDialog(true)}><UserPlus size={14} className="mr-1.5" />Assigner chauffeur</Button>
          <Button variant="outline" size="sm" onClick={() => setPaymentDialog(true)}><CreditCard size={14} className="mr-1.5" />Paiement</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal size={16} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrintInvoice}><FileText size={14} className="mr-2" />PDF Facture</DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintLabel}><Printer size={14} className="mr-2" />PDF Etiquette</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => id && void openApiPdf(`/api/shipments/${id}/pdf/tracking`)}>
                <Download size={14} className="mr-2" />Rapport de suivi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Workflow Stepper */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="py-6 px-4 md:px-8">
            <WorkflowStepper steps={SHIPMENT_STEPS} currentStepId={statusCode} completedStepIds={completedSteps} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Info cards grid */}
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><User size={14} className="text-blue-500" /> Expediteur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={User} label="Nom" value={resolveLocalized(s.sender_name || s.client?.name) || undefined} />
            <InfoRow icon={Mail} label="Email" value={s.sender_email || s.client?.email} />
            <InfoRow icon={Phone} label="Telephone" value={s.sender_phone} />
            <InfoRow icon={MapPin} label="Adresse" value={[s.sender_address, s.sender_city, s.sender_country].filter(Boolean).join(', ')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><MapPin size={14} className="text-emerald-500" /> Destinataire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={User} label="Nom" value={s.recipient_name} />
            <InfoRow icon={Mail} label="Email" value={s.recipient_email} />
            <InfoRow icon={Phone} label="Telephone" value={s.recipient_phone} />
            <InfoRow icon={MapPin} label="Adresse" value={[s.recipient_address, s.recipient_city, s.recipient_country].filter(Boolean).join(', ')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Package size={14} className="text-amber-500" /> Details expedition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={Truck} label="Mode" value={s.shipping_mode} />
            <InfoRow icon={Package} label="Emballage" value={s.packaging_type} />
            <InfoRow icon={Weight} label="Poids total" value={s.total_weight ? `${s.total_weight} kg` : undefined} />
            <InfoRow icon={Ruler} label="Volume" value={s.total_volume ? `${s.total_volume} cm³` : undefined} />
            <InfoRow icon={DollarSign} label="Valeur declaree" value={s.declared_value ? `${s.declared_value}` : undefined} />
            <InfoRow icon={Calendar} label="Livraison estimee" value={s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString('fr-FR') : undefined} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="items" className="w-full">
          <TabsList>
            <TabsTrigger value="items">Articles ({s.items?.length || 0})</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="payments">Paiements ({s.payments?.length || 0})</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {s.items && s.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-right font-medium">Qte</th>
                        <th className="px-4 py-3 text-right font-medium">Poids (kg)</th>
                        <th className="px-4 py-3 text-right font-medium">Valeur</th>
                      </tr></thead>
                      <tbody>
                        {s.items.map((item: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{item.weight ?? '-'}</td>
                            <td className="px-4 py-3 text-right font-medium">{item.declared_value ?? '-'}</td>
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

          <TabsContent value="finance" className="mt-4">
            <Card>
              <CardContent className="py-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Sous-total</p>
                    <p className="text-xl font-bold mt-1">{s.subtotal ?? '-'}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Taxes</p>
                    <p className="text-xl font-bold mt-1">{s.tax_total ?? '-'}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold mt-1 text-blue-600">{s.total ?? '-'}</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                    <p className="text-xs text-muted-foreground">Solde du</p>
                    <p className={`text-xl font-bold mt-1 ${(s.balance_due || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {s.balance_due ?? '-'}
                    </p>
                  </div>
                </div>
                {s.charges && s.charges.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Details des frais</p>
                    <div className="space-y-1">
                      {s.charges.map((c: any) => (
                        <div key={c.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                          <span className="text-muted-foreground">{c.label} <Badge variant="outline" className="text-xs ml-1">{c.type}</Badge></span>
                          <span className="font-medium">{c.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardContent className="py-6">
                {s.payments && s.payments.length > 0 ? (
                  <div className="space-y-2">
                    {s.payments.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium">{p.amount} — {p.method}</p>
                          <p className="text-xs text-muted-foreground">{p.reference && `Ref: ${p.reference} — `}{new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t text-sm">
                      <span className="font-medium">Total paye</span>
                      <span className="font-bold text-emerald-600">{s.amount_paid ?? 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CreditCard size={40} className="mb-3 opacity-30" /><p className="text-sm">Aucun paiement enregistre</p>
                  </div>
                )}
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
        </Tabs>
      </motion.div>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Changer le statut</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <Select value={selectedStatusId} onValueChange={setSelectedStatusId}>
                <SelectTrigger><SelectValue placeholder="Choisir un statut..." /></SelectTrigger>
                <SelectContent>
                  {shipmentStatuses.map((st: any) => (
                    <SelectItem key={st.id} value={String(st.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: st.color }} />
                        {displayLocalized(st.name)}
                      </div>
                    </SelectItem>
                  ))}
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
            <Button onClick={handleStatusChange} disabled={!selectedStatusId || updateStatus.isPending}>
              {updateStatus.isPending ? 'Mise a jour...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assigner un chauffeur</DialogTitle></DialogHeader>
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
          <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
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
                  <SelectItem value="cash">Especes</SelectItem>
                  <SelectItem value="bank_transfer">Virement</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="wallet">Portefeuille</SelectItem>
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
    </motion.div>
  )
}
