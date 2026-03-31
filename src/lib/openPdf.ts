import { toast } from 'sonner'

/** Même règle que `api/client` : en dev les requêtes passent par l’origine du SPA (proxy Vite). */
function pdfFetchBaseUrl(): string {
  return import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
}

async function showErrorFromBlob(blob: Blob): Promise<void> {
  const text = await blob.text()
  try {
    const j = JSON.parse(text) as { message?: string }
    toast.error(j.message || 'Erreur document')
  } catch {
    toast.error('Erreur document')
  }
}

async function normalizePdfResponse(blob: Blob): Promise<Blob | null> {
  if (blob.size < 5) {
    toast.error('Document vide ou invalide')
    return null
  }
  const head = new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer())
  if (head.startsWith('%PDF')) {
    return blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' })
  }
  const text = await blob.text()
  try {
    const j = JSON.parse(text) as { message?: string }
    toast.error(j.message || 'Erreur document')
  } catch {
    toast.error('Le serveur n’a pas renvoyé un PDF valide.')
  }
  return null
}

/**
 * Récupère un PDF (cookies Sanctum). Utilise `fetch` pour éviter l’en-tête
 * `Accept: application/json` imposé par axios, qui peut faire renvoyer du JSON à la place du PDF.
 */
export async function fetchPdfBlob(relativePath: string): Promise<Blob | null> {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  const url = `${pdfFetchBaseUrl()}${path}`
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/pdf, */*;q=0.1',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    const blob = await res.blob()

    if (!res.ok) {
      await showErrorFromBlob(blob)
      return null
    }

    return normalizePdfResponse(blob)
  } catch {
    toast.error('Impossible de charger le PDF')
    return null
  }
}

/**
 * Ouvre un PDF dans un nouvel onglet (blob), sans naviguer vers `/api/...`.
 */
export async function openApiPdf(relativePath: string) {
  const blob = await fetchPdfBlob(relativePath)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'noopener,noreferrer')
  if (!w) {
    toast.error('Autorisez les fenetres popup pour afficher le PDF')
    URL.revokeObjectURL(url)
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), 180_000)
}

/**
 * Ouvre la boîte d’impression du navigateur sur le PDF (iframe cachée).
 */
export async function printApiPdf(relativePath: string) {
  const blob = await fetchPdfBlob(relativePath)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0')
  iframe.setAttribute('title', 'Impression')
  iframe.src = url
  document.body.appendChild(iframe)

  const cleanup = () => {
    try {
      document.body.removeChild(iframe)
    } catch {
      /* ignore */
    }
    URL.revokeObjectURL(url)
  }

  iframe.onload = () => {
    const win = iframe.contentWindow
    if (!win) {
      cleanup()
      return
    }
    win.focus()
    win.print()
    setTimeout(cleanup, 2_000)
  }
}

/**
 * Télécharge le fichier PDF avec le nom indiqué.
 */
export async function downloadApiPdf(relativePath: string, filename: string) {
  const blob = await fetchPdfBlob(relativePath)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
