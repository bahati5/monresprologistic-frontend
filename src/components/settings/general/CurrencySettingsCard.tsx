import { SettingsCard } from '../SettingsCard'
import { SearchableSelectWithAdd, type SearchableOption } from '../SearchableSelectWithAdd'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ISO_4217_CURRENCIES } from '@/lib/iso4217'
import { DollarSign } from 'lucide-react'

interface CurrencySettingsCardProps {
  form: Record<string, unknown>
  set: (key: string, value: unknown) => void
  currencyOptions: SearchableOption[]
  decimalsOptions: SearchableOption[]
  symbolPositionOptions: SearchableOption[]
  onAddCurrency: () => void
}

export function CurrencySettingsCard({
  form,
  set,
  currencyOptions,
  decimalsOptions,
  symbolPositionOptions,
  onAddCurrency,
}: CurrencySettingsCardProps) {
  return (
    <SettingsCard title="Devise et format" icon={DollarSign} description="Monnaie et format des nombres">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Devise</Label>
          <SearchableSelectWithAdd
            value={String(form.currency ?? '').toUpperCase()}
            onValueChange={(v) => {
              set('currency', v)
              const iso = ISO_4217_CURRENCIES.find((c) => c.code === v)
              const custom = ((form.custom_currencies as { code: string; symbol: string }[]) ?? []).find(
                (c) => c.code.toUpperCase() === v
              )
              if (iso) set('currency_symbol', iso.symbol)
              else if (custom) set('currency_symbol', custom.symbol)
            }}
            options={currencyOptions}
            placeholder="Choisir une devise…"
            searchPlaceholder="Code ou nom…"
            emptyText="Aucune devise. Ajoutez-en une avec +."
            onAdd={onAddCurrency}
            addLabel="Ajouter une devise"
          />
        </div>
        <div className="space-y-2">
          <Label>Symbole</Label>
          <Input
            value={String(form.currency_symbol ?? '')}
            onChange={(e) => set('currency_symbol', e.target.value)}
            placeholder="$"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Position du symbole</Label>
          <SearchableSelectWithAdd
            value={String(form.currency_position ?? 'before')}
            onValueChange={(v) => set('currency_position', v)}
            options={symbolPositionOptions}
            placeholder="Position…"
            searchPlaceholder="Rechercher…"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Decimales</Label>
          <SearchableSelectWithAdd
            value={String(form.decimals ?? 2)}
            onValueChange={(v) => set('decimals', Number(v))}
            options={decimalsOptions}
            placeholder="Decimales…"
            searchPlaceholder="Rechercher…"
          />
        </div>
      </div>
    </SettingsCard>
  )
}
