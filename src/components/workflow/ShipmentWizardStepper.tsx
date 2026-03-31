import { WorkflowStepper, type WorkflowStep } from '@/components/workflow/WorkflowStepper'
import { Users, Package, Truck, ClipboardList } from 'lucide-react'

const WIZARD_STEPS: WorkflowStep[] = [
  { id: '1', title: 'Acteurs', icon: Users },
  { id: '2', title: 'Colis', icon: Package },
  { id: '3', title: 'Logistique', icon: Truck },
  { id: '4', title: 'Résumé & tarif', icon: ClipboardList },
]

type Props = {
  step: number
  onStepChange?: (step: number) => void
}

/** Assistant création colis : 4 étapes fixes (sans lien avec le workflow statut métier). */
export function ShipmentWizardStepper({ step, onStepChange }: Props) {
  const currentId = String(Math.min(Math.max(step, 1), 4))
  const completedStepIds = WIZARD_STEPS.slice(0, step - 1).map((s) => s.id)

  return (
    <WorkflowStepper
      steps={WIZARD_STEPS}
      currentStepId={currentId}
      completedStepIds={completedStepIds}
      orientation="horizontal"
      compact
      onStepClick={
        onStepChange ? (id) => onStepChange(Number.parseInt(id, 10)) : undefined
      }
    />
  )
}
