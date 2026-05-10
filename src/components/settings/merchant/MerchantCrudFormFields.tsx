import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { MerchantFormState } from '@/components/settings/merchant/merchantTypes'

interface MerchantCrudFormFieldsProps {
  form: MerchantFormState
  set: (k: keyof MerchantFormState, v: string | boolean) => void
}

export function MerchantCrudFormFields({ form, set }: MerchantCrudFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="m-name">Nom du marchand</Label>
        <Input
          id="m-name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Amazon"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="m-domains">Domaines associés (séparés par des virgules)</Label>
        <Input
          id="m-domains"
          value={form.domainsInput}
          onChange={(e) => set('domainsInput', e.target.value)}
          placeholder="amazon.fr, amazon.com, amzn.eu, amzn.to"
        />
        <p className="text-xs text-muted-foreground">
          Saisissez des fragments reconnus dans le nom d’hôte du lien (ex. <span className="font-mono">amzn.eu</span>{' '}
          pour les liens courts).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="m-logo">URL du logo (optionnel)</Label>
        <Input
          id="m-logo"
          value={form.logo_url}
          onChange={(e) => set('logo_url', e.target.value)}
          placeholder="https://…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="m-commission">Commission (%)</Label>
        <Input
          id="m-commission"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={form.commission_rate}
          onChange={(e) => set('commission_rate', e.target.value)}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">Commission auto-calculée pour ce marchand.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="m-delivery">Délai estimé (jours)</Label>
        <Input
          id="m-delivery"
          type="number"
          min={1}
          value={form.estimated_delivery_days}
          onChange={(e) => set('estimated_delivery_days', e.target.value)}
          placeholder="7"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="m-order">Ordre d’affichage</Label>
        <Input
          id="m-order"
          type="number"
          min={0}
          step={1}
          value={form.sort_order}
          onChange={(e) => set('sort_order', e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 px-3 py-2">
        <div>
          <p className="text-sm font-medium">Actif</p>
          <p className="text-xs text-muted-foreground">Visible pour les clients et l’auto-détection</p>
        </div>
        <Switch checked={form.is_active} onCheckedChange={(c) => set('is_active', c)} />
      </div>
    </div>
  )
}
