import { CheckCircle, FileText, MapPin, Package, Truck } from 'lucide-react'

import type { WorkflowStep } from '@/components/workflow/WorkflowStepper'
import type { Shipment } from '@/types/shipment'
import { completedBeforeCurrent } from '@/lib/shipmentDetailWorkflow'

const FALLBACK_DIRECT_STEPS: WorkflowStep[] = [
  { id: 'draft', title: 'Brouillon', icon: FileText },
  { id: 'received_at_hub', title: 'Réceptionné au hub', icon: CheckCircle },
  { id: 'ready_for_dispatch', title: 'Prêt à l’expédition', icon: Package },
  { id: 'in_transit', title: 'En transit', icon: Truck },
  { id: 'arrived_at_destination', title: 'Arrivé à destination', icon: MapPin },
  { id: 'delivered', title: 'Livré', icon: Package },
]

const FALLBACK_PREALERT_STEPS: WorkflowStep[] = [
  { id: 'pending_drop_off', title: 'En attente de dépôt', icon: Package },
  { id: 'received_at_hub', title: 'Réceptionné au hub', icon: CheckCircle },
  { id: 'ready_for_dispatch', title: 'Prêt à l’expédition', icon: Package },
  { id: 'in_transit', title: 'En transit', icon: Truck },
  { id: 'arrived_at_destination', title: 'Arrivé à destination', icon: MapPin },
  { id: 'delivered', title: 'Livré', icon: Package },
]

const FALLBACK_ASSISTED_PURCHASE_STEPS: WorkflowStep[] = [
  { id: 'received_at_hub', title: 'Réceptionné au hub', icon: CheckCircle },
  { id: 'ready_for_dispatch', title: 'Prêt à l’expédition', icon: Package },
  { id: 'in_transit', title: 'En transit', icon: Truck },
  { id: 'arrived_at_destination', title: 'Arrivé à destination', icon: MapPin },
  { id: 'delivered', title: 'Livré', icon: Package },
]

const ALL_FALLBACK_STEP_LOOKUP: WorkflowStep[] = [
  ...FALLBACK_DIRECT_STEPS,
  ...FALLBACK_PREALERT_STEPS,
  ...FALLBACK_ASSISTED_PURCHASE_STEPS,
]

export interface ShipmentWorkflowStepperState {
  stepperSteps: WorkflowStep[]
  currentStepId: string
  completedSteps: string[]
  rejectedStepIds: string[]
}

export function computeShipmentWorkflowStepperState(
  s: Shipment,
  statusCode: string,
  fromPreAlert: boolean,
  fromAssistedPurchase: boolean,
): ShipmentWorkflowStepperState {
  const apiWf = Array.isArray(s.workflow_steps) ? s.workflow_steps : []

  let fallbackSteps: WorkflowStep[]
  if (fromAssistedPurchase) {
    fallbackSteps = FALLBACK_ASSISTED_PURCHASE_STEPS
  } else if (fromPreAlert) {
    fallbackSteps = FALLBACK_PREALERT_STEPS
  } else {
    fallbackSteps = FALLBACK_DIRECT_STEPS
  }

  const stepperSteps: WorkflowStep[] =
    apiWf.length > 0
      ? apiWf.map((ws: { code: string; label: string; date?: string | null }) => {
          const fallback = ALL_FALLBACK_STEP_LOOKUP.find((x) => x.id === ws.code)
          return {
            id: ws.code,
            title: ws.label,
            icon: fallback?.icon ?? Package,
            date: ws.date
              ? new Date(ws.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : undefined,
          }
        })
      : fallbackSteps

  const currentStepId =
    (apiWf.find((x: { current?: boolean }) => x.current) as { code?: string } | undefined)?.code || statusCode
  const completedSteps =
    apiWf.length > 0
      ? apiWf.filter((x: { completed?: boolean }) => x.completed).map((x: { code: string }) => x.code)
      : completedBeforeCurrent(statusCode, fromPreAlert, fromAssistedPurchase)
  const rejectedStepIds = statusCode === 'cancelled' ? ['cancelled'] : []

  return { stepperSteps, currentStepId, completedSteps, rejectedStepIds }
}
