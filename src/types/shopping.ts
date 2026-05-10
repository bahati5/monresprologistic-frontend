import type { ReactNode } from 'react'

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

export type AssistedQuotePreviewBody = {
  items: { id: number; unit_price: number }[]
  service_fee: number
  bank_fee_percentage: number
  payment_methods_note: string | null
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
  markPaidAction?: {
    onMarkPaid: () => void | Promise<void>
    isPending: boolean
  } | null
  clientSectionTitle?: string
  convertToShipmentAction?: {
    onConvert: () => void | Promise<void>
    isPending: boolean
  } | null
  convertedShipmentId?: number | null
  paymentProofUrl?: string | null
  onQuoteDataChange?: (data: {
    unitPrices: Record<string, string>
    serviceFee: string
    bankFeePercentage: string
    paymentMethodsNote: string
  }) => void
  draftIndicator?: ReactNode
}
