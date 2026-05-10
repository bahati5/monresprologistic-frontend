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
  Pencil,
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
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-1.5 mt-2">
        {(shipmentStatusRaw === 'draft' || userCan(user, 'edit_shipments')) && (
          <Button
            size="sm"
            className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate(`/shipments/${shipmentId}/edit`)}
          >
            <Pencil size={12} className="mr-1" />
            Modifier
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusDialogOpenChange(true)}>
          <RefreshCw size={12} className="mr-1" />
          Changer statut
        </Button>
        {showPaymentButton && (
          <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onOpenPayment}>
            <CreditCard size={12} className="mr-1" />
            Paiement
          </Button>
        )}
        {showAssignDriver && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onDriverDialogOpenChange(true)}>
            <UserPlus size={12} className="mr-1" />
            Chauffeur
          </Button>
        )}

        <input
          ref={signedFormInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={onSignedFormChange}
        />

        {/* Menu secondaire : téléchargements, copie, regroupement */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onCopyTracking}>
              <Copy size={13} className="mr-2" />
              Copier le numéro de tracking
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={archiveSignedPending}
              onClick={() => signedFormInputRef.current?.click()}
            >
              {archiveSignedPending ? <Loader2 size={13} className="mr-2 animate-spin" /> : <FileUp size={13} className="mr-2" />}
              {hasSignedForm ? 'Remplacer formulaire signé' : 'Archiver formulaire signé'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (!shipmentId) return
                void downloadApiPdf(`/api/shipments/${shipmentId}/pdf/form`, `formulaire-${trackingNumber || shipmentId}.pdf`)
              }}
            >
              <Download size={13} className="mr-2" />
              Télécharger formulaire (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!shipmentId) return
                void downloadApiPdf(`/api/shipments/${shipmentId}/pdf/invoice`, `facture-${trackingNumber || shipmentId}.pdf`)
              }}
            >
              <Download size={13} className="mr-2" />
              Télécharger facture (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (!shipmentId) return
                void downloadApiPdf(`/api/shipments/${shipmentId}/pdf/label`, `etiquette-${trackingNumber || shipmentId}.pdf`)
              }}
            >
              <Download size={13} className="mr-2" />
              Télécharger étiquette (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => shipmentId && void openApiPdf(`/api/shipments/${shipmentId}/pdf/tracking`)}>
              <Download size={13} className="mr-2" />
              Rapport de suivi
            </DropdownMenuItem>
            {canDuplicateShipment && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={duplicateShipment.isPending}
                  onClick={() => {
                    if (!shipmentId) return
                    duplicateShipment.mutate(Number(shipmentId), {
                      onSuccess: (res) => {
                        toast.success('Nouveau brouillon créé.')
                        navigate(`/shipments/${res.id}`)
                      },
                    })
                  }}
                >
                  <CopyPlus size={13} className="mr-2" />
                  Dupliquer le dossier
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {regroupementSlot}
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
