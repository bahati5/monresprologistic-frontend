import type { ReactNode } from 'react'
import type { QuoteEditDraftSnapshot } from '@/lib/quoteEditDraft'
import type {
  AssistedPurchasePaymentSummary,
  ServerQuoteConfigurationLine,
} from '@/lib/assistedPurchaseQuote'

export type AdminQuoteLine = {
  id: string | number
  articleLabel: string
  optionsLabel?: string | null
  productUrl: string
  quantity: number
  initialUnitPrice?: number | null
  merchant?: {
    id?: number
    name?: string | null
    logo_url?: string | null
  } | null
}

export type AdminQuoteStatus = {
  code: string
  label: string
  toneClassName?: string | null
}

export type AdminShoppingQuotePayload = {
  subtotal: number
  serviceFee: number
  bankFeePercentage: number
  bankFeeAmount: number
  paymentMethodsNote: string
  total: number
  lines: { id: string | number; unitPrice: number; quantity: number; lineTotal: number }[]
  dynamicLines?: import('@/types/assistedPurchase').ActiveQuoteLine[]
  estimatedDelivery?: string
  staffMessage?: string
  articleAvailabilities?: { id: number; availability_status: string; alternative_note: string | null }[]
}

export type ReadonlyQuoteFinancialDetails = {
  subtotal: number
  serviceFee: number
  bankFeeAmount: number
  bankFeePercentage: number
  paymentMethodsNote?: string | null
  total: number
}

export type AssistedQuotePreviewBody = {
  items: { id: number; unit_price: number; quantity?: number }[]
  service_fee: number
  bank_fee_percentage: number
  payment_methods_note: string | null
  lines?: {
    internal_code: string
    name: string
    type: string
    calculation_base: string | null
    value: number
    is_visible_to_client: boolean
  }[]
  estimated_delivery?: string | null
  staff_message?: string | null
}

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
  requestId: string | number
  status: AdminQuoteStatus
  client: ShoppingQuoteClientDetail
  lines: AdminQuoteLine[]
  currency?: string
  currencyDisplay?: string
  canEdit?: boolean
  isSending?: boolean
  onSendQuote?: (payload: AdminShoppingQuotePayload) => void | Promise<void>
  onRequestEmailPreview?: (body: AssistedQuotePreviewBody) => Promise<string>
  headerActions?: ReactNode
  readonlyFinancialSummary?: { total: number; hint?: string } | null
  initialBankFeePercentage?: number
  initialPaymentMethodsNote?: string | null
  readonlyQuoteDetails?: ReadonlyQuoteFinancialDetails | null
  markOrderedAction?: {
    onSubmit: (supplierTrackingNumber: string | null) => void | Promise<void>
    isSubmitting: boolean
  } | null
  orderedSupplierTracking?: string | null
  pageHeading?: string
  pageSubheading?: string
  resendQuoteAction?: {
    onResend: () => void | Promise<void>
    isPending: boolean
  } | null
  recordPaymentAction?: {
    onOpen: () => void
    isPending: boolean
  } | null
  /** ordered → arrived_at_hub (poids + photo, API multipart) */
  markHubReceivedAction?: {
    onOpen: () => void
    isPending: boolean
  } | null
  /** Encaissements (acomptes) + solde restant */
  paymentSummary?: AssistedPurchasePaymentSummary | null
  /** Délai / message client depuis le dernier snapshot (réédition) */
  revisionHydration?: { estimatedDelivery: string; staffMessage: string } | null
  /** Lignes dynamiques du dernier snapshot pour préremplir l’éditeur */
  serverQuoteConfigurationLines?: ServerQuoteConfigurationLine[] | null
  /** Clé de remontage de l’éditeur de lignes après nouvelle version */
  lineEditorResetKey?: string
  /** Historique des envois de devis (snapshots) */
  quoteSnapshotHistory?: {
    id: number
    version: number
    sent_at: string | null
    total_primary: string
    primary_currency: string | null
    revision_reason: string | null
    created_at: string | null
  }[]
  /** Fil chronologique du dossier (API `dossier_timeline`) */
  dossierTimeline?: {
    at: string
    event: string
    label: string
    meta?: string | null
  }[]
  clientSectionTitle?: string
  convertToShipmentAction?: {
    onConvert: () => void | Promise<void>
    isPending: boolean
  } | null
  convertedShipmentId?: number | null
  paymentProofUrl?: string | null
  /** Brouillon serveur (GET /drafts) pour cette demande — hydratation au chargement */
  quoteServerDraftPayload?: Record<string, unknown> | null
  /** true une fois la requête des brouillons terminée */
  quoteDraftsQuerySettled?: boolean
  onQuoteDataChange?: (data: QuoteEditDraftSnapshot) => void
  draftIndicator?: ReactNode
  pdfDownloadUrl?: string | null
}
