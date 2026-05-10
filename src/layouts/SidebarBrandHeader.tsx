import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'

export function SidebarBrandHeader({
  isRail,
  brandName,
  logoSrc,
  faviconUrl,
  showBrandBesideLogo,
  onExpandSidebar,
  onCollapseSidebar,
}: {
  isRail: boolean
  brandName: string
  logoSrc: string
  faviconUrl: string
  showBrandBesideLogo: boolean
  onExpandSidebar: () => void
  onCollapseSidebar: () => void
}) {
  const [mediaFailed, setMediaFailed] = useState(false)
  const effectiveLogoShown = logoSrc !== '' && !mediaFailed
  const collapsedMarkSrc =
    faviconUrl && faviconUrl.length > 0 ? faviconUrl : effectiveLogoShown ? logoSrc : ''
  const showSidebarTitle = !effectiveLogoShown || showBrandBesideLogo

  const onImgError = () => setMediaFailed(true)

  if (isRail) {
    return (
      <div className="flex flex-col items-center gap-1 border-b border-sidebar-border px-1 py-2">
        <Link
          to="/dashboard"
          title={brandName}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/5"
        >
          {collapsedMarkSrc ? (
            <img
              src={collapsedMarkSrc}
              alt=""
              className="h-7 w-7 rounded-md object-contain"
              onError={onImgError}
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary">
              <Package size={18} className="text-white" />
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onExpandSidebar}
          title="Agrandir le menu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-white/5 hover:text-sidebar-foreground"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-14 min-w-0 items-center gap-1 border-b border-sidebar-border px-2.5">
      <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
        {effectiveLogoShown ? (
          <img
            src={logoSrc}
            alt=""
            className="h-8 max-h-8 w-auto max-w-[min(100px,32%)] shrink-0 object-contain object-left"
            onError={onImgError}
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary">
            <Package size={18} className="text-white" />
          </div>
        )}
        {showSidebarTitle ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-w-0 truncate text-sm font-bold text-sidebar-foreground tracking-tight"
          >
            {brandName}
          </motion.span>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={onCollapseSidebar}
        title="Réduire le menu"
        className="hidden shrink-0 rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-white/5 hover:text-sidebar-foreground lg:block"
      >
        <ChevronLeft size={17} />
      </button>
    </div>
  )
}
