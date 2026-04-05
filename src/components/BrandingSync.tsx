import { useEffect } from 'react'
import { usePublicBranding } from '@/hooks/useSettings'
import { resolveImageUrl } from '@/lib/resolveImageUrl'

/**
 * Applique favicon et titre du document depuis /api/branding (login, app authentifiée, sans droit manage_settings).
 */
export function BrandingSync() {
  const { data } = usePublicBranding()

  useEffect(() => {
    if (!data) return

    const favHref = resolveImageUrl(data.favicon_url) || resolveImageUrl(data.logo_url)
    if (favHref) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      if (/\.svg(\?|$)/i.test(favHref)) {
        link.type = 'image/svg+xml'
      } else if (/\.ico(\?|$)/i.test(favHref)) {
        link.type = 'image/x-icon'
      } else {
        link.removeAttribute('type')
      }
      link.href = favHref
    }

    const title = String(data.hub_brand_name || data.site_name || '').trim()
    if (title) {
      document.title = title
    }
  }, [data])

  return null
}
