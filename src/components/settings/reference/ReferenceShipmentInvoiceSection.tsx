import { buildShipmentInvoicePdfPayload } from '@/lib/appSettingsSectionPayloads'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { SettingsCard } from '../SettingsCard'
import { NomenclaturePatternPanel } from '../NomenclaturePatternPanel'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferenceShipmentInvoiceSectionProps extends ReferenceSectionSaveProps {
  shipInv: Record<string, unknown>
  setS: (k: string, v: unknown) => void
}

export function ReferenceShipmentInvoiceSection({
  shipInv,
  setS,
  save,
  isPending,
}: ReferenceShipmentInvoiceSectionProps) {
  return (
    <SettingsCard
      title="Facture PDF expédition"
      icon={Receipt}
      description="Numéro sur le document, termes et signatures"
      actions={
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => save('Facture expédition', buildShipmentInvoicePdfPayload(shipInv))}
        >
          Enregistrer
        </Button>
      }
    >
      <NomenclaturePatternPanel
        profile="shipment_invoice"
        pattern={String(shipInv.shipment_invoice_format ?? '{prefix}-{year}-{seq}')}
        onPatternChange={(v) => setS('shipment_invoice_format', v)}
        previewForm={shipInv}
        nextSeqKey="shipment_invoice_next_seq"
        sectionDescription="Numéro sur le PDF de facture d’expédition. {id} = identifiant interne de l’expédition (aperçu fictif)."
      >
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>Préfixe</Label>
            <Input
              value={String(shipInv.shipment_invoice_prefix ?? 'FAC')}
              onChange={(e) => setS('shipment_invoice_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Padding compteur</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={String(shipInv.shipment_invoice_seq_pad ?? '6')}
              onChange={(e) => setS('shipment_invoice_seq_pad', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Prochain numéro séquentiel</Label>
            <Input
              type="number"
              min={1}
              value={String(shipInv.shipment_invoice_next_seq ?? '1')}
              onChange={(e) => setS('shipment_invoice_next_seq', e.target.value)}
            />
          </div>
        </div>
      </NomenclaturePatternPanel>
      <Separator className="my-8" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Termes légaux (PDF)</Label>
          <Textarea
            rows={6}
            value={String(shipInv.invoice_terms ?? '')}
            onChange={(e) => setS('invoice_terms', e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>
            Prise en charge entreprise par défaut (
            {resolveMoneySymbol({
              currency: String(shipInv.currency ?? 'EUR'),
              currency_symbol: String(shipInv.currency_symbol ?? ''),
            })}
            )
          </Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={
              shipInv.default_company_coverage_amount === undefined || shipInv.default_company_coverage_amount === ''
                ? ''
                : String(shipInv.default_company_coverage_amount)
            }
            onChange={(e) => setS('default_company_coverage_amount', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Libellé signature entreprise</Label>
          <Input
            value={String(shipInv.signing_company ?? '')}
            onChange={(e) => setS('signing_company', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Libellé signature client</Label>
          <Input
            value={String(shipInv.signing_customer ?? '')}
            onChange={(e) => setS('signing_customer', e.target.value)}
          />
        </div>
      </div>
    </SettingsCard>
  )
}
