import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList,
  FileText,
  CreditCard,
  Check,
} from 'lucide-react'
import type { ShipmentWorkflowStep } from '@/contexts/ShipmentWorkflowContext'

interface ShipmentProcessStepsProps {
  currentStep: ShipmentWorkflowStep
  completedSteps: ShipmentWorkflowStep[]
  onStepClick: (step: ShipmentWorkflowStep) => void
}

const STEPS: { key: ShipmentWorkflowStep; label: string; icon: React.ElementType }[] = [
  { key: 'registration', label: 'Enregistrement', icon: ClipboardList },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'checkout', label: 'Caisse', icon: CreditCard },
]

export const ShipmentProcessSteps: React.FC<ShipmentProcessStepsProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep)
  const progressPercent = STEPS.length > 1
    ? Math.round(((completedSteps.length + (currentIndex >= 0 ? 0.5 : 0)) / (STEPS.length - 1)) * 100)
    : 0

  const getStatus = (stepKey: ShipmentWorkflowStep) => {
    if (completedSteps.includes(stepKey)) return 'completed'
    if (stepKey === currentStep) return 'active'
    return 'pending'
  }

  const canNavigate = (index: number) => {
    if (index <= currentIndex) return true
    if (index === currentIndex + 1 && completedSteps.includes(STEPS[currentIndex].key)) return true
    return false
  }

  return (
    <div className="w-full space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">
          {Math.min(progressPercent, 100)}%
        </span>
      </div>

      {/* Desktop steps */}
      <div className="hidden md:flex items-start justify-between w-full">
        {STEPS.map((step, i) => {
          const status = getStatus(step.key)
          const clickable = canNavigate(i)
          const isLast = i === STEPS.length - 1
          const StepIcon = step.icon

          return (
            <React.Fragment key={step.key}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className={cn(
                  'flex flex-col items-center flex-1 relative',
                  clickable && 'cursor-pointer',
                )}
                onClick={() => clickable && onStepClick(step.key)}
              >
                {/* Step circle */}
                {status === 'completed' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-emerald-500/20"
                  >
                    <Check size={18} strokeWidth={3} />
                  </motion.div>
                ) : status === 'active' ? (
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white ring-4 ring-blue-500/30"
                  >
                    <StepIcon size={18} />
                  </motion.div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted-foreground/20 text-muted-foreground">
                    <StepIcon size={16} />
                  </div>
                )}

                <p className={cn(
                  'text-xs text-center font-medium mt-2',
                  status === 'completed' && 'text-emerald-600',
                  status === 'active' && 'text-blue-600',
                  status === 'pending' && 'text-muted-foreground',
                )}>
                  {step.label}
                </p>

                {status === 'active' && completedSteps.includes(step.key) && (
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    ✓ Terminé
                  </Badge>
                )}
              </motion.div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex items-center h-10 w-full max-w-[80px] mx-1">
                  <div className="relative h-0.5 w-full rounded-full bg-muted-foreground/20 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: status === 'completed' ? '100%' : '0%' }}
                      transition={{ duration: 0.5, delay: i * 0.15, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile compact */}
      <div className="flex items-center justify-between w-full md:hidden">
        {STEPS.map((step, i) => {
          const status = getStatus(step.key)
          const isLast = i === STEPS.length - 1
          const clickable = canNavigate(i)

          return (
            <React.Fragment key={step.key}>
              <div
                className={cn('flex flex-col items-center', clickable && 'cursor-pointer')}
                title={step.label}
                onClick={() => clickable && onStepClick(step.key)}
              >
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium',
                  status === 'completed' && 'bg-emerald-500 text-white',
                  status === 'active' && 'bg-blue-500 text-white ring-2 ring-blue-500/30',
                  status === 'pending' && 'bg-muted border border-muted-foreground/20 text-muted-foreground',
                )}>
                  {status === 'completed' ? <Check size={14} strokeWidth={3} /> : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] mt-1',
                  status === 'active' ? 'font-semibold' : '',
                )}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-1">
                  <div className={cn(
                    'h-full rounded-full',
                    status === 'completed' ? 'bg-emerald-500' : 'bg-muted-foreground/20',
                  )} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
