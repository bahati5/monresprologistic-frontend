import { SettingsCard } from '../SettingsCard'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Image } from 'lucide-react'
import { resolveImageUrl } from '@/lib/resolveImageUrl'
import type { UseMutationResult } from '@tanstack/react-query'

interface BrandingCardProps {
  form: Record<string, unknown>
  set: (key: string, value: unknown) => void
  uploadLogo: UseMutationResult<unknown, Error, File, unknown>
  uploadFavicon: UseMutationResult<unknown, Error, File, unknown>
  logoPreviewFailed: boolean
  setLogoPreviewFailed: (v: boolean) => void
  faviconPreviewFailed: boolean
  setFaviconPreviewFailed: (v: boolean) => void
}

export function BrandingCard({
  form,
  set,
  uploadLogo,
  uploadFavicon,
  logoPreviewFailed,
  setLogoPreviewFailed,
  faviconPreviewFailed,
  setFaviconPreviewFailed,
}: BrandingCardProps) {
  return (
    <SettingsCard title="Logo et favicon" icon={Image} description="Identite visuelle">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2 flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Label htmlFor="sidebar-brand-logo">Afficher le nom à côté du logo</Label>
            <p className="text-xs text-muted-foreground max-w-xl">
              Lorsqu&apos;un logo est affiché dans la barre latérale, afficher ou masquer le texte à
              côté. Sans logo, le nom reste toujours visible.
            </p>
          </div>
          <Switch
            id="sidebar-brand-logo"
            checked={form.show_sidebar_brand_with_logo !== false}
            onCheckedChange={(v) => set('show_sidebar_brand_with_logo', v)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="hub-brand-name">Nom dans la barre latérale</Label>
          <Input
            id="hub-brand-name"
            value={String(form.hub_brand_name ?? '')}
            onChange={(e) => set('hub_brand_name', e.target.value)}
            placeholder={String(form.app_name || 'Monrespro')}
            maxLength={255}
          />
          <p className="text-xs text-muted-foreground">
            Texte affiché en haut de la sidebar (à côté du logo si activé). Laisser vide pour réutiliser
            le « Nom de l&apos;application » défini dans l&apos;onglet Identité.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Logo</Label>
          {form.logo_url != null && String(form.logo_url) !== '' && !logoPreviewFailed ? (
            <img
              src={resolveImageUrl(String(form.logo_url))}
              alt=""
              className="h-12 mb-2 rounded border border-border/60 bg-background object-contain object-left"
              onError={() => setLogoPreviewFailed(true)}
            />
          ) : null}
          {form.logo_url != null && String(form.logo_url) !== '' && logoPreviewFailed ? (
            <p className="text-xs text-destructive mb-2">
              Impossible de charger l&apos;aperçu (vérifiez le lien symbolique{' '}
              <code className="rounded bg-muted px-1">storage</code> et{' '}
              <code className="rounded bg-muted px-1">APP_URL</code> / proxy Vite).
            </p>
          ) : null}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadLogo.mutate(f)
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Favicon</Label>
          {form.favicon_url != null && String(form.favicon_url) !== '' && !faviconPreviewFailed ? (
            <img
              src={resolveImageUrl(String(form.favicon_url))}
              alt=""
              className="h-8 w-8 mb-2 rounded border border-border/60 bg-background object-contain"
              onError={() => setFaviconPreviewFailed(true)}
            />
          ) : null}
          {form.favicon_url != null && String(form.favicon_url) !== '' && faviconPreviewFailed ? (
            <p className="text-xs text-destructive mb-2">Impossible de charger le favicon.</p>
          ) : null}
          <Input
            type="file"
            accept="image/png,image/x-icon,image/vnd.microsoft.icon"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadFavicon.mutate(f)
            }}
          />
        </div>
      </div>
    </SettingsCard>
  )
}
