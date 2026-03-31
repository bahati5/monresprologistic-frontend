import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Check,
  Clock,
  AlertCircle,
  Package,
  Truck,
  CreditCard,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  date: string
  actor?: string
  icon?: LucideIcon
  color?: string
  type?: 'status' | 'action' | 'note' | 'payment' | 'system'
}

interface TimelineLogProps {
  events: TimelineEvent[]
  maxItems?: number
}

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  status:  { icon: Check, color: '#10B981' },
  action:  { icon: Package, color: '#3B82F6' },
  note:    { icon: Clock, color: '#64748B' },
  payment: { icon: CreditCard, color: '#14B8A6' },
  system:  { icon: AlertCircle, color: '#F59E0B' },
}

export function TimelineLog({ events, maxItems }: TimelineLogProps) {
  const displayed = maxItems ? events.slice(0, maxItems) : events

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-0">
        {displayed.map((event, i) => {
          const cfg = typeConfig[event.type || 'status']
          const Icon = event.icon || cfg.icon
          const color = event.color || cfg.color

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Icon dot */}
              <div
                className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-background"
                style={{ backgroundColor: color + '18' }}
              >
                <Icon size={16} style={{ color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <time className="shrink-0 text-xs text-muted-foreground">{event.date}</time>
                </div>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                )}
                {event.actor && (
                  <div className="flex items-center gap-1 mt-1">
                    <User size={11} className="text-muted-foreground/60" />
                    <span className="text-[11px] text-muted-foreground/60">{event.actor}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
