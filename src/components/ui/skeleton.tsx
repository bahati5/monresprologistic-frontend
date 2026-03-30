import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const skeletonVariants = cva('animate-pulse rounded-md bg-muted', {
  variants: {
    variant: {
      default: '',
      circle: 'rounded-full',
      text: 'h-4 w-3/4',
      title: 'h-6 w-1/2',
      avatar: 'h-10 w-10 rounded-full',
      button: 'h-9 w-24',
      card: 'h-32 w-full',
    },
  },
  defaultVariants: { variant: 'default' },
})

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ variant, className }))} {...props} />
}

export { Skeleton }
