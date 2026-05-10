import { buildExpeditionDefaultsPayload } from '@/lib/appSettingsSectionPayloads'
import { Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsCard } from '../SettingsCard'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferenceExpeditionDefaultsSectionProps extends ReferenceSectionSaveProps {
  expDef: Record<string, unknown>
  setE: (k: string, v: unknown) => void
}

export function ReferenceExpeditionDefaultsSection({
  expDef,
  setE,
  save,
  isPending,
}: ReferenceExpeditionDefaultsSectionProps) {
  return (
    <SettingsCard
      title="Paramètres expédition (défauts)"
      icon={Box}
      description="Cubage et pourcentages indicatifs utilisés côté expédition"
      actions={
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => save('Défauts expédition', buildExpeditionDefaultsPayload(expDef))}
        >
          Enregistrer
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Diviseur volumétrique (cm³ / kg)</Label>
          <Input
            type="number"
            min={1}
            value={String(expDef.volumetric_divisor ?? '')}
            onChange={(e) => setE('volumetric_divisor', e.target.value)}
            placeholder="Ex. 5000"
          />
          <p className="text-xs text-muted-foreground">Laisser vide pour ne pas fixer de valeur globale.</p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Poids utilisé pour le tarif au kilogramme</Label>
          <Select
            value={String(expDef.billable_weight_rule ?? 'max')}
            onValueChange={(v) => setE('billable_weight_rule', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="max">Plus élevé : poids réel ou volumétrique équivalent</SelectItem>
              <SelectItem value="min">Plus faible : poids réel ou volumétrique équivalent</SelectItem>
              <SelectItem value="real">Poids réel uniquement</SelectItem>
              <SelectItem value="volumetric">Poids volumétrique équivalent uniquement</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Réglage global pour les prévisualisations et le calcul lorsque le mode facture au kg. Sans dimensions
            valides pour le volumétrique, le poids réel est utilisé pour éviter une base vide.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Assurance par défaut (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={String(expDef.default_insurance_pct ?? '')}
            onChange={(e) => setE('default_insurance_pct', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Droits de douane par défaut (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={String(expDef.default_customs_duty_pct ?? '')}
            onChange={(e) => setE('default_customs_duty_pct', e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Taxe par défaut (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={String(expDef.default_tax_pct ?? '')}
            onChange={(e) => setE('default_tax_pct', e.target.value)}
          />
        </div>
      </div>
    </SettingsCard>
  )
}
