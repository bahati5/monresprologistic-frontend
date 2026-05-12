import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Clock, Send, StickyNote, UserCheck, AlertTriangle, CheckCircle2,
  XCircle, ArrowUpCircle, RefreshCw, FileText, Package, CreditCard, ShieldAlert,
  Eye, Phone,
} from 'lucide-react'
import { useSavTicket, useReplySavTicket, useAssignSavTicket, useUpdateSavTicketStatus, useUpdateSavTicket, useSavQuickReplies } from '@/hooks/useSav'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { getSavBasePath, isPortalClientUser } from '@/lib/savPortalPaths'

const CATEGORY_ACTIONS: Record<string, Array<{ label: string; icon: typeof Package; href?: string; color: string }>> = {
  LOST_DAMAGED: [
    { label: 'Créer remboursement', icon: CreditCard, href: '/finance/refunds', color: 'text-emerald-700' },
    { label: 'Ouvrir réclamation assurance', icon: ShieldAlert, color: 'text-amber-700' },
    { label: 'Déclarer sinistre', icon: FileText, color: 'text-red-700' },
  ],
  DELIVERY_DELAY: [
    { label: 'Voir le tracking', icon: Eye, color: 'text-blue-700' },
    { label: 'Contacter hub', icon: Phone, color: 'text-purple-700' },
    { label: 'Mettre à jour ETA', icon: Clock, color: 'text-amber-700' },
  ],
  REFUND_ISSUE: [
    { label: 'Créer/voir remboursement', icon: CreditCard, href: '/finance/refunds', color: 'text-emerald-700' },
    { label: 'Voir le paiement original', icon: FileText, color: 'text-blue-700' },
  ],
  PAYMENT_ISSUE: [
    { label: 'Voir les transactions', icon: CreditCard, href: '/finance/payment-proofs', color: 'text-blue-700' },
    { label: 'Valider manuellement', icon: CheckCircle2, color: 'text-emerald-700' },
  ],
  CUSTOMS_ISSUE: [
    { label: 'Demander documents', icon: FileText, color: 'text-amber-700' },
    { label: 'Contacter transitaire', icon: Phone, color: 'text-purple-700' },
  ],
  NON_CONFORMING: [
    { label: 'Créer retour fournisseur', icon: RefreshCw, color: 'text-amber-700' },
    { label: 'Créer remboursement partiel', icon: CreditCard, href: '/finance/refunds', color: 'text-emerald-700' },
  ],
}

export default function SavTicketDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const savBase = getSavBasePath(user)
  const isPortalClient = isPortalClientUser(user)

  const { data, isLoading } = useSavTicket(uuid ?? '')
  const replyMut = useReplySavTicket()
  const assignMut = useAssignSavTicket()
  const statusMut = useUpdateSavTicketStatus()
  const updateMut = useUpdateSavTicket()
  const { data: qrData } = useSavQuickReplies()

  const [replyText, setReplyText] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  const ticket = data?.ticket
  const quickReplies = qrData?.quick_replies ?? []

  if (isLoading) {
    return <div className="space-y-4"><div className="h-10 w-48 bg-muted rounded animate-pulse" /><div className="h-96 bg-muted rounded-xl animate-pulse" /></div>
  }

  if (!ticket) {
    return <div className="text-center py-12 text-muted-foreground">Ticket non trouvé</div>
  }

  const handleReply = () => {
    if (!replyText.trim() || !uuid) return
    replyMut.mutate({ uuid, body: replyText, is_internal: isInternal }, {
      onSuccess: () => setReplyText(''),
    })
  }

  const handleAssignToMe = () => {
    if (!uuid) return
    assignMut.mutate({ uuid })
  }

  const handleStatusChange = (status: string) => {
    if (!uuid) return
    statusMut.mutate({ uuid, status })
  }

  const handlePriorityChange = (priority: string) => {
    if (!uuid) return
    updateMut.mutate({ uuid, priority })
  }

  const handleCategoryChange = (category: string) => {
    if (!uuid) return
    updateMut.mutate({ uuid, category })
  }

  const applyQuickReply = (body: string) => {
    let processed = body
    if (ticket.client) {
      processed = processed.replace(/\{\{prenom\}\}/g, ticket.client.name?.split(' ')[0] ?? '')
    }
    processed = processed.replace(/\{\{reference\}\}/g, ticket.reference_code)
    processed = processed.replace(/\{\{agent\}\}/g, user?.name ?? '')
    processed = processed.replace(/\{\{date\}\}/g, new Date().toLocaleDateString('fr-FR'))
    setReplyText(processed)
  }

  const slaRemaining = ticket.sla_remaining_minutes
  const slaColor = slaRemaining === null ? '' : slaRemaining <= 0 ? 'text-red-600' : slaRemaining < 60 ? 'text-orange-500' : 'text-emerald-600'
  const contextualActions = CATEGORY_ACTIONS[ticket.category] ?? []

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(savBase)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{ticket.reference_code}</h1>
            <Badge className={ticket.priority_color}>{ticket.priority_label}</Badge>
            <Badge className={ticket.status_color}>{ticket.status_label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{ticket.category_label} · {ticket.subject}</p>
        </div>
        {!isPortalClient && !ticket.assigned_to && (
          <Button onClick={handleAssignToMe} disabled={assignMut.isPending}>
            <UserCheck className="mr-2 h-4 w-4" /> M'assigner
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel — Info */}
        <motion.div variants={fadeInUp} className="space-y-4">
          {/* Informations */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Client</span>
                <p className="font-medium">{ticket.client?.name ?? 'Non identifié'}</p>
                {ticket.client?.phone && <p className="text-xs text-muted-foreground">{ticket.client.phone}</p>}
                {ticket.client?.id && !isPortalClient && (
                  <Link to={`/clients/${ticket.client.id}`} className="text-xs text-primary hover:underline">
                    Voir profil
                  </Link>
                )}
              </div>

              {ticket.related_type && (
                <div>
                  <span className="text-muted-foreground">Dossier lié</span>
                  <p className="font-medium font-mono">{ticket.related_type?.split('\\').pop()} #{ticket.related_id}</p>
                  {ticket.related_id && (
                    <Link to={`/shipments/${ticket.related_id}`} className="text-xs text-primary hover:underline">
                      Voir dossier
                    </Link>
                  )}
                </div>
              )}

              <div>
                <span className="text-muted-foreground">SLA</span>
                <p className={`font-medium flex items-center gap-1 ${slaColor}`}>
                  <Clock className="h-3.5 w-3.5" />
                  {slaRemaining === null ? 'Suspendu' : slaRemaining <= 0 ? 'Dépassé' : `${Math.floor(slaRemaining / 60)}h${String(slaRemaining % 60).padStart(2, '0')} restant`}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">Assigné à</span>
                <p className="font-medium">{ticket.assignee?.name ?? 'Non assigné'}</p>
              </div>

              <div>
                <span className="text-muted-foreground">Priorité</span>
                {isPortalClient ? (
                  <p className="font-medium text-sm mt-1">{ticket.priority_label}</p>
                ) : (
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
                )}
              </div>

              <div>
                <span className="text-muted-foreground">Catégorie</span>
                {isPortalClient ? (
                  <p className="font-medium text-sm mt-1">{ticket.category_label}</p>
                ) : (
                <Select value={ticket.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOST_DAMAGED">Colis perdu/endommagé</SelectItem>
                    <SelectItem value="DELIVERY_DELAY">Retard livraison</SelectItem>
                    <SelectItem value="NON_CONFORMING">Article non conforme</SelectItem>
                    <SelectItem value="REFUND_ISSUE">Remboursement</SelectItem>
                    <SelectItem value="PAYMENT_ISSUE">Problème paiement</SelectItem>
                    <SelectItem value="CUSTOMS_ISSUE">Réclamation douane</SelectItem>
                    <SelectItem value="CLIENT_UNREACHABLE">Client injoignable</SelectItem>
                    <SelectItem value="GENERAL_QUESTION">Question générale</SelectItem>
                    <SelectItem value="ACCOUNT_ISSUE">Problème de compte</SelectItem>
                    <SelectItem value="QUOTE_REQUEST">Demande de devis</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
                )}
              </div>

              <div>
                <span className="text-muted-foreground">Canal</span>
                <p className="font-medium capitalize">{ticket.channel}</p>
              </div>

              <div>
                <span className="text-muted-foreground">Créé le</span>
                <p className="font-medium">{new Date(ticket.created_at).toLocaleString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions contextuelles (PRD 5.4) — staff */}
          {!isPortalClient && contextualActions.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Actions liées</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {contextualActions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className={`w-full justify-start ${action.color}`}
                    asChild={!!action.href}
                    onClick={action.href ? undefined : () => {}}
                  >
                    {action.href ? (
                      <Link to={action.href}>
                        <action.icon className="mr-2 h-4 w-4" /> {action.label}
                      </Link>
                    ) : (
                      <span className="flex items-center">
                        <action.icon className="mr-2 h-4 w-4" /> {action.label}
                      </span>
                    )}
                  </Button>
                ))}
                {ticket.related_id && (
                  <Button variant="outline" className="w-full justify-start text-blue-700" asChild>
                    <Link to={`/shipments/${ticket.related_id}`}>
                      <Eye className="mr-2 h-4 w-4" /> Voir l'expédition
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {isPortalClient && ticket.related_id && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Dossier lié</CardTitle></CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-start text-blue-700" asChild>
                  <Link to={`/shipments/${ticket.related_id}`}>
                    <Eye className="mr-2 h-4 w-4" /> Voir mon expédition
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions sur le ticket — staff uniquement */}
          {!isPortalClient && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Actions sur ce ticket</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
                <Button variant="outline" className="w-full justify-start text-emerald-700" onClick={() => handleStatusChange('resolved')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Marquer résolu
                </Button>
              )}
              {ticket.status !== 'escalated' && ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
                <Button variant="outline" className="w-full justify-start text-orange-700" onClick={() => handleStatusChange('escalated')}>
                  <ArrowUpCircle className="mr-2 h-4 w-4" /> Escalader
                </Button>
              )}
              {ticket.status !== 'cancelled' && ticket.status !== 'closed' && (
                <Button variant="outline" className="w-full justify-start text-red-700" onClick={() => handleStatusChange('cancelled')}>
                  <XCircle className="mr-2 h-4 w-4" /> Annuler
                </Button>
              )}
            </CardContent>
          </Card>
          )}
        </motion.div>

        {/* Right panel — Conversation */}
        <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-4">
          <Card className="flex flex-col" style={{ minHeight: 500 }}>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[500px]">
              {(ticket.messages ?? []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun message</p>
              ) : (
                ticket.messages!.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_internal ? 'justify-center' : msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    {msg.is_internal ? (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-2 max-w-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                          <StickyNote className="h-3 w-3 text-amber-600" />
                          <span className="text-[10px] font-semibold text-amber-700 uppercase">Note interne</span>
                          <span className="text-[10px] text-amber-600">{msg.user?.name} · {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    ) : (
                      <div className={`rounded-xl px-4 py-3 max-w-lg ${msg.user_id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-semibold opacity-70">{msg.user?.name}</span>
                          <span className="text-[10px] opacity-50">{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>

            <div className="border-t p-4 space-y-3">
              {!isPortalClient && quickReplies.length > 0 && (
                <Select onValueChange={val => { const qr = quickReplies.find(r => String(r.id) === val); if (qr) applyQuickReply(qr.body) }}>
                  <SelectTrigger className="w-full max-w-xs h-8 text-xs">
                    <SelectValue placeholder="Réponses rapides..." />
                  </SelectTrigger>
                  <SelectContent>
                    {quickReplies.map(qr => (
                      <SelectItem key={qr.id} value={String(qr.id)} className="text-xs">{qr.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Textarea
                placeholder="Rédigez votre réponse..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={3}
              />

              <div className={`flex items-center ${isPortalClient ? 'justify-end' : 'justify-between'}`}>
                {!isPortalClient && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
                  <StickyNote className="h-3.5 w-3.5" /> Note interne
                </label>
                )}
                <Button onClick={handleReply} disabled={!replyText.trim() || replyMut.isPending} size="sm">
                  <Send className="mr-2 h-3.5 w-3.5" /> {isInternal && !isPortalClient ? 'Ajouter note' : 'Envoyer'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
