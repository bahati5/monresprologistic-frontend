import { buildPrealertPayload } from '@/lib/appSettingsSectionPayloads'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '../SettingsCard'
import { NomenclaturePatternPanel } from '../NomenclaturePatternPanel'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferencePrealertSectionProps extends ReferenceSectionSaveProps {
  prealert: Record<string, unknown>
  setP: (k: string, v: unknown) => void
}

export function ReferencePrealertSection({ prealert, setP, save, isPending }: ReferencePrealertSectionProps) {
  return (
    <SettingsCard
      title="Préalertes (ASN)"
      icon={ClipboardList}
      actions={
        <Button size="sm" disabled={isPending} onClick={() => save('Préalertes', buildPrealertPayload(prealert))}>
          Enregistrer
        </Button>
      }
    >
      <NomenclaturePatternPanel
        profile="configurable_seq"
        pattern={String(prealert.prealert_reference_format ?? '{prefix}-{seq}')}
        onPatternChange={(v) => setP('prealert_reference_format', v)}
        previewForm={prealert}
        nextSeqKey="prealert_next_seq"
        sectionDescription="Références des préalertes (ASN)."
        configurable={{
          keys: {
            prefixKey: 'prealert_reference_prefix',
            padKey: 'prealert_reference_seq_pad',
            nextSeqKey: 'prealert_next_seq',
          },
          defaults: { prefix: 'ASN', pad: 4 },
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>Préfixe</Label>
            <Input
              value={String(prealert.prealert_reference_prefix ?? 'ASN')}
              onChange={(e) => setP('prealert_reference_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Padding</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={String(prealert.prealert_reference_seq_pad ?? '4')}
              onChange={(e) => setP('prealert_reference_seq_pad', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Prochain compteur</Label>
            <Input
              type="number"
              min={1}
              value={String(prealert.prealert_next_seq ?? '1')}
              onChange={(e) => setP('prealert_next_seq', e.target.value)}
            />
          </div>
        </div>
      </NomenclaturePatternPanel>
    </SettingsCard>
  )
}
