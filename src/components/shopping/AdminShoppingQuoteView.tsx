import { useMemo, useState, useCallback, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ExternalLink,
  Send,
  Mail,
  User,
  Calculator,
  Eye,
  Phone,
  MapPin,
  Hash,
  Landmark,
  ShoppingBag,
  RefreshCw,
  CircleCheck,
  Package,
  ArrowRight,
} from 'lucide-react'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiErrors'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFormatMoney } from '@/hooks/useSettings'
import { resolveMoneySymbol } from '@/lib/formatCurrency'

/** Ligne d’article à chiffrer (souvent une ligne `assisted_purchases`). */
export type AdminQuoteLine = {
  id: string | number
  articleLabel: string
  /** Texte libre : taille, couleur, notes (affiché sous le nom). */
  optionsLabel?: string | null
  productUrl: string
  quantity: number
  /** Valeur initiale du champ prix unitaire (affichage). */
  initialUnitPrice?: number | null
  /** Marchand lié (logo + nom côté admin). */
  merchant?: {
    id?: number
    name?: string | null
    logo_url?: string | null
  } | null
}

export type AdminQuoteStatus = {
  code: string
  label: string
  /** Classes Tailwind complètes, ex. renvoyées par l’API (`status_color`). */
  toneClassName?: string | null
}

export const DEFAULT_PAYMENT_METHODS_NOTE =
  'Moyens de paiement acceptés : MPESA - ORANGE MONEY - AIRTEL MONEY - AFRIMONEY'

export type AdminShoppingQuotePayload = {
  subtotal: number
  serviceFee: number
  bankFeePercentage: number
  bankFeeAmount: number
  paymentMethodsNote: string
  total: number
  lines: { id: string | number; unitPrice: number; lineTotal: number }[]
}

export type ReadonlyQuoteFinancialDetails = {
  subtotal: number
  serviceFee: number
  bankFeeAmount: number
  bankFeePercentage: number
  paymentMethodsNote?: string | null
  total: number
}

/** Corps JSON pour l’aperçu e-mail (aligné sur POST quote / quote-preview). */
export type AssistedQuotePreviewBody = {
  items: { id: number; unit_price: number }[]
  service_fee: number
  bank_fee_percentage: number
  payment_methods_note: string | null
}

/** Infos client affichées sur l’écran de chiffrage (aligné carte « Client »). */
export type ShoppingQuoteClientDetail = {
  name: string
  email?: string | null
  phone?: string | null
  phoneSecondary?: string | null
  lockerNumber?: string | null
  addressLine?: string | null
  landmark?: string | null
  cityLine?: string | null
  state?: string | null
  country?: string | null
}

export type AdminShoppingQuoteViewProps = {
  /** Affiché dans le titre, ex. demande #42 ou groupe. */
  requestId: string | number
  status: AdminQuoteStatus
  client: ShoppingQuoteClientDetail
  lines: AdminQuoteLine[]
  currency?: string
  /** Libellé monétaire affiché (symbole ou code). */
  currencyDisplay?: string
  /** Si false, masque les entrées et le bouton d’envoi (ex. devis déjà envoyé). */
  canEdit?: boolean
  isSending?: boolean
  onSendQuote?: (payload: AdminShoppingQuotePayload) => void | Promise<void>
  /** Aperçu HTML du mail de devis (sans enregistrer). */
  onRequestEmailPreview?: (body: AssistedQuotePreviewBody) => Promise<string>
  /** Barre d’actions optionnelle (retour liste, etc.). */
  headerActions?: ReactNode
  /** Hors édition : affiche un encadré récapitulatif (ex. devis déjà envoyé). */
  readonlyFinancialSummary?: { total: number; hint?: string } | null
  /** Pré-remplissage du % frais bancaires (défaut 3). */
  initialBankFeePercentage?: number
  /** Pré-remplissage du texte moyens de paiement. */
  initialPaymentMethodsNote?: string | null
  /** Détail financier en lecture seule (devis déjà envoyé). */
  readonlyQuoteDetails?: ReadonlyQuoteFinancialDetails | null
  /**
   * Après paiement client : passage à « commandé fournisseur » + suivi marchand.
   * Affiché uniquement si `status.code === 'paid'`.
   */
  markOrderedAction?: {
    onSubmit: (supplierTrackingNumber: string | null) => void | Promise<void>
    isSubmitting: boolean
  } | null
  /** Si statut `ordered`, affiche le suivi enregistré (lecture seule). */
  orderedSupplierTracking?: string | null
  /** Titre de page (défaut : chiffrage équipe). */
  pageHeading?: string
  /** Sous-titre sous le titre (défaut : texte équipe chiffrage). */
  pageSubheading?: string
  /** Renvoyer le devis au client (e-mail + notification). */
  resendQuoteAction?: {
    onResend: () => void | Promise<void>
    isPending: boolean
  } | null
  /** Valider le paiement reçu (statut « Devis disponible »). */
  markPaidAction?: {
    onMarkPaid: () => void | Promise<void>
    isPending: boolean
  } | null
  /** Titre de la carte coordonnées (défaut : « Client »). */
  clientSectionTitle?: string
  /** Convertir l'achat assisté en expédition logistique (statut arrived_at_hub ou ordered). */
  convertToShipmentAction?: {
    onConvert: () => void | Promise<void>
    isPending: boolean
  } | null
  /** ID du shipment déjà converti (lecture seule, affiché comme lien). */
  convertedShipmentId?: number | null
  /** URL de la preuve de paiement téléversée par le client (affichée côté admin). */
  paymentProofUrl?: string | null
}

const STATUS_HEX: Record<string, string> = {
  pending_quote: '#d97706',
  awaiting_payment: '#2563eb',
  paid: '#059669',
  ordered: '#7c3aed',
  arrived_at_hub: '#16a34a',
  converted_to_shipment: '#4f46e5',
  cancelled: '#dc2626',
}

function parsePositiveNumber(raw: string): number {
  const n = Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

function parsePercentage(raw: string): number {
  const n = Number(String(raw).replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, 100)
}

export function AdminShoppingQuoteView({
  requestId,
  status,
  client,
  lines,
  currency = 'EUR',
  currencyDisplay,
  canEdit = true,
  isSending = false,
  onSendQuote,
  onRequestEmailPreview,
  headerActions,
  readonlyFinancialSummary = null,
  initialBankFeePercentage = 3,
  initialPaymentMethodsNote = null,
  readonlyQuoteDetails = null,
  markOrderedAction = null,
  orderedSupplierTracking = null,
  pageHeading,
  pageSubheading,
  resendQuoteAction = null,
  markPaidAction = null,
  clientSectionTitle = 'Client',
  convertToShipmentAction = null,
  convertedShipmentId = null,
  paymentProofUrl = null,
}: AdminShoppingQuoteViewProps) {
  const { formatMoney, branding } = useFormatMoney()
  const [unitPrices, setUnitPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const line of lines) {
      const key = String(line.id)
      if (line.initialUnitPrice != null && Number.isFinite(Number(line.initialUnitPrice))) {
        init[key] = String(line.initialUnitPrice)
      } else {
        init[key] = ''
      }
    }
    return init
  })

  const [serviceFee, setServiceFee] = useState('')

  const defaultNote =
    initialPaymentMethodsNote != null && String(initialPaymentMethodsNote).trim() !== ''
      ? String(initialPaymentMethodsNote).trim()
      : DEFAULT_PAYMENT_METHODS_NOTE

  const [bankFeePercentage, setBankFeePercentage] = useState(() =>
    Number.isFinite(initialBankFeePercentage) ? String(initialBankFeePercentage) : '3',
  )
  const [paymentMethodsNote, setPaymentMethodsNote] = useState(defaultNote)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const [supplierTrackingInput, setSupplierTrackingInput] = useState('')
  const [confirmOrderWithoutTracking, setConfirmOrderWithoutTracking] = useState(false)
  const [confirmConvertOpen, setConfirmConvertOpen] = useState(false)

  const subtotal = useMemo(() => {
    let sum = 0
    for (const line of lines) {
      const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
      sum += u * (line.quantity || 0)
    }
    return sum
  }, [lines, unitPrices])

  const feeAmount = useMemo(() => parsePositiveNumber(serviceFee), [serviceFee])
  const bankPct = useMemo(() => parsePercentage(bankFeePercentage), [bankFeePercentage])
  const baseBeforeBank = subtotal + feeAmount
  const bankFeeAmount = useMemo(
    () => baseBeforeBank * (bankPct / 100),
    [baseBeforeBank, bankPct],
  )
  const grandTotal = subtotal + feeAmount + bankFeeAmount

  const lineTotals = useMemo(() => {
    return lines.map((line) => {
      const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
      const lt = u * (line.quantity || 0)
      return { line, unitPrice: u, lineTotal: lt }
    })
  }, [lines, unitPrices])

  const defaultSubheading =
    'Vérifiez les liens fournis par le client, saisissez les prix réels constatés sur le site marchand, puis ajoutez vos frais de service avant d’envoyer le devis.'
  const resolvedHeading =
    pageHeading != null && pageHeading.trim() !== '' ? pageHeading.trim() : `Chiffrage de la demande #${requestId}`
  const resolvedSubheading =
    pageSubheading != null && pageSubheading.trim() !== '' ? pageSubheading.trim() : defaultSubheading

  const statusHex = STATUS_HEX[status.code] ?? '#64748b'
  const badgeStyle =
    status.toneClassName == null || status.toneClassName === ''
      ? {
          backgroundColor: `${statusHex}20`,
          color: statusHex,
          borderColor: `${statusHex}55`,
        }
      : undefined

  const handleUnitChange = useCallback((id: string | number, value: string) => {
    setUnitPrices((prev) => ({ ...prev, [String(id)]: value }))
  }, [])

  const buildPreviewBody = useCallback((): AssistedQuotePreviewBody => {
    return {
      items: lineTotals.map(({ line, unitPrice }) => ({
        id: Number(line.id),
        unit_price: unitPrice,
      })),
      service_fee: feeAmount,
      bank_fee_percentage: bankPct,
      payment_methods_note: paymentMethodsNote.trim() !== '' ? paymentMethodsNote.trim() : null,
    }
  }, [lineTotals, feeAmount, bankPct, paymentMethodsNote])

  const handlePreviewEmail = useCallback(async () => {
    if (!onRequestEmailPreview || !canEdit) return
    setPreviewLoading(true)
    try {
      const html = await onRequestEmailPreview(buildPreviewBody())
      setPreviewHtml(html)
      setPreviewOpen(true)
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Impossible de générer l’aperçu.'))
    } finally {
      setPreviewLoading(false)
    }
  }, [onRequestEmailPreview, canEdit, buildPreviewBody])

  const submitMarkOrdered = useCallback(async () => {
    if (!markOrderedAction) return
    const trimmed = supplierTrackingInput.trim()
    await markOrderedAction.onSubmit(trimmed !== '' ? trimmed : null)
  }, [markOrderedAction, supplierTrackingInput])

  const handleMarkOrderedClick = useCallback(() => {
    if (!markOrderedAction || markOrderedAction.isSubmitting) return
    const trimmed = supplierTrackingInput.trim()
    if (trimmed === '') {
      setConfirmOrderWithoutTracking(true)
      return
    }
    void submitMarkOrdered()
  }, [markOrderedAction, supplierTrackingInput, submitMarkOrdered])

  const handleSubmit = useCallback(async () => {
    if (!onSendQuote || !canEdit) return
    const payload: AdminShoppingQuotePayload = {
      subtotal,
      serviceFee: feeAmount,
      bankFeePercentage: bankPct,
      bankFeeAmount,
      paymentMethodsNote: paymentMethodsNote.trim(),
      total: grandTotal,
      lines: lineTotals.map(({ line, unitPrice, lineTotal }) => ({
        id: line.id,
        unitPrice,
        lineTotal,
      })),
    }
    await onSendQuote(payload)
  }, [
    onSendQuote,
    canEdit,
    subtotal,
    feeAmount,
    bankPct,
    bankFeeAmount,
    paymentMethodsNote,
    grandTotal,
    lineTotals,
  ])

  const money = (n: number) => formatMoney(n)
  const curLabel =
    currencyDisplay ??
    resolveMoneySymbol({
      currency: currency || branding?.currency || 'EUR',
      currency_symbol: branding?.currency_symbol ?? '',
    })

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div
        variants={fadeInUp}
        className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{resolvedHeading}</h1>
            <Badge
              className={cn(
                'text-xs font-semibold px-2.5 py-0.5 shrink-0',
                status.toneClassName?.trim()
                  ? cn(status.toneClassName, 'border-0')
                  : 'border',
              )}
              style={status.toneClassName?.trim() ? undefined : badgeStyle}
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{resolvedSubheading}</p>

          <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-3 bg-muted/30 border-b border-border/60">
              <CardTitle className="text-base flex items-center gap-2 font-semibold text-foreground">
                <User className="h-4 w-4 text-[#3d3d69] shrink-0" aria-hidden />
                {clientSectionTitle}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Coordonnées associées à la demande — vue synthèse
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  { key: 'name', label: 'Nom', value: client.name, icon: User },
                  { key: 'email', label: 'E-mail', value: client.email, icon: Mail },
                  { key: 'phone', label: 'Téléphone', value: client.phone, icon: Phone },
                  { key: 'phone2', label: 'Téléphone secondaire', value: client.phoneSecondary, icon: Phone },
                  { key: 'locker', label: 'Casier', value: client.lockerNumber, icon: Hash },
                  { key: 'addr', label: 'Adresse', value: client.addressLine, icon: MapPin },
                  { key: 'city', label: 'Code postal & ville', value: client.cityLine, icon: MapPin },
                  { key: 'state', label: 'Région / province', value: client.state, icon: MapPin },
                  { key: 'country', label: 'Pays', value: client.country, icon: MapPin },
                  { key: 'landmark', label: 'Repère', value: client.landmark, icon: Landmark },
                ] as const
              ).map(({ key, label, value, icon: Icon }) => {
                const raw = value != null ? String(value).trim() : ''
                if (key !== 'name' && raw === '') return null
                const display = key === 'name' ? (raw || '—') : raw
                return (
                  <div key={key} className="flex items-start gap-3 text-sm min-w-0">
                    <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-semibold text-foreground break-words whitespace-pre-line leading-snug">{display}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {status.code === 'ordered' &&
          orderedSupplierTracking != null &&
          String(orderedSupplierTracking).trim() !== '' ? (
            <Card className="overflow-hidden rounded-2xl border border-violet-200/80 bg-violet-50/50 dark:border-violet-500/25 dark:bg-violet-500/10 shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-violet-900 dark:text-violet-200">
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
                  Suivi fournisseur enregistré
                </CardTitle>
                <CardDescription className="text-xs">
                  Ce numéro servira à l’arrivée du colis au hub (scan / rapprochement).
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="font-mono text-sm font-semibold tracking-tight text-violet-950 dark:text-violet-100 break-all">
                  {String(orderedSupplierTracking).trim()}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {status.code === 'paid' && markOrderedAction ? (
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden rounded-2xl border border-violet-300/70 bg-gradient-to-br from-violet-50/90 to-background dark:border-violet-500/35 dark:from-violet-950/40 dark:to-card shadow-md ring-1 ring-violet-500/15">
                <CardHeader className="pb-2 border-b border-violet-200/60 dark:border-violet-500/20 bg-violet-100/40 dark:bg-violet-950/30">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-100">
                    <ShoppingBag className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden />
                    Action : passer la commande fournisseur
                  </CardTitle>
                  <CardDescription className="text-xs text-violet-900/80 dark:text-violet-200/80">
                    Le paiement client est validé. Ouvrez les liens marchands, finalisez l’achat avec la carte
                    entreprise, puis renseignez le numéro de suivi indiqué par le vendeur (Amazon Logistics,
                    Colissimo, etc.).
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <Alert variant="warning" className="border-amber-300/80 bg-amber-50/90 dark:bg-amber-950/25">
                    <AlertCircle className="h-4 w-4" aria-hidden />
                    <AlertTitle className="text-sm">Indispensable pour le hub</AlertTitle>
                    <AlertDescription>
                      Sans ce numéro, le magasinier ne pourra pas rattacher physiquement le colis à ce dossier à
                      la réception. Saisissez-le dès qu’il est disponible sur le site marchand ou dans l’e-mail de
                      confirmation.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="supplier-tracking" className="text-sm font-medium">
                      Numéro de suivi fournisseur
                      <span className="text-muted-foreground font-normal"> (ex. tracking Amazon)</span>
                    </Label>
                    <Input
                      id="supplier-tracking"
                      className="h-10 font-mono text-sm"
                      placeholder="Ex. 1Z999AA10123456784, TBA1234567890…"
                      value={supplierTrackingInput}
                      onChange={(e) => setSupplierTrackingInput(e.target.value)}
                      disabled={markOrderedAction.isSubmitting}
                      autoComplete="off"
                    />
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    disabled={markOrderedAction.isSubmitting}
                    className="h-12 w-full sm:w-auto gap-2 text-base font-semibold bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500 shadow-md"
                    onClick={() => void handleMarkOrderedClick()}
                  >
                    <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
                    {markOrderedAction.isSubmitting ? 'Enregistrement…' : 'Marquer comme commandé'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {convertedShipmentId != null ? (
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-indigo-50/50 dark:border-indigo-500/25 dark:bg-indigo-500/10 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                    <Package className="h-4 w-4 shrink-0" aria-hidden />
                    Converti en expédition
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cet achat assisté a été converti en dossier d'expédition logistique.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <a
                    href={`/shipments/${convertedShipmentId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                  >
                    Voir l'expédition #{convertedShipmentId}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {convertToShipmentAction && convertedShipmentId == null ? (
            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden rounded-2xl border border-blue-300/70 bg-gradient-to-br from-blue-50/90 to-background dark:border-blue-500/35 dark:from-blue-950/40 dark:to-card shadow-md ring-1 ring-blue-500/15">
                <CardHeader className="pb-2 border-b border-blue-200/60 dark:border-blue-500/20 bg-blue-100/40 dark:bg-blue-950/30">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-100">
                    <Package className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden />
                    Pont vers l'expédition
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-900/80 dark:text-blue-200/80">
                    Le colis est au hub. Créez le dossier d'expédition pour peser le colis, calculer le fret et facturer le client.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <Button
                    type="button"
                    size="lg"
                    disabled={convertToShipmentAction.isPending}
                    className="h-12 w-full sm:w-auto gap-2 text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-md"
                    onClick={() => setConfirmConvertOpen(true)}
                  >
                    <Package className="h-5 w-5 shrink-0" aria-hidden />
                    {convertToShipmentAction.isPending
                      ? 'Conversion en cours…'
                      : '\uD83D\uDCE6 Convertir en Expédition Logistique'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {resendQuoteAction || markPaidAction ? (
            <motion.div variants={fadeInUp} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {resendQuoteAction ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={resendQuoteAction.isPending}
                  onClick={() => void resendQuoteAction.onResend()}
                >
                  <RefreshCw
                    className={cn('h-4 w-4 shrink-0', resendQuoteAction.isPending && 'animate-spin')}
                    aria-hidden
                  />
                  {resendQuoteAction.isPending ? 'Envoi…' : 'Renvoyer le devis au client'}
                </Button>
              ) : null}
              {markPaidAction ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={markPaidAction.isPending}
                  onClick={() => void markPaidAction.onMarkPaid()}
                >
                  <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
                  {markPaidAction.isPending ? 'Validation…' : 'Valider le paiement reçu'}
                </Button>
              ) : null}
            </motion.div>
          ) : null}

          {paymentProofUrl ? (
            <motion.div variants={fadeInUp}>
              <div className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-950/20">
                <ExternalLink className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Le client a téléversé une preuve de paiement
                </span>
                <a
                  href={paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-amber-300/60 bg-white px-3 py-1 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
                >
                  Voir la preuve
                </a>
              </div>
            </motion.div>
          ) : null}
        </div>

        {headerActions ? (
          <div className="flex flex-wrap gap-2 shrink-0">{headerActions}</div>
        ) : null}
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <Calculator className="h-4 w-4 text-[#3d3d69]" aria-hidden />
                  Articles à chiffrer
                </CardTitle>
                <CardDescription>
                  {lines.length} ligne{lines.length > 1 ? 's' : ''} · montants en {curLabel}{' '}
                  {canEdit ? '(devise globale de l’application)' : null}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b">
                  <TableHead className="min-w-[200px]">Article</TableHead>
                  <TableHead className="w-[120px]">Lien</TableHead>
                  <TableHead className="w-[88px] text-right">Qté</TableHead>
                  <TableHead className="w-[140px] text-right">Prix unitaire</TableHead>
                  <TableHead className="w-[140px] text-right">Total ligne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun article dans cette demande.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((line) => {
                    const u = parsePositiveNumber(unitPrices[String(line.id)] ?? '')
                    const lineTotal = u * (line.quantity || 0)
                    return (
                      <TableRow key={String(line.id)} className="group">
                        <TableCell>
                          <div className="flex items-start gap-3 min-w-0">
                            <MerchantLogoBadge
                              logoUrl={line.merchant?.logo_url}
                              merchantName={line.merchant?.name ?? line.articleLabel}
                              className="mt-0.5"
                            />
                            <div className="space-y-1 min-w-0">
                              <p className="font-medium leading-snug">{line.articleLabel || 'Article'}</p>
                              {line.optionsLabel ? (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {line.optionsLabel}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {line.productUrl ? (
                            <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                              <a href={line.productUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                Ouvrir
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={0.01}
                            disabled={!canEdit}
                            className="h-9 text-right tabular-nums max-w-[128px] ml-auto"
                            value={unitPrices[String(line.id)] ?? ''}
                            onChange={(e) => handleUnitChange(line.id, e.target.value)}
                            placeholder="0"
                            aria-label={`Prix unitaire pour ${line.articleLabel}`}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {money(lineTotal)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-col lg:flex-row gap-6 lg:justify-end">
        <Card className="w-full lg:max-w-md border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] shadow-md ring-1 ring-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Synthèse financière</CardTitle>
            <CardDescription>
              {readonlyFinancialSummary && !canEdit
                ? 'Montant communiqué au client pour cette demande'
                : 'Sous-total, commission, frais bancaires et total à payer par le client'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readonlyFinancialSummary && !canEdit ? (
              <>
                {readonlyQuoteDetails ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Sous-total articles</span>
                      <span className="font-semibold tabular-nums">{money(readonlyQuoteDetails.subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Frais de service</span>
                      <span className="font-semibold tabular-nums">{money(readonlyQuoteDetails.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Frais bancaires ({readonlyQuoteDetails.bankFeePercentage.toFixed(2).replace('.', ',')} %)
                      </span>
                      <span className="font-semibold tabular-nums">{money(readonlyQuoteDetails.bankFeeAmount)}</span>
                    </div>
                    {readonlyQuoteDetails.paymentMethodsNote ? (
                      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                        {readonlyQuoteDetails.paymentMethodsNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="rounded-lg border border-blue-200/80 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-500/10 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total du devis
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300 mt-1">
                    {money(readonlyFinancialSummary.total)}
                  </p>
                  {readonlyFinancialSummary.hint ? (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {readonlyFinancialSummary.hint}
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground">Sous-total articles</span>
                  <span className="font-semibold tabular-nums">{money(subtotal)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-fee" className="text-sm font-medium">
                    Frais de service / Commission
                  </Label>
                  <Input
                    id="service-fee"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    disabled={!canEdit}
                    className="h-10 tabular-nums"
                    value={serviceFee}
                    onChange={(e) => setServiceFee(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-fee-pct" className="text-sm font-medium">
                    Frais bancaires (%)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Calcul : (sous-total + frais de service) × (pourcentage ÷ 100). Pré-rempli à 3 %, modifiable.
                  </p>
                  <Input
                    id="bank-fee-pct"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step={0.01}
                    disabled={!canEdit}
                    className="h-10 tabular-nums"
                    value={bankFeePercentage}
                    onChange={(e) => setBankFeePercentage(e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-muted-foreground">Montant frais bancaires</span>
                  <span className="font-semibold tabular-nums">{money(bankFeeAmount)}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-methods-note" className="text-sm font-medium">
                    Moyens de paiement (e-mail client)
                  </Label>
                  <Textarea
                    id="payment-methods-note"
                    rows={3}
                    disabled={!canEdit}
                    className="min-h-[88px] resize-y text-sm"
                    value={paymentMethodsNote}
                    onChange={(e) => setPaymentMethodsNote(e.target.value)}
                    placeholder={DEFAULT_PAYMENT_METHODS_NOTE}
                  />
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-sm font-medium">Total à payer</span>
                  <span className="text-xl font-bold tabular-nums text-primary">{money(grandTotal)}</span>
                </div>

                {onSendQuote && canEdit ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {onRequestEmailPreview ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-12 flex-1 gap-2 text-base font-semibold sm:flex-1"
                        disabled={previewLoading || isSending || lines.length === 0}
                        onClick={() => void handlePreviewEmail()}
                      >
                        {previewLoading ? (
                          <>Préparation…</>
                        ) : (
                          <>
                            <Eye className="h-5 w-5 shrink-0" aria-hidden />
                            Aperçu e-mail
                          </>
                        )}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="lg"
                      className="h-12 flex-1 gap-2 text-base font-semibold shadow-sm sm:min-w-[200px]"
                      disabled={isSending || lines.length === 0}
                      onClick={() => void handleSubmit()}
                    >
                      {isSending ? (
                        <>Envoi en cours…</>
                      ) : (
                        <>
                          <Send className="h-5 w-5 shrink-0" aria-hidden />
                          Envoyer le devis au client
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AlertDialog open={confirmOrderWithoutTracking} onOpenChange={setConfirmOrderWithoutTracking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Continuer sans numéro de suivi&nbsp;?</AlertDialogTitle>
            <AlertDialogDescription>
              Il est fortement recommandé de renseigner le suivi fournisseur maintenant pour faciliter la
              réception au hub. Vous pourrez compléter plus tard seulement si votre processus interne le permet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markOrderedAction?.isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500"
              disabled={markOrderedAction?.isSubmitting}
              onClick={() => {
                setConfirmOrderWithoutTracking(false)
                void submitMarkOrdered()
              }}
            >
              Confirmer sans suivi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmConvertOpen} onOpenChange={setConfirmConvertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en expédition logistique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cela va créer un dossier d'expédition pour peser le colis et facturer le fret.
              L'achat assisté sera marqué comme converti et ne pourra plus être modifié. Continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={convertToShipmentAction?.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500"
              disabled={convertToShipmentAction?.isPending}
              onClick={() => {
                setConfirmConvertOpen(false)
                void convertToShipmentAction?.onConvert()
              }}
            >
              {convertToShipmentAction?.isPending ? 'Conversion…' : 'Confirmer la conversion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] w-[min(100vw-1.5rem,56rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
            <DialogTitle>Aperçu du devis (e-mail client)</DialogTitle>
            <DialogDescription>
              Rendu généré côté serveur, proche du message reçu par le client. Devise : {curLabel}.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-3 sm:p-4">
            {previewHtml ? (
              <iframe
                title="Aperçu du devis par e-mail"
                className="h-[min(72vh,640px)] w-full rounded-md border bg-white shadow-sm"
                srcDoc={previewHtml}
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              />
            ) : null}
          </div>
          <DialogFooter className="shrink-0 border-t px-6 py-3">
            <Button type="button" variant="secondary" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default AdminShoppingQuoteView
