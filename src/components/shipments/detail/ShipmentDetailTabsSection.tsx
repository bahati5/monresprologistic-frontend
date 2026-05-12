import { motion } from 'framer-motion'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimelineLog, type TimelineEvent } from '@/components/workflow/TimelineLog'
import { fadeInUp } from '@/lib/animations'
import CommentThread from '@/components/comments/CommentThread'
import type { Shipment } from '@/types/shipment'
import {
  ShipmentDetailPaymentsTabPanel,
} from '@/components/shipments/detail/ShipmentDetailPayments'
import { ShipmentDetailDocuments } from '@/components/shipments/detail/ShipmentDetailDocuments'
import { Package, FileText, Receipt, Tag, FileUp, Calendar } from 'lucide-react'
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
        <div className="neo-inset rounded-xl p-1.5 bg-white/20 backdrop-blur-sm mb-4">
          <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger
              value="items"
              className="text-sm h-8 px-3 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              Articles ({s.items?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="text-sm h-8 px-3 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              Paiements ({s.payments?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-sm h-8 px-3 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              Historique
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="text-sm h-8 px-3 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              Commentaires
            </TabsTrigger>
            <TabsTrigger
              value="form"
              className="text-sm h-8 px-3 gap-1.5 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              <FileText size={13} className="shrink-0 opacity-60" />
              Formulaire
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              className="text-sm h-8 px-3 gap-1.5 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              <Receipt size={13} className="shrink-0 opacity-60" />
              Facture
            </TabsTrigger>
            <TabsTrigger
              value="label"
              className="text-sm h-8 px-3 gap-1.5 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              <Tag size={13} className="shrink-0 opacity-60" />
              Étiquette
            </TabsTrigger>
            <TabsTrigger
              value="signed-form"
              className="text-sm h-8 px-3 gap-1.5 data-[state=active]:glass data-[state=active]:neo-raised-sm data-[state=active]:bg-white/80 rounded-lg transition-all"
            >
              <FileUp size={13} className="shrink-0 opacity-60" />
              Formulaire signé
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="items" className="mt-0">
          <div className="glass neo-raised-sm rounded-xl overflow-hidden">
            {s.items && s.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/30 bg-white/20">
                      <th className="px-3 py-2.5 text-left font-semibold text-foreground/70 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-foreground/70 uppercase tracking-wider">Qte</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-foreground/70 uppercase tracking-wider">Poids</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-foreground/70 uppercase tracking-wider">Valeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.items.map((item, i) => (
                      <tr key={i} className="border-b border-white/15 last:border-0 hover:bg-white/20 transition-colors">
                        <td className="px-3 py-2.5 font-medium">{item.description}</td>
                        <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right">{item.weight_kg ?? item.weight ?? '—'}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{item.value ?? item.declared_value ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Package size={28} className="mb-2 opacity-30" />
                <p className="text-xs">Aucun article enregistré</p>
              </div>
            )}
          </div>
        </TabsContent>

        <ShipmentDetailPaymentsTabPanel
          shipment={s}
          formatMoney={formatMoney}
          paymentMethods={paymentMethods}
          payBadge={payBadge}
        />

        <TabsContent value="history" className="mt-0">
          <div className="glass neo-raised-sm rounded-xl p-4">
            {timelineEvents.length > 0 ? (
              <TimelineLog events={timelineEvents} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar size={28} className="mb-2 opacity-30" />
                <p className="text-xs">Aucun historique</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-0">
          <div className="glass neo-raised-sm rounded-xl p-4">
            <CommentThread commentableType="shipment" commentableId={Number(s.id)} />
          </div>
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
