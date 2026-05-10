import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Copy,
  CopyPlus,
  Download,
  FileText,
  FileUp,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  UserPlus,
  CreditCard,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { openApiPdf, downloadApiPdf } from '@/lib/openPdf'
import { userCan } from '@/lib/permissions'
import { fadeInUp } from '@/lib/animations'
import type { AuthUser } from '@/types'
import { ShipmentDetailStatusDriverDialogs } from '@/components/shipments/detail/ShipmentDetailStatusDriverDialogs'

type DuplicateMutation = {
  isPending: boolean
  mutate: (
    id: number,
    opts?: {
      onSuccess?: (res: { id: number }) => void
    },
  ) => void
}

type StatusMutation = {
  isPending: boolean
  mutate: (
    vars: { id: number; status: string; notes?: string },
    opts?: { onSuccess?: () => void },
  ) => void
}

type AssignDriverMutation = {
  isPending: boolean
  mutate: (
    vars: { id: number; driver_id: number },
    opts?: { onSuccess?: () => void },
  ) => void
}

export interface ShipmentDetailActionsProps {
  shipmentId: string | undefined
  trackingNumber: string | undefined
  shipmentStatusRaw: unknown
  user: AuthUser | null
  onOpenDigitalFormSection: () => void
  onCopyTracking: () => void
  statusDialogOpen: boolean
  onStatusDialogOpenChange: (open: boolean) => void
  driverDialogOpen: boolean
  onDriverDialogOpenChange: (open: boolean) => void
  showAssignDriver: boolean
  showPaymentButton: boolean
  onOpenPayment: () => void
  signedFormInputRef: React.RefObject<HTMLInputElement | null>
  onSignedFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  archiveSignedPending: boolean
  hasSignedForm: boolean | undefined
  canDuplicateShipment: boolean
  duplicateShipment: DuplicateMutation
  statusCode: string
  transitions: Array<{ code: string; label: string }>
  selectedStatusCode: string
  onSelectedStatusCodeChange: (code: string) => void
  statusNote: string
  onStatusNoteChange: (note: string) => void
  updateStatus: StatusMutation
  onConfirmStatusChange: () => void
  driverList: Array<{ id: number; name: unknown; phone?: string | null }>
  selectedDriverId: string
  onSelectedDriverIdChange: (id: string) => void
  assignDriver: AssignDriverMutation
  onConfirmAssignDriver: () => void
  regroupementSlot?: React.ReactNode
}

export function ShipmentDetailActions(props: ShipmentDetailActionsProps) {
  const navigate = useNavigate()
  const {
    shipmentId,
    trackingNumber,
    shipmentStatusRaw,
    user,
    onOpenDigitalFormSection,
    onCopyTracking,
    statusDialogOpen,
    onStatusDialogOpenChange,
    driverDialogOpen,
    onDriverDialogOpenChange,
    showAssignDriver,
    showPaymentButton,
    onOpenPayment,
    signedFormInputRef,
    onSignedFormChange,
    archiveSignedPending,
    hasSignedForm,
    canDuplicateShipment,
    duplicateShipment,
    statusCode,
    transitions,
    selectedStatusCode,
    onSelectedStatusCodeChange,
    statusNote,
    onStatusNoteChange,
    updateStatus,
    onConfirmStatusChange,
    driverList,
    selectedDriverId,
    onSelectedDriverIdChange,
    assignDriver,
    onConfirmAssignDriver,
    regroupementSlot,
  } = props

  return (
    <>
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-2">
        {shipmentStatusRaw === 'draft' || userCan(user, 'edit_shipments') ? (
          <Button
            variant="default"
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => navigate(`/shipments/${shipmentId}/edit`)}
          >
            <FileText size={14} className="mr-1.5" />
            Modifier
          </Button>
        ) : null}
        <Button type="button" variant="secondary" size="sm" className="font-medium" onClick={onOpenDigitalFormSection}>
          <FileText size={14} className="mr-1.5 shrink-0" />
          Formulaire numérique
        </Button>
        <Button variant="outline" size="sm" onClick={onCopyTracking}>
          <Copy size={14} className="mr-1.5" />
          Copier tracking
        </Button>
        <Button variant="outline" size="sm" onClick={() => onStatusDialogOpenChange(true)}>
          <RefreshCw size={14} className="mr-1.5" />
          Changer statut
        </Button>
        {showAssignDriver ? (
          <Button variant="outline" size="sm" onClick={() => onDriverDialogOpenChange(true)}>
            <UserPlus size={14} className="mr-1.5" />
            Assigner chauffeur
          </Button>
        ) : null}
        {showPaymentButton ? (
          <Button variant="default" size="sm" onClick={onOpenPayment}>
            <CreditCard size={14} className="mr-1.5" />
            Caisse / paiement
          </Button>
        ) : null}
        <input
          ref={signedFormInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={onSignedFormChange}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={archiveSignedPending}
          onClick={() => signedFormInputRef.current?.click()}
        >
          {archiveSignedPending ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <FileUp size={14} className="mr-1.5" />
          )}
          {hasSignedForm ? 'Remplacer formulaire signe' : 'Archiver formulaire signe'}
        </Button>
        {regroupementSlot}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenDigitalFormSection}>
              <FileText size={14} className="mr-2" />
              Formulaire d&apos;expédition (aperçu + PDF)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!shipmentId) return
                void downloadApiPdf(
                  `/api/shipments/${shipmentId}/pdf/form`,
                  `formulaire-expedition-${trackingNumber || shipmentId}.pdf`,
                )
              }}
            >
              <Download size={14} className="mr-2" />
              Télécharger formulaire (PDF)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canDuplicateShipment ? (
              <>
                <DropdownMenuItem
                  disabled={duplicateShipment.isPending}
                  onClick={() => {
                    if (!shipmentId) return
                    duplicateShipment.mutate(Number(shipmentId), {
                      onSuccess: (res) => {
                        toast.success('Nouveau brouillon créé — ouverture du dossier.')
                        navigate(`/shipments/${res.id}`)
                      },
                    })
                  }}
                >
                  <CopyPlus size={14} className="mr-2" />
                  Dupliquer le dossier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              onClick={() => {
                if (!shipmentId) return
                void downloadApiPdf(
                  `/api/shipments/${shipmentId}/pdf/invoice`,
                  `facture-${trackingNumber || shipmentId}.pdf`,
                )
              }}
            >
              <Download size={14} className="mr-2" />
              Télécharger facture (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!shipmentId) return
                void downloadApiPdf(
                  `/api/shipments/${shipmentId}/pdf/label`,
                  `etiquette-${trackingNumber || shipmentId}.pdf`,
                )
              }}
            >
              <Download size={14} className="mr-2" />
              Télécharger étiquette (PDF)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => shipmentId && void openApiPdf(`/api/shipments/${shipmentId}/pdf/tracking`)}>
              <Download size={14} className="mr-2" />
              Rapport de suivi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      <ShipmentDetailStatusDriverDialogs
        statusDialogOpen={statusDialogOpen}
        onStatusDialogOpenChange={onStatusDialogOpenChange}
        driverDialogOpen={driverDialogOpen}
        onDriverDialogOpenChange={onDriverDialogOpenChange}
        statusCode={statusCode}
        transitions={transitions}
        selectedStatusCode={selectedStatusCode}
        onSelectedStatusCodeChange={onSelectedStatusCodeChange}
        statusNote={statusNote}
        onStatusNoteChange={onStatusNoteChange}
        updateStatus={updateStatus}
        onConfirmStatusChange={onConfirmStatusChange}
        driverList={driverList}
        selectedDriverId={selectedDriverId}
        onSelectedDriverIdChange={onSelectedDriverIdChange}
        assignDriver={assignDriver}
        onConfirmAssignDriver={onConfirmAssignDriver}
      />
    </>
  )
}
