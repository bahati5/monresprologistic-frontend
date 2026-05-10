import type { Dispatch, SetStateAction } from 'react'

import { useRecordPayment } from '@/hooks/useShipments'
import { paymentStatusBadge } from '@/lib/shipmentDetailWorkflow'
import type { Shipment } from '@/types/shipment'

export type PayBadge = ReturnType<typeof paymentStatusBadge>
export type RecordPaymentMutation = ReturnType<typeof useRecordPayment>

export interface ShipmentDetailPaymentFormState {
  amount: string
  method: string
  reference: string
  note: string
}

export interface ShipmentDetailPaymentsProps {
  shipmentId: string | undefined
  trackingNumber: string | undefined
  paymentDialogOpen: boolean
  onPaymentDialogOpenChange: (open: boolean) => void
  paymentForm: ShipmentDetailPaymentFormState
  setPaymentForm: Dispatch<SetStateAction<ShipmentDetailPaymentFormState>>
  shipment: Shipment
  formatMoney: (n: number) => string
  paymentMethods: { code?: string | null; id: number; name: unknown; is_active?: boolean }[] | undefined
  gateways:
    | {
        wire_transfer?: { is_active?: boolean }
      }
    | undefined
  recordPayment: RecordPaymentMutation
  onRecordPayment: () => void
  payBadge: PayBadge
}
