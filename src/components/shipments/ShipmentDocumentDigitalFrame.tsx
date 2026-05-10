import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  html: string | null
  title: string
  className?: string
  /** Hauteur du cadre (aperçu à l'écran, pas la page PDF). */
  heightClass?: string
}

/**
 * Affiche le HTML serveur (facture / formulaire / étiquette) dans une iframe.
 * Utilise une URL `blob:` plutôt que `srcDoc` : meilleure compatibilité avec
 * les documents HTML complets (&lt;!DOCTYPE&gt;, styles) qu'avec `srcDoc` + sandbox.
 * Le PDF reste réservé à l'impression / téléchargement (openPdf.ts).
 */
export function ShipmentDocumentDigitalFrame({
  html,
  title,
  className,
  heightClass = 'h-[min(70vh,720px)] min-h-[320px]',
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const el = iframeRef.current
    if (!el || !html?.trim()) return

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    el.src = url

    return () => {
      URL.revokeObjectURL(url)
      el.removeAttribute('src')
      el.src = 'about:blank'
    }
  }, [html])

  if (!html?.trim()) return null

  return (
    <iframe
      ref={iframeRef}
      title={title}
      className={cn(
        'w-full rounded-md border border-border bg-white shadow-sm',
        heightClass,
        className,
      )}
    />
  )
}
