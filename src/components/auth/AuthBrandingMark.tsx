import { useState } from 'react'
import { Package } from 'lucide-react'
import { usePublicBranding } from '@/hooks/useSettings'
import { resolveImageUrl } from '@/lib/resolveImageUrl'
import { cn } from '@/lib/utils'

type AuthBrandingMarkProps = {
  className?: string
}

/** En-tête marque pour panneaux login / inscription : logo et nom depuis les paramètres. */
export function AuthBrandingMark({ className }: AuthBrandingMarkProps) {
  const { data: branding } = usePublicBranding()
  const [logoFailed, setLogoFailed] = useState(false)

  const hub = String(branding?.hub_brand_name ?? '').trim()
  const site = String(branding?.site_name ?? '').trim()
  const name = hub || site || 'Monrespro'
  const logoStored = branding?.logo_url
  const logoSrc =
    logoStored != null && String(logoStored).trim() !== '' && !logoFailed
      ? resolveImageUrl(String(logoStored))
      : ''
  const showBeside = branding?.show_sidebar_brand_with_logo !== false
  const effectiveLogo = logoSrc !== ''

  return (
    <div className={cn('flex min-w-0 items-center gap-3 mb-8', className)}>
      {effectiveLogo ? (
        <img
          src={logoSrc}
          alt=""
          className="h-12 max-h-12 w-auto max-w-[min(220px,70vw)] shrink-0 object-contain object-left"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
          <Package size={24} />
        </div>
      )}
      {(!effectiveLogo || showBeside) && (
        <span className="min-w-0 truncate text-2xl font-bold tracking-tight">{name}</span>
      )}
    </div>
  )
}
