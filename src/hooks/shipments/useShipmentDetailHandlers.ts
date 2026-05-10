import { toast } from 'sonner'
import { printApiPdf } from '@/lib/openPdf'
import type { ShipmentDetailData } from '@/components/shipments/detail/shipmentDetailPageTypes'

interface UseShipmentDetailHandlersParams {
  id: string | undefined
  shipment: ShipmentDetailData
  selectedStatusCode: string
  statusNote: string
  selectedDriverId: string
  paymentForm: { amount: string; method: string; reference: string; note: string }
  setStatusDialog: (v: boolean) => void
  setSelectedStatusCode: (v: string) => void
  setStatusNote: (v: string) => void
  setDriverDialog: (v: boolean) => void
  setSelectedDriverId: (v: string) => void
  setPaymentDialog: (v: boolean) => void
  setPaymentForm: React.Dispatch<
    React.SetStateAction<{ amount: string; method: string; reference: string; note: string }>
  >
  updateStatus: {
    mutate: (vars: { id: number; status: string; notes?: string }, opts?: { onSuccess?: () => void }) => void
  }
  assignDriver: {
    mutate: (vars: { id: number; driver_id: number }, opts?: { onSuccess?: () => void }) => void
  }
  recordPayment: {
    mutate: (
      vars: { id: number; amount: number; method: string; reference?: string; note?: string },
      opts?: { onSuccess?: () => void },
    ) => void
  }
  archiveSignedForm: {
    mutate: (vars: { id: number; file: File }, opts?: { onSettled?: () => void }) => void
  }
}

export function useShipmentDetailHandlers(p: UseShipmentDetailHandlersParams) {
  const {
    id,
    shipment: s,
    selectedStatusCode,
    statusNote,
    selectedDriverId,
    paymentForm,
    setStatusDialog,
    setSelectedStatusCode,
    setStatusNote,
    setDriverDialog,
    setSelectedDriverId,
    setPaymentDialog,
    setPaymentForm,
    updateStatus,
    assignDriver,
    recordPayment,
    archiveSignedForm,
  } = p

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(s.tracking_number || '')
    toast.success('Numero de suivi copie')
  }

  const handlePrintForm = () => {
    if (id) void printApiPdf(`/api/shipments/${id}/pdf/form`)
  }

  const handlePrintInvoice = () => {
    if (id) void printApiPdf(`/api/shipments/${id}/pdf/invoice`)
  }

  const handlePrintLabel = () => {
    if (id) void printApiPdf(`/api/shipments/${id}/pdf/label`)
  }

  const handleStatusChange = () => {
    if (!selectedStatusCode || !id) return
    updateStatus.mutate(
      { id: Number(id), status: selectedStatusCode, notes: statusNote || undefined },
      { onSuccess: () => { setStatusDialog(false); setSelectedStatusCode(''); setStatusNote('') } },
    )
  }

  const handleAssignDriver = () => {
    if (!selectedDriverId || !id) return
    assignDriver.mutate(
      { id: Number(id), driver_id: Number(selectedDriverId) },
      { onSuccess: () => { setDriverDialog(false); setSelectedDriverId('') } },
    )
  }

  const handleRecordPayment = () => {
    if (!paymentForm.amount || !paymentForm.method || !id) return
    recordPayment.mutate(
      {
        id: Number(id),
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        note: paymentForm.note || undefined,
      },
      {
        onSuccess: () => {
          setPaymentDialog(false)
          setPaymentForm({ amount: '', method: '', reference: '', note: '' })
        },
      },
    )
  }

  const handleSignedFormSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !id) return
    archiveSignedForm.mutate(
      { id: Number(id), file },
      { onSettled: () => { event.target.value = '' } },
    )
  }

  return {
    handleCopyTracking,
    handlePrintForm,
    handlePrintInvoice,
    handlePrintLabel,
    handleStatusChange,
    handleAssignDriver,
    handleRecordPayment,
    handleSignedFormSelection,
  }
}
