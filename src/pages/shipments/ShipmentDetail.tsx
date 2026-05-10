import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  useShipment,
  useUpdateShipmentStatus,
  useAssignDriver,
  useRecordPayment,
  useArchiveSignedForm,
  useDuplicateShipment,
} from '@/hooks/useShipments'
import { useAssignableDrivers } from '@/hooks/useCrm'
import { useRegroupementsPicker, useAttachShipmentToRegroupement, useCreateRegroupement } from '@/hooks/useOperations'
import { useAuthStore } from '@/stores/authStore'
import { userCan, userCanManageRegroupementShipments } from '@/lib/permissions'
import { paymentMethodHooks, useFormatMoney, usePaymentGateways } from '@/hooks/useSettings'
import { Card, CardContent } from '@/components/ui/card'
import { WorkflowStepper } from '@/components/workflow/WorkflowStepper'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { STATUS_COLORS } from '@/lib/animations'
import { resolveLocalized } from '@/lib/localizedString'
import { resolveImageUrl } from '@/lib/resolveImageUrl'
import { buildShipmentTimelineEvents, paymentStatusBadge } from '@/lib/shipmentDetailWorkflow'
import { computeShipmentWorkflowStepperState } from '@/lib/shipmentDetailStepper'
import { useShipmentDetailDocumentPreviews } from '@/hooks/shipments/useShipmentDetailDocumentPreviews'
import { ShipmentDetailHeader } from '@/components/shipments/detail/ShipmentDetailHeader'
import { ShipmentDetailActions } from '@/components/shipments/detail/ShipmentDetailActions'
import {
  ShipmentDetailRegroupementDialog,
  ShipmentDetailRegroupementOpenButton,
} from '@/components/shipments/detail/ShipmentDetailRegroupement'
import {
  ShipmentDetailRegroupementCard,
} from '@/components/shipments/detail/ShipmentDetailRegroupementCard'
import { ShipmentDetailPaymentDialog } from '@/components/shipments/detail/ShipmentDetailPayments'
import { ShipmentDetailInfoGrid } from '@/components/shipments/detail/ShipmentDetailInfoGrid'
import { ShipmentDetailTabsSection } from '@/components/shipments/detail/ShipmentDetailTabsSection'
import type { ShipmentDetailData } from '@/components/shipments/detail/shipmentDetailPageTypes'
import { ShipmentDetailLoadingSkeleton } from '@/components/shipments/detail/ShipmentDetailLoadingSkeleton'
import { useShipmentDetailHandlers } from '@/hooks/shipments/useShipmentDetailHandlers'

export default function ShipmentDetail() {
  const { id } = useParams()
  const { data, isLoading, dataUpdatedAt } = useShipment(id)
  const updateStatus = useUpdateShipmentStatus()
  const assignDriver = useAssignDriver()
  const recordPayment = useRecordPayment()
  const archiveSignedForm = useArchiveSignedForm()
  const duplicateShipment = useDuplicateShipment()
  const { data: drivers } = useAssignableDrivers()
  const { data: paymentMethods } = paymentMethodHooks.useList()
  const { data: gateways } = usePaymentGateways()
  const { formatMoney } = useFormatMoney()
  const { user } = useAuthStore()
  const attachToRegroupement = useAttachShipmentToRegroupement()
  const createRegroupement = useCreateRegroupement()

  const [statusDialog, setStatusDialog] = useState(false)
  const [driverDialog, setDriverDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [selectedStatusCode, setSelectedStatusCode] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: '', reference: '', note: '' })

  const [detailTab, setDetailTab] = useState('items')
  const {
    formHtml,
    invoiceHtml,
    labelHtml,
    docFetchState,
    docDownloadKind,
    setDocDownloadKind,
  } = useShipmentDetailDocumentPreviews(id, dataUpdatedAt)
  const signedFormInputRef = useRef<HTMLInputElement | null>(null)
  const documentsTabsRef = useRef<HTMLDivElement | null>(null)

  const openDigitalFormSection = () => {
    setDetailTab('form')
    requestAnimationFrame(() => {
      documentsTabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const s = (data || {}) as ShipmentDetailData

  const {
    handleCopyTracking,
    handlePrintForm,
    handlePrintInvoice,
    handlePrintLabel,
    handleStatusChange,
    handleAssignDriver,
    handleRecordPayment,
    handleSignedFormSelection,
  } = useShipmentDetailHandlers({
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
  })

  const canRegrouper = userCanManageRegroupementShipments(user)
  const canDuplicateShipment = userCan(user, 'create_shipments')
  const { data: consPickerData, isLoading: consPickerLoading } = useRegroupementsPicker(
    consolidateOpen && canRegrouper,
  )

  if (isLoading) {
    return <ShipmentDetailLoadingSkeleton />
  }

  const statusCode = s.status?.code || 'draft'
  const statusName = typeof s.status?.name === 'string' ? s.status.name : resolveLocalized(s.status?.name) || statusCode
  const statusColor = (s.status?.color_hex as string) || STATUS_COLORS[statusCode] || '#64748B'
  const payBadge = paymentStatusBadge(s.payment_status)
  const driverList = drivers ?? []
  const fromPreAlert = Boolean(s.pre_alert_id)
  const fromAssistedPurchase = Boolean(s.assisted_purchase_id)

  const { stepperSteps, currentStepId, completedSteps, rejectedStepIds } =
    computeShipmentWorkflowStepperState(s, statusCode, fromPreAlert, fromAssistedPurchase)

  const transitions = Array.isArray(s.available_transitions) ? s.available_transitions : []
  const signedFormUrl = resolveImageUrl(s.signed_form_url)

  const regroupementRows = consPickerData?.regroupements ?? []

  const showAssignDriver =
    statusCode === 'pending_drop_off' ||
    statusCode === 'in_transit' ||
    statusCode === 'arrived_at_destination'
  const showPaymentButton = s.payment_status !== 'paid'
  const showRegrouper =
    canRegrouper && !s.regroupement_id && statusCode !== 'delivered' && statusCode !== 'cancelled'

  const timelineEvents = buildShipmentTimelineEvents(s.logs)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <ShipmentDetailHeader
          shipmentId={id}
          trackingNumber={s.tracking_number}
          statusName={statusName}
          statusColor={statusColor}
          payBadge={payBadge}
          hasSignedForm={s.has_signed_form}
          createdAt={s.created_at}
          shippingMode={s.shipping_mode}
          driverName={s.driver?.name}
          routeDisplay={s.route_display}
          corridor={s.corridor}
        />
        <ShipmentDetailActions
          shipmentId={id}
          trackingNumber={s.tracking_number}
          shipmentStatusRaw={s.status}
          user={user}
          onOpenDigitalFormSection={openDigitalFormSection}
          onCopyTracking={handleCopyTracking}
          statusDialogOpen={statusDialog}
          onStatusDialogOpenChange={setStatusDialog}
          driverDialogOpen={driverDialog}
          onDriverDialogOpenChange={setDriverDialog}
          showAssignDriver={showAssignDriver}
          showPaymentButton={showPaymentButton}
          onOpenPayment={() => setPaymentDialog(true)}
          signedFormInputRef={signedFormInputRef}
          onSignedFormChange={handleSignedFormSelection}
          archiveSignedPending={archiveSignedForm.isPending}
          hasSignedForm={s.has_signed_form}
          canDuplicateShipment={canDuplicateShipment}
          duplicateShipment={duplicateShipment}
          statusCode={statusCode}
          transitions={transitions}
          selectedStatusCode={selectedStatusCode}
          onSelectedStatusCodeChange={setSelectedStatusCode}
          statusNote={statusNote}
          onStatusNoteChange={setStatusNote}
          updateStatus={updateStatus}
          onConfirmStatusChange={handleStatusChange}
          driverList={driverList}
          selectedDriverId={selectedDriverId}
          onSelectedDriverIdChange={setSelectedDriverId}
          assignDriver={assignDriver}
          onConfirmAssignDriver={handleAssignDriver}
          regroupementSlot={
            showRegrouper ? <ShipmentDetailRegroupementOpenButton onOpen={() => setConsolidateOpen(true)} /> : null
          }
        />
      </motion.div>

      {s.regroupement_id && s.regroupement ? (
        <ShipmentDetailRegroupementCard shipmentId={id} regroupement={s.regroupement} />
      ) : null}

      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="py-6 px-4 md:px-8">
            <WorkflowStepper
              steps={stepperSteps}
              currentStepId={currentStepId}
              completedStepIds={completedSteps}
              rejectedStepIds={rejectedStepIds}
            />
          </CardContent>
        </Card>
      </motion.div>

      <ShipmentDetailInfoGrid shipment={s} />

      <ShipmentDetailTabsSection
        documentsTabsRef={documentsTabsRef}
        detailTab={detailTab}
        onDetailTabChange={setDetailTab}
        shipment={s}
        formatMoney={formatMoney}
        paymentMethods={paymentMethods}
        payBadge={payBadge}
        timelineEvents={timelineEvents}
        shipmentId={id}
        trackingNumber={s.tracking_number}
        hasSignedForm={s.has_signed_form}
        signedFormUrl={signedFormUrl}
        formHtml={formHtml}
        invoiceHtml={invoiceHtml}
        labelHtml={labelHtml}
        docFetchState={docFetchState}
        docDownloadKind={docDownloadKind}
        setDocDownloadKind={setDocDownloadKind}
        signedFormInputRef={signedFormInputRef}
        archiveSignedPending={archiveSignedForm.isPending}
        onPrintForm={handlePrintForm}
        onPrintInvoice={handlePrintInvoice}
        onPrintLabel={handlePrintLabel}
      />

      <ShipmentDetailPaymentDialog
        shipmentId={id}
        trackingNumber={s.tracking_number}
        paymentDialogOpen={paymentDialog}
        onPaymentDialogOpenChange={setPaymentDialog}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        shipment={s}
        formatMoney={formatMoney}
        paymentMethods={paymentMethods}
        gateways={gateways}
        recordPayment={recordPayment}
        onRecordPayment={handleRecordPayment}
      />

      <ShipmentDetailRegroupementDialog
        open={consolidateOpen}
        onOpenChange={setConsolidateOpen}
        shipmentId={id}
        regroupementRows={regroupementRows}
        consPickerLoading={consPickerLoading}
        createRegroupement={createRegroupement}
        attachToRegroupement={attachToRegroupement}
      />
    </motion.div>
  )
}
