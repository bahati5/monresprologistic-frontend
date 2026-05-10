import { buildTrackingPayload } from '@/lib/appSettingsSectionPayloads'
import { Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '../SettingsCard'
import { NomenclaturePatternPanel } from '../NomenclaturePatternPanel'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferenceTrackingSectionProps extends ReferenceSectionSaveProps {
  tracking: Record<string, unknown>
  setT: (k: string, v: unknown) => void
}

export function ReferenceTrackingSection({ tracking, setT, save, isPending }: ReferenceTrackingSectionProps) {
  return (
    <SettingsCard
      title="Numéro de suivi public"
      icon={Route}
      description="Format affiché au client pour suivre une expédition"
      actions={
        <Button size="sm" disabled={isPending} onClick={() => save('Suivi', buildTrackingPayload(tracking))}>
          Enregistrer
        </Button>
      }
    >
      <NomenclaturePatternPanel
        profile="tracking"
        pattern={String(tracking.shipment_tracking_format ?? '{prefix}-{random}')}
        onPatternChange={(v) => setT('shipment_tracking_format', v)}
        previewForm={tracking}
        nextSeqKey="shipment_tracking_next_seq"
        sectionDescription="Numéro public de suivi d’expédition. Sans {seq}, seul l’aléatoire est utilisé."
      >
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>Préfixe</Label>
            <Input
              value={String(tracking.tracking_prefix ?? 'MRP')}
              onChange={(e) => setT('tracking_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Longueur aléatoire ({'{random}'})</Label>
            <Input
              type="number"
              min={4}
              max={32}
              value={String(tracking.tracking_number_length ?? '8')}
              onChange={(e) => setT('tracking_number_length', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Padding {'{seq}'}</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={String(tracking.shipment_tracking_seq_pad ?? '6')}
              onChange={(e) => setT('shipment_tracking_seq_pad', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Prochain compteur {'{seq}'}</Label>
            <Input
              type="number"
              min={1}
              value={String(tracking.shipment_tracking_next_seq ?? '1')}
              onChange={(e) => setT('shipment_tracking_next_seq', e.target.value)}
            />
          </div>
        </div>
      </NomenclaturePatternPanel>
    </SettingsCard>
  )
}
