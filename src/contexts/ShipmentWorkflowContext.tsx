import React, { createContext, useContext, useState, useCallback } from 'react'

export type ShipmentWorkflowStep =
  | 'registration'
  | 'documents'
  | 'checkout'

export interface ShipmentWorkflowContextType {
  currentStep: ShipmentWorkflowStep
  shipmentId: number | null
  setCurrentStep: (step: ShipmentWorkflowStep) => void
  setShipmentId: (id: number | null) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: ShipmentWorkflowStep) => void
  resetWorkflow: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  completedSteps: ShipmentWorkflowStep[]
  markStepCompleted: (step: ShipmentWorkflowStep) => void
}

const ShipmentWorkflowContext = createContext<ShipmentWorkflowContextType | undefined>(undefined)

export const useShipmentWorkflow = () => {
  const context = useContext(ShipmentWorkflowContext)
  if (!context) {
    throw new Error('useShipmentWorkflow must be used within a ShipmentWorkflowProvider')
  }
  return context
}

const STEP_ORDER: ShipmentWorkflowStep[] = [
  'registration',
  'documents',
  'checkout',
]

export const ShipmentWorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<ShipmentWorkflowStep>('registration')
  const [shipmentId, setShipmentId] = useState<number | null>(null)
  const [completedSteps, setCompletedSteps] = useState<ShipmentWorkflowStep[]>([])

  const markStepCompleted = useCallback((step: ShipmentWorkflowStep) => {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step])
  }, [])

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex < STEP_ORDER.length - 1) {
      markStepCompleted(currentStep)
      setCurrentStep(STEP_ORDER[currentIndex + 1])
    }
  }, [currentStep, markStepCompleted])

  const previousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1])
    }
  }, [currentStep])

  const goToStep = useCallback((step: ShipmentWorkflowStep) => {
    const targetIndex = STEP_ORDER.indexOf(step)
    const currentIndex = STEP_ORDER.indexOf(currentStep)
    if (targetIndex <= currentIndex || completedSteps.includes(STEP_ORDER[targetIndex - 1]) || targetIndex === 0) {
      setCurrentStep(step)
    }
  }, [currentStep, completedSteps])

  const resetWorkflow = useCallback(() => {
    setCurrentStep('registration')
    setShipmentId(null)
    setCompletedSteps([])
  }, [])

  const canGoNext = currentStep !== 'checkout'
  const canGoPrevious = currentStep !== 'registration'

  const value: ShipmentWorkflowContextType = {
    currentStep,
    shipmentId,
    setCurrentStep,
    setShipmentId,
    nextStep,
    previousStep,
    goToStep,
    resetWorkflow,
    canGoNext,
    canGoPrevious,
    completedSteps,
    markStepCompleted,
  }

  return (
    <ShipmentWorkflowContext.Provider value={value}>
      {children}
    </ShipmentWorkflowContext.Provider>
  )
}
