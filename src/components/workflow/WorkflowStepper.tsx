import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, Clock, AlertCircle, type LucideIcon } from 'lucide-react'

export interface WorkflowStep {
  id: string
  title: string
  description?: string
  icon?: LucideIcon
  date?: string
  actor?: string
}

export type StepStatus = 'completed' | 'current' | 'upcoming' | 'rejected'

interface WorkflowStepperProps {
  steps: WorkflowStep[]
  currentStepId: string
  completedStepIds?: string[]
  rejectedStepIds?: string[]
  orientation?: 'horizontal' | 'vertical'
  compact?: boolean
  colorScheme?: string
  onStepClick?: (stepId: string) => void
}

function getStepStatus(
  stepId: string,
  currentStepId: string,
  completedStepIds: string[],
  rejectedStepIds: string[]
): StepStatus {
  if (rejectedStepIds.includes(stepId)) return 'rejected'
  if (completedStepIds.includes(stepId)) return 'completed'
  if (stepId === currentStepId) return 'current'
  return 'upcoming'
}

const statusConfig: Record<StepStatus, { bg: string; border: string; text: string; ring: string }> = {
  completed: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500/20' },
  current:   { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600', ring: 'ring-blue-500/30' },
  upcoming:  { bg: 'bg-muted', border: 'border-muted-foreground/20', text: 'text-muted-foreground', ring: '' },
  rejected:  { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600', ring: 'ring-red-500/20' },
}

function StepIcon({ status, icon: Icon, index }: { status: StepStatus; icon?: LucideIcon; index: number }) {
  const cfg = statusConfig[status]

  if (status === 'completed') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn('flex h-10 w-10 items-center justify-center rounded-full text-white', cfg.bg, cfg.ring && `ring-4 ${cfg.ring}`)}
      >
        <Check size={18} strokeWidth={3} />
      </motion.div>
    )
  }

  if (status === 'current') {
    return (
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className={cn('flex h-10 w-10 items-center justify-center rounded-full text-white ring-4', cfg.bg, cfg.ring)}
      >
        {Icon ? <Icon size={18} /> : <Clock size={18} />}
      </motion.div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-white', cfg.bg, cfg.ring && `ring-4 ${cfg.ring}`)}>
        <AlertCircle size={18} />
      </div>
    )
  }

  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full border-2 text-muted-foreground', cfg.border)}>
      {Icon ? <Icon size={16} /> : <span className="text-sm font-semibold">{index + 1}</span>}
    </div>
  )
}

export function WorkflowStepper({
  steps,
  currentStepId,
  completedStepIds = [],
  rejectedStepIds = [],
  orientation = 'horizontal',
  compact = false,
  onStepClick,
}: WorkflowStepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className="space-y-0">
        {steps.map((step, i) => {
          const status = getStepStatus(step.id, currentStepId, completedStepIds, rejectedStepIds)
          const cfg = statusConfig[status]
          const isLast = i === steps.length - 1
          const clickable = onStepClick && (status === 'completed' || status === 'current')

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={cn('flex gap-4', clickable && 'cursor-pointer')}
              onClick={() => clickable && onStepClick(step.id)}
            >
              <div className="flex flex-col items-center">
                <StepIcon status={status} icon={step.icon} index={i} />
                {!isLast && (
                  <div className={cn(
                    'w-0.5 flex-1 min-h-[32px] my-1',
                    status === 'completed' ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                  )} />
                )}
              </div>
              <div className={cn('pb-6', isLast && 'pb-0')}>
                <p className={cn('text-sm font-medium', cfg.text)}>{step.title}</p>
                {step.description && <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>}
                {step.date && <p className="text-xs text-muted-foreground/60 mt-0.5">{step.date}</p>}
                {step.actor && <p className="text-xs text-muted-foreground/60">Par {step.actor}</p>}
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  // Calculate progress
  const totalSteps = steps.length
  const completedCount = completedStepIds.length
  const currentIdx = steps.findIndex(s => s.id === currentStepId)
  const progressPercent = totalSteps > 1 ? Math.round(((completedCount + (currentIdx >= 0 ? 0.5 : 0)) / (totalSteps - 1)) * 100) : 0

  // Horizontal stepper
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
        <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-right">{Math.min(progressPercent, 100)}%</span>
      </div>

      {/* Desktop */}
      <div className={cn('hidden md:flex items-start justify-between w-full', compact && 'md:hidden')}>
        {steps.map((step, i) => {
          const status = getStepStatus(step.id, currentStepId, completedStepIds, rejectedStepIds)
          const cfg = statusConfig[status]
          const isLast = i === steps.length - 1
          const clickable = onStepClick && (status === 'completed' || status === 'current')

          return (
            <React.Fragment key={step.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className={cn('flex flex-col items-center flex-1 relative', clickable && 'cursor-pointer')}
                onClick={() => clickable && onStepClick(step.id)}
              >
                <StepIcon status={status} icon={step.icon} index={i} />
                <p className={cn('text-xs text-center font-medium mt-2', cfg.text)}>{step.title}</p>
                {step.date && <p className="text-[10px] text-muted-foreground mt-0.5">{step.date}</p>}
              </motion.div>
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

      {/* Mobile / compact */}
      <div className={cn('flex items-center justify-between w-full', !compact && 'md:hidden')}>
        {steps.map((step, i) => {
          const status = getStepStatus(step.id, currentStepId, completedStepIds, rejectedStepIds)
          const isLast = i === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center" title={step.title}>
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium',
                  status === 'completed' && 'bg-emerald-500 text-white',
                  status === 'current' && 'bg-blue-500 text-white ring-2 ring-blue-500/30',
                  status === 'upcoming' && 'bg-muted border border-muted-foreground/20 text-muted-foreground',
                  status === 'rejected' && 'bg-red-500 text-white',
                )}>
                  {status === 'completed' ? <Check size={14} strokeWidth={3} /> : i + 1}
                </div>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-1">
                  <div className={cn(
                    'h-full rounded-full',
                    status === 'completed' ? 'bg-emerald-500' : 'bg-muted-foreground/20'
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
