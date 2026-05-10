import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimelineLog, type TimelineEvent } from '@/components/workflow/TimelineLog'
import { fadeInUp } from '@/lib/animations'
import CommentThread from '@/components/comments/CommentThread'
import type { Shipment } from '@/types/shipment'
import {
  ShipmentDetailPaymentsTabPanel,
} from '@/components/shipments/detail/ShipmentDetailPayments'
import { ShipmentDetailDocuments } from '@/components/shipments/detail/ShipmentDetailDocuments'
import { Package, FileText, DollarSign, Tag, FileUp, Calendar } from 'lucide-react'
import { paymentStatusBadge } from '@/lib/shipmentDetailWorkflow'

type PayBadge = ReturnType<typeof paymentStatusBadge>

export interface ShipmentDetailTabsSectionProps {
  documentsTabsRef: React.RefObject<HTMLDivElement | null>
  detailTab: string
  onDetailTabChange: (v: string) => void
  shipment: Shipment
  formatMoney: (n: number) => string
  paymentMethods: { code?: string | null; id: number; name: unknown; is_active?: boolean }[] | undefined
  payBadge: PayBadge
  timelineEvents: TimelineEvent[]
  shipmentId: string | undefined
  trackingNumber: string | undefined
  hasSignedForm: boolean | undefined
  signedFormUrl: string | null
  formHtml: string | null
  invoiceHtml: string | null
  labelHtml: string | null
  docFetchState: { form: boolean; invoice: boolean; label: boolean }
  docDownloadKind: 'form' | 'invoice' | 'label' | null
  setDocDownloadKind: (v: 'form' | 'invoice' | 'label' | null) => void
  signedFormInputRef: React.RefObject<HTMLInputElement | null>
  archiveSignedPending: boolean
  onPrintForm: () => void
  onPrintInvoice: () => void
  onPrintLabel: () => void
}

export function ShipmentDetailTabsSection({
  documentsTabsRef,
  detailTab,
  onDetailTabChange,
  shipment: s,
  formatMoney,
  paymentMethods,
  payBadge,
  timelineEvents,
  shipmentId,
  trackingNumber,
  hasSignedForm,
  signedFormUrl,
  formHtml,
  invoiceHtml,
  labelHtml,
  docFetchState,
  docDownloadKind,
  setDocDownloadKind,
  signedFormInputRef,
  archiveSignedPending,
  onPrintForm,
  onPrintInvoice,
  onPrintLabel,
}: ShipmentDetailTabsSectionProps) {
  return (
    <motion.div ref={documentsTabsRef} variants={fadeInUp}>
      <Tabs value={detailTab} onValueChange={onDetailTabChange} className="w-full">
        <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="items">Articles ({s.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="payments">Paiements ({s.payments?.length || 0})</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="comments">Commentaires</TabsTrigger>
          <TabsTrigger
            value="form"
            className="gap-1"
            title="Formulaire d'expédition : document à imprimer pour signature client (PRD §6.4)"
          >
            <FileText size={14} className="shrink-0 opacity-70" />
            Formulaire
          </TabsTrigger>
          <TabsTrigger value="invoice" className="gap-1">
            <DollarSign size={14} className="shrink-0 opacity-70" />
            Facture
          </TabsTrigger>
          <TabsTrigger value="label" className="gap-1">
            <Tag size={14} className="shrink-0 opacity-70" />
            Étiquette
          </TabsTrigger>
          <TabsTrigger value="signed-form" className="gap-1">
            <FileUp size={14} className="shrink-0 opacity-70" />
            Formulaire signé
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {s.items && s.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-right font-medium">Qte</th>
                        <th className="px-4 py-3 text-right font-medium">Poids (kg)</th>
                        <th className="px-4 py-3 text-right font-medium">Valeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{item.weight_kg ?? item.weight ?? '—'}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.value ?? item.declared_value ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">Aucun article enregistre</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <ShipmentDetailPaymentsTabPanel
          shipment={s}
          formatMoney={formatMoney}
          paymentMethods={paymentMethods}
          payBadge={payBadge}
        />

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="py-6">
              {timelineEvents.length > 0 ? (
                <TimelineLog events={timelineEvents} />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">Aucun historique disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <Card>
            <CardContent className="py-6">
              <CommentThread commentableType="shipment" commentableId={Number(s.id)} />
            </CardContent>
          </Card>
        </TabsContent>

        <ShipmentDetailDocuments
          shipmentId={shipmentId}
          trackingNumber={trackingNumber}
          hasSignedForm={hasSignedForm}
          signedFormUrl={signedFormUrl}
          formHtml={formHtml}
          invoiceHtml={invoiceHtml}
          labelHtml={labelHtml}
          docFetchState={docFetchState}
          docDownloadKind={docDownloadKind}
          setDocDownloadKind={setDocDownloadKind}
          signedFormInputRef={signedFormInputRef}
          archiveSignedPending={archiveSignedPending}
          onPrintForm={onPrintForm}
          onPrintInvoice={onPrintInvoice}
          onPrintLabel={onPrintLabel}
        />
      </Tabs>
    </motion.div>
  )
}
