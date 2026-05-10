import { SettingsCard } from '../SettingsCard'
import { SearchableSelectWithAdd, type SearchableOption } from '../SearchableSelectWithAdd'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Globe } from 'lucide-react'

interface RegionalSettingsCardProps {
  form: Record<string, unknown>
  set: (key: string, value: unknown) => void
  timezoneOptions: SearchableOption[]
  loadingTz: boolean
  onManualTimezone: () => void
}

export function RegionalSettingsCard({
  form,
  set,
  timezoneOptions,
  loadingTz,
  onManualTimezone,
}: RegionalSettingsCardProps) {
  return (
    <SettingsCard title="Localisation" icon={Globe} description="Langue et fuseau horaire">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Langue</Label>
          <p className="text-sm text-muted-foreground">
            Application en français uniquement (paramètre enregistré sur <code className="text-xs">fr</code>).
          </p>
          <Input value="Français (fr)" disabled className="bg-muted max-w-md" readOnly />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Fuseau horaire (IANA)</Label>
          <SearchableSelectWithAdd
            value={String(form.timezone ?? '')}
            onValueChange={(v) => set('timezone', v)}
            options={timezoneOptions}
            placeholder="Choisir un fuseau…"
            searchPlaceholder="Rechercher (ex. Paris, New_York)…"
            emptyText="Aucun fuseau. Utilisez + pour une saisie manuelle."
            isLoading={loadingTz}
            onAdd={onManualTimezone}
            addLabel="Saisie manuelle du fuseau"
          />
        </div>
      </div>
    </SettingsCard>
  )
}
