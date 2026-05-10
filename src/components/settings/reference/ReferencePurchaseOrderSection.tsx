import { buildPurchaseOrderPayload } from '@/lib/appSettingsSectionPayloads'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '../SettingsCard'
import { NomenclaturePatternPanel } from '../NomenclaturePatternPanel'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferencePurchaseOrderSectionProps extends ReferenceSectionSaveProps {
  po: Record<string, unknown>
  setO: (k: string, v: unknown) => void
}

export function ReferencePurchaseOrderSection({ po, setO, save, isPending }: ReferencePurchaseOrderSectionProps) {
  return (
    <SettingsCard
      title="Bons d&apos;achat (PO)"
      icon={ShoppingCart}
      actions={
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => save("Bons d'achat", buildPurchaseOrderPayload(po))}
        >
          Enregistrer
        </Button>
      }
    >
      <NomenclaturePatternPanel
        profile="configurable_seq"
        pattern={String(po.purchase_order_reference_format ?? '{prefix}-{seq}')}
        onPatternChange={(v) => setO('purchase_order_reference_format', v)}
        previewForm={po}
        nextSeqKey="purchase_order_next_seq"
        sectionDescription="Références des bons d’achat (PO)."
        configurable={{
          keys: {
            prefixKey: 'purchase_order_reference_prefix',
            padKey: 'purchase_order_reference_seq_pad',
            nextSeqKey: 'purchase_order_next_seq',
          },
          defaults: { prefix: 'PO', pad: 4 },
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>Préfixe</Label>
            <Input
              value={String(po.purchase_order_reference_prefix ?? 'PO')}
              onChange={(e) => setO('purchase_order_reference_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Padding</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={String(po.purchase_order_reference_seq_pad ?? '4')}
              onChange={(e) => setO('purchase_order_reference_seq_pad', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Prochain compteur</Label>
            <Input
              type="number"
              min={1}
              value={String(po.purchase_order_next_seq ?? '1')}
              onChange={(e) => setO('purchase_order_next_seq', e.target.value)}
            />
          </div>
        </div>
      </NomenclaturePatternPanel>
    </SettingsCard>
  )
}
