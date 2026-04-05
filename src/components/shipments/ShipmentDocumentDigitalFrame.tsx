import { cn } from '@/lib/utils'

type Props = {
  html: string | null
  title: string
  className?: string
  /** Hauteur du cadre (aperçu à l’écran, pas la page PDF). */
  heightClass?: string
}

/**
 * Affiche le HTML serveur (facture / étiquette) dans une iframe isolée.
 * Le PDF n’est généré que pour impression ou téléchargement.
 */
export function ShipmentDocumentDigitalFrame({
  html,
  title,
  className,
  heightClass = 'h-[min(70vh,720px)] min-h-[320px]',
}: Props) {
  if (!html) return null
  return (
    <iframe
      title={title}
      srcDoc={html}
      className={cn(
        'w-full rounded-md border border-border bg-white shadow-sm',
        heightClass,
        className,
      )}
      sandbox="allow-same-origin allow-scripts"
    />
  )
}
