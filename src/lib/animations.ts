import type { Variants } from 'framer-motion'

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export const sidebarExpand = {
  collapsed: { width: 80, transition: { duration: 0.3, ease: 'easeInOut' } },
  expanded: { width: 280, transition: { duration: 0.3, ease: 'easeInOut' } },
}

export const listItemStagger: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
}

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2, transition: { duration: 0.2 } },
}

export const STATUS_COLORS: Record<string, string> = {
  created: '#3B82F6',
  accepted: '#14B8A6',
  preparing: '#F59E0B',
  collected: '#6366F1',
  in_transit: '#8B5CF6',
  customs: '#EC4899',
  arrived: '#06B6D4',
  out_for_delivery: '#F97316',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

export const MODULE_COLORS = {
  inbound:        { primary: '#F59E0B', light: '#FEF3C7', gradient: ['#F59E0B', '#D97706'] as const },
  shipments:      { primary: '#3B82F6', light: '#DBEAFE', gradient: ['#3B82F6', '#1D4ED8'] as const },
  pickups:        { primary: '#10B981', light: '#D1FAE5', gradient: ['#10B981', '#059669'] as const },
  consolidations: { primary: '#6366F1', light: '#E0E7FF', gradient: ['#6366F1', '#4338CA'] as const },
  finance:        { primary: '#14B8A6', light: '#CCFBF1', gradient: ['#14B8A6', '#0D9488'] as const },
  crm:            { primary: '#8B5CF6', light: '#EDE9FE', gradient: ['#8B5CF6', '#7C3AED'] as const },
  reports:        { primary: '#06B6D4', light: '#CFFAFE', gradient: ['#06B6D4', '#0891B2'] as const },
  config:         { primary: '#64748B', light: '#F1F5F9', gradient: ['#64748B', '#475569'] as const },
} as const
