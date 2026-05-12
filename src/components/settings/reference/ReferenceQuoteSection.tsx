import { buildQuoteReferencePayload } from '@/lib/appSettingsSectionPayloads'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '../SettingsCard'
import { NomenclaturePatternPanel } from '../NomenclaturePatternPanel'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferenceQuoteSectionProps extends ReferenceSectionSaveProps {
  quote: Record<string, unknown>
  setQ: (k: string, v: unknown) => void
}

export function ReferenceQuoteSection({
  quote,
  setQ,
  save,
  isPending,
}: ReferenceQuoteSectionProps) {
  return (
    <SettingsCard
      title="Devis / Achats assistés"
      icon={ClipboardList}
      description="Numérotation des références de devis"
      actions={
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => save('Devis', buildQuoteReferencePayload(quote))}
        >
          Enregistrer
        </Button>
      }
    >
      <NomenclaturePatternPanel
        profile="configurable_seq"
        pattern={String(quote.quote_reference_format ?? '{prefix}-{YYYY}-{seq}')}
        onPatternChange={(v) => setQ('quote_reference_format', v)}
        previewForm={quote}
        nextSeqKey="quote_next_seq"
        sectionDescription="Références des devis générés pour les achats assistés."
        configurable={{
          keys: {
            prefixKey: 'quote_reference_prefix',
            padKey: 'quote_reference_seq_pad',
            nextSeqKey: 'quote_next_seq',
          },
          defaults: { prefix: 'DEV', pad: 5 },
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>Préfixe</Label>
            <Input
              value={String(quote.quote_reference_prefix ?? 'DEV')}
              onChange={(e) => setQ('quote_reference_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Padding</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={String(quote.quote_reference_seq_pad ?? '5')}
              onChange={(e) => setQ('quote_reference_seq_pad', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Prochain compteur</Label>
            <Input
              type="number"
              min={1}
              value={String(quote.quote_next_seq ?? '1')}
              onChange={(e) => setQ('quote_next_seq', e.target.value)}
            />
          </div>
        </div>
      </NomenclaturePatternPanel>
    </SettingsCard>
  )
}
