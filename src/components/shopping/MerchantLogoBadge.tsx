import { useState } from 'react'
import { Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveImageUrl } from '@/lib/resolveImageUrl'

type MerchantLogoBadgeProps = {
  logoUrl?: string | null
  /** Utilisé pour l’attribut alt et le title accessibles */
  merchantName?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MerchantLogoBadge({
  logoUrl,
  merchantName,
  size = 'md',
  className,
}: MerchantLogoBadgeProps) {
  const [failed, setFailed] = useState(false)
  const dim =
    size === 'sm'
      ? 'h-7 w-7 min-h-7 min-w-7'
      : size === 'lg'
        ? 'h-11 w-11 min-h-11 min-w-11'
        : 'h-8 w-8 min-h-8 min-w-8'
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const raw = logoUrl != null && String(logoUrl).trim() !== '' ? String(logoUrl).trim() : ''
  const src = raw ? resolveImageUrl(raw) : ''
  const label = merchantName?.trim() || 'Marchand'

  if (!src || failed) {
    return (
      <div
        className={cn(
          'box-border flex shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted text-muted-foreground shadow-sm',
          dim,
          className,
        )}
        title={label}
      >
        <Store className={iconClass} aria-hidden />
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'box-border flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/40 p-1 shadow-sm',
        dim,
        className,
      )}
      title={label}
    >
      <img
        src={src}
        alt={merchantName?.trim() ? `Logo ${merchantName.trim()}` : 'Logo marchand'}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
