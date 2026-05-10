/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary/85 text-primary-foreground border border-primary/20 neo-raised-sm',
        secondary: 'bg-secondary/60 text-secondary-foreground border border-white/30 backdrop-blur-md',
        destructive: 'bg-destructive/85 text-destructive-foreground border border-destructive/20 neo-raised-sm',
        outline: 'text-foreground border border-white/40 bg-white/30 backdrop-blur-md',
        success: 'bg-success/15 text-success border border-success/20 backdrop-blur-md',
        warning: 'bg-warning/15 text-warning border border-warning/20 backdrop-blur-md',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
