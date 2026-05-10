import { buildFinanceInvoicePayload } from '@/lib/appSettingsSectionPayloads'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '../SettingsCard'
import { NomenclaturePatternPanel } from '../NomenclaturePatternPanel'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferenceFinanceInvoiceSectionProps extends ReferenceSectionSaveProps {
  finInv: Record<string, unknown>
  setF: (k: string, v: unknown) => void
}

export function ReferenceFinanceInvoiceSection({
  finInv,
  setF,
  save,
  isPending,
}: ReferenceFinanceInvoiceSectionProps) {
  return (
    <SettingsCard
      title="Factures finance (portail)"
      icon={FileSpreadsheet}
      description="Numérotation des factures émises depuis la partie finance"
      actions={
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => save('Facture finance', buildFinanceInvoicePayload(finInv))}
        >
          Enregistrer
        </Button>
      }
    >
      <NomenclaturePatternPanel
        profile="configurable_seq"
        pattern={String(finInv.finance_invoice_format ?? '{prefix}-{seq}')}
        onPatternChange={(v) => setF('finance_invoice_format', v)}
        previewForm={finInv}
        nextSeqKey="finance_invoice_next_seq"
        sectionDescription="Références des factures créées depuis la partie finance."
        configurable={{
          keys: {
            prefixKey: 'finance_invoice_prefix',
            padKey: 'finance_invoice_seq_pad',
            nextSeqKey: 'finance_invoice_next_seq',
          },
          defaults: { prefix: 'INV', pad: 6 },
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>Préfixe</Label>
            <Input
              value={String(finInv.finance_invoice_prefix ?? 'INV')}
              onChange={(e) => setF('finance_invoice_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Padding</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={String(finInv.finance_invoice_seq_pad ?? '6')}
              onChange={(e) => setF('finance_invoice_seq_pad', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Prochain compteur</Label>
            <Input
              type="number"
              min={1}
              value={String(finInv.finance_invoice_next_seq ?? '1')}
              onChange={(e) => setF('finance_invoice_next_seq', e.target.value)}
            />
          </div>
        </div>
      </NomenclaturePatternPanel>
    </SettingsCard>
  )
}
