import { Coins } from 'lucide-react'
import { useCurrencySymbol } from '@/hooks/settings/useBranding'
import { cn } from '@/lib/utils'

interface CurrencyIconProps {
  className?: string
  size?: number
  /** Force a specific symbol instead of reading from settings */
  symbol?: string
}

/**
 * Renders the configured currency symbol as a styled inline element,
 * falling back to the generic Coins icon while branding loads.
 */
export function CurrencyIcon({ className, size = 16, symbol: overrideSymbol }: CurrencyIconProps) {
  const settingsSymbol = useCurrencySymbol()
  const sym = overrideSymbol ?? settingsSymbol

  if (!sym) {
    return <Coins className={className} size={size} />
  }

  return (
    <span
      className={cn('inline-flex items-center justify-center font-semibold leading-none shrink-0', className)}
      style={{ fontSize: size, width: size, height: size }}
      aria-hidden="true"
    >
      {sym}
    </span>
  )
}
