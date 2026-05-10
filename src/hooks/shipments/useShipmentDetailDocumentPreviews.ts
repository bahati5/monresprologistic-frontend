import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchShipmentDocumentHtml } from '@/lib/shipmentDocumentPreview'

export function useShipmentDetailDocumentPreviews(
  shipmentId: string | undefined,
  dataUpdatedAt: number | undefined,
) {
  const enabled = !!shipmentId
  const sid = Number(shipmentId)

  const formQuery = useQuery({
    queryKey: ['shipment-doc-preview', sid, 'form', dataUpdatedAt],
    queryFn: () => fetchShipmentDocumentHtml(sid, 'form', { suppressToast: true }),
    enabled,
  })

  const invoiceQuery = useQuery({
    queryKey: ['shipment-doc-preview', sid, 'invoice', dataUpdatedAt],
    queryFn: () => fetchShipmentDocumentHtml(sid, 'invoice', { suppressToast: true }),
    enabled,
  })

  const labelQuery = useQuery({
    queryKey: ['shipment-doc-preview', sid, 'label', dataUpdatedAt],
    queryFn: () => fetchShipmentDocumentHtml(sid, 'label', { suppressToast: true }),
    enabled,
  })

  const [docDownloadKind, setDocDownloadKind] = useState<'form' | 'invoice' | 'label' | null>(null)

  return {
    formHtml: formQuery.data ?? null,
    invoiceHtml: invoiceQuery.data ?? null,
    labelHtml: labelQuery.data ?? null,
    docFetchState: {
      form: formQuery.isLoading,
      invoice: invoiceQuery.isLoading,
      label: labelQuery.isLoading,
    },
    docDownloadKind,
    setDocDownloadKind,
  }
}
