import api from '@/api/client'
import { toast } from 'sonner'

/**
 * Ouvre un PDF API dans un nouvel onglet sans naviguer vers `/api/...` (évite de charger
 * le SPA dans l’onglet si le proxy renvoie du HTML, ou les redirections auth HTML de Laravel).
 */
export async function openApiPdf(relativePath: string) {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`
  try {
    const res = await api.get(path, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf, application/json;q=0.9, */*;q=0.1',
      },
    })

    const rawCt = res.headers['content-type'] || ''
    const ct = rawCt.split(';')[0].trim().toLowerCase()

    if (ct.includes('application/json')) {
      const text = await (res.data as Blob).text()
      try {
        const j = JSON.parse(text) as { message?: string }
        toast.error(j.message || 'Erreur document')
      } catch {
        toast.error('Erreur document')
      }
      return
    }

    const blob = res.data as Blob
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank', 'noopener,noreferrer')
    if (!w) {
      toast.error('Autorisez les fenetres popup pour afficher le PDF')
      URL.revokeObjectURL(url)
      return
    }
    setTimeout(() => URL.revokeObjectURL(url), 180_000)
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: Blob } }
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const j = JSON.parse(text) as { message?: string }
        toast.error(j.message || `Erreur ${err.response.status ?? ''}`)
      } catch {
        toast.error('Impossible douvrir le PDF')
      }
      return
    }
    toast.error('Impossible douvrir le PDF')
  }
}
