import { Check, Loader2, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DraftStatusIndicatorProps {
  lastSavedAt: string | null
  isSaving: boolean
  className?: string
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function DraftStatusIndicator({
  lastSavedAt,
  isSaving,
  className,
}: DraftStatusIndicatorProps) {
  if (isSaving) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse',
          className,
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Sauvegarde en cours…
      </span>
    )
  }

  if (lastSavedAt) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
          className,
        )}
      >
        <Check className="h-3 w-3 text-green-500" />
        Brouillon sauvegardé à {formatTime(lastSavedAt)}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground/60',
        className,
      )}
    >
      <CloudOff className="h-3 w-3" />
      Pas encore sauvegardé
    </span>
  )
}
