import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileText, ImageIcon, Loader2, Package, Upload, X } from 'lucide-react'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AdminShoppingQuoteView } from '@/components/shopping/AdminShoppingQuoteView'
import { usePublicBranding } from '@/hooks/useSettings'
import {
  buildQuoteLines,
  buildShoppingQuoteClient,
  computeReadonlyQuoteDetails,
  parseBankFeePercentage,
  purchaseStatusCode,
} from '@/lib/assistedPurchaseQuote'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'

const STAFF_ROLES = ['super_admin', 'agency_admin', 'operator'] as const

function clientQuoteHint(statusCode: string): string | undefined {
  switch (statusCode) {
    case 'awaiting_payment':
      return 'Utilisez les moyens de paiement indiqués ci-dessous. Après votre règlement, vous pouvez nous prévenir pour accélérer la validation côté équipe.'
    case 'paid':
      return 'Votre paiement est validé. Notre équipe passe ou a passé la commande chez le fournisseur.'
    case 'ordered':
      return 'Les articles ont été commandés. Vous serez informé lors de l’arrivée à l’entrepôt.'
    case 'arrived_at_hub':
      return 'Votre colis est arrivé à l’entrepôt. Suivez les prochaines étapes depuis votre tableau de bord.'
    case 'converted_to_shipment':
      return 'Cet achat a été converti en dossier d’expédition. Consultez vos expéditions pour le suivi.'
    default:
      return undefined
  }
}

export default function ClientAssistedPurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { data: branding } = usePublicBranding()
  const appCurrency = branding?.currency?.trim() ? branding.currency.trim() : 'EUR'
  const navigate = useNavigate()
  const [ackMessage, setAckMessage] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isStaff = Boolean(user?.roles?.some((r) => STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number])))

  const { data, isLoading, isError } = useQuery({
    queryKey: ['assisted-purchase', id],
    queryFn: () => api.get<{ purchase: Record<string, unknown> }>(`/api/assisted-purchases/${id}`).then((r) => r.data),
    enabled: Boolean(id) && !isStaff,
  })

  const ackMutation = useMutation({
    mutationFn: ({ message, file }: { message: string | null; file: File | null }) => {
      const formData = new FormData()
      if (message && message.trim() !== '') formData.append('message', message.trim())
      if (file) formData.append('payment_proof', file)
      return api.post(`/api/assisted-purchases/${id}/client-payment-ack`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (res) => {
      toast.success(
        (res.data as { message?: string })?.message ??
          'Merci. Notre équipe a été prévenue et validera votre paiement sous peu.',
      )
      setAckMessage('')
      setProofFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      void queryClient.invalidateQueries({ queryKey: ['assisted-purchase', id] })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible d’envoyer la confirmation.'))
    },
  })

  if (isStaff && id) {
    return <Navigate to={`/purchase-orders/${id}/chiffrage`} replace />
  }

  if (!id) {
    return <Navigate to="/purchase-orders" replace />
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        Chargement du devis…
      </div>
    )
  }

  if (isError || !data?.purchase) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Demande introuvable ou accès refusé.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/purchase-orders">Retour à la liste</Link>
        </Button>
      </div>
    )
  }

  const p = data.purchase
  const statusCode = purchaseStatusCode(p)
  const statusLabel =
    typeof p.status_label === 'string' && p.status_label.trim()
      ? p.status_label
      : statusCode
  const toneClassName = typeof p.status_color === 'string' ? p.status_color : undefined

  if (statusCode === 'cancelled') {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link to="/purchase-orders">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Demande annulée</AlertTitle>
          <AlertDescription>Cette demande d’achat assisté n’est plus active.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (statusCode === 'pending_quote') {
    const rawItems = p.items as
      | {
          url?: string
          name?: string
          display_label?: string
          quantity?: number
          merchant?: { logo_url?: string | null; name?: string | null }
        }[]
      | undefined
    const rows =
      Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.map((it, i) => ({
            key: String(it.url ?? i),
            label:
              (typeof it.display_label === 'string' && it.display_label.trim()) ||
              (typeof it.name === 'string' && it.name.trim()) ||
              'Article',
            url: typeof it.url === 'string' ? it.url : '',
            qty: typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 1,
            merchant: it.merchant,
          }))
        : [
            {
              key: 'legacy',
              label:
                typeof p.article_label === 'string' && p.article_label.trim()
                  ? p.article_label.trim()
                  : 'Article',
              url: String(p.product_url ?? ''),
              qty: typeof p.quantity === 'number' ? p.quantity : Number(p.quantity) || 1,
              merchant: undefined as { logo_url?: string | null; name?: string | null } | undefined,
            },
          ]

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link to="/purchase-orders">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour
            </Link>
          </Button>
        </div>
        <Alert>
          <AlertTitle>Chiffrage en cours</AlertTitle>
          <AlertDescription>
            Notre équipe établit votre devis à partir des liens et quantités fournis. Vous recevrez un e-mail et une
            notification dès qu’il sera disponible.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Articles demandés</CardTitle>
            <CardDescription>Récapitulatif de votre demande</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <MerchantLogoBadge
                    size="lg"
                    logoUrl={row.merchant?.logo_url}
                    merchantName={row.merchant?.name}
                  />
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">{row.label}</p>
                    <p className="text-sm text-muted-foreground">Quantité : {row.qty}</p>
                  </div>
                </div>
                {row.url ? (
                  <Button variant="outline" size="sm" className="shrink-0 self-start" asChild>
                    <a href={row.url} target="_blank" rel="noopener noreferrer">
                      Voir le lien
                    </a>
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = false
  const displayCurrency =
    typeof p.quote_currency === 'string' && p.quote_currency.trim() !== ''
      ? p.quote_currency.trim()
      : appCurrency
  const totalField = p.total_amount ?? p.quote_amount
  const quoteNum =
    totalField != null && totalField !== '' ? Number(totalField) : NaN
  const hint = clientQuoteHint(statusCode)
  const readonlyFinancial =
    Number.isFinite(quoteNum)
      ? {
          total: quoteNum,
          ...(hint ? { hint } : {}),
        }
      : null

  const lines = buildQuoteLines(p, canEdit, quoteNum)
  const initialBankPct = parseBankFeePercentage(p)
  const initialPaymentNote =
    typeof p.payment_methods_note === 'string' && p.payment_methods_note.trim() !== ''
      ? p.payment_methods_note.trim()
      : null
  const readonlyDetails = computeReadonlyQuoteDetails(p)

  const convertedShipmentId =
    p.converted_shipment_id != null ? Number(p.converted_shipment_id) : null
  const existingProofUrl =
    typeof p.payment_proof_url === 'string' && p.payment_proof_url.trim() !== ''
      ? p.payment_proof_url.trim()
      : null

  return (
    <div className="space-y-6">
      {statusCode === 'converted_to_shipment' && convertedShipmentId != null ? (
        <Card className="overflow-hidden rounded-2xl border-2 border-emerald-300/70 bg-gradient-to-br from-emerald-50/90 to-background shadow-lg dark:border-emerald-500/30 dark:from-emerald-950/30">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                Votre achat a été converti en expédition
              </h2>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/70">
                Votre colis est en cours de traitement logistique. Suivez-le depuis votre espace Expéditions.
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
              onClick={() => navigate(`/shipments/${convertedShipmentId}`)}
            >
              <Package className="h-5 w-5" aria-hidden />
              Voir l'expédition #{convertedShipmentId}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <AdminShoppingQuoteView
        key={String(p.id)}
        requestId={String(p.id)}
        pageHeading={`Votre devis — demande n°${p.id}`}
        pageSubheading="Consultez le détail des montants et les instructions de paiement communiquées par notre équipe."
        clientSectionTitle="Votre compte"
        status={{ code: statusCode, label: statusLabel, toneClassName }}
        client={buildShoppingQuoteClient(p)}
        lines={lines}
        currency={displayCurrency}
        canEdit={canEdit}
        readonlyFinancialSummary={readonlyFinancial}
        readonlyQuoteDetails={readonlyDetails}
        initialBankFeePercentage={initialBankPct}
        initialPaymentMethodsNote={initialPaymentNote}
        headerActions={
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link to="/purchase-orders">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour
            </Link>
          </Button>
        }
      />

      {statusCode === 'awaiting_payment' ? (
        <Card className="border-primary/25 bg-gradient-to-br from-card to-primary/[0.06] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Étape suivante : paiement</CardTitle>
            <CardDescription>
              Après avoir effectué le virement ou le paiement mobile selon les indications ci-dessus, vous pouvez nous
              prévenir ici. Notre équipe vérifiera la réception puis validera votre dossier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pay-ack-msg">Message optionnel (référence de transaction, montant, etc.)</Label>
              <Textarea
                id="pay-ack-msg"
                rows={3}
                value={ackMessage}
                onChange={(e) => setAckMessage(e.target.value)}
                placeholder="Ex. MPESA ref. ABC123, payé le…"
                disabled={ackMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-proof-file">Preuve de paiement (capture d'écran ou PDF)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={ackMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  {proofFile ? 'Changer le fichier' : 'Joindre un fichier'}
                </Button>
                <input
                  ref={fileInputRef}
                  id="pay-proof-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    if (f && f.size > 5 * 1024 * 1024) {
                      toast.error('Le fichier ne doit pas dépasser 5 Mo.')
                      e.target.value = ''
                      return
                    }
                    setProofFile(f)
                  }}
                />
                {proofFile ? (
                  <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-sm">
                    {proofFile.type.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                    )}
                    <span className="max-w-[200px] truncate">{proofFile.name}</span>
                    <button
                      type="button"
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setProofFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Formats acceptés : JPG, PNG, WebP, PDF — max 5 Mo</p>
            </div>

            {existingProofUrl ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-4 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <span className="text-sm text-emerald-800 dark:text-emerald-200">Preuve déjà téléversée</span>
                <a
                  href={existingProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Télécharger
                </a>
              </div>
            ) : null}

            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={ackMutation.isPending}
              onClick={() => void ackMutation.mutateAsync({ message: ackMessage, file: proofFile })}
            >
              {ackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Envoi…
                </>
              ) : (
                'J’ai effectué le paiement — prévenir l’équipe'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
