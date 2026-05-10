import { buildCustomerPackagePayload } from '@/lib/appSettingsSectionPayloads'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsCard } from '../SettingsCard'
import { NomenclaturePatternPanel } from '../NomenclaturePatternPanel'
import type { ReferenceSectionSaveProps } from './ReferenceLockerSection'

interface ReferenceCustomerPackageSectionProps extends ReferenceSectionSaveProps {
  pkg: Record<string, unknown>
  setK: (k: string, v: unknown) => void
}

export function ReferenceCustomerPackageSection({
  pkg,
  setK,
  save,
  isPending,
}: ReferenceCustomerPackageSectionProps) {
  return (
    <SettingsCard
      title="Colis réception (PKG)"
      icon={Package}
      actions={
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => save('Colis réception', buildCustomerPackagePayload(pkg))}
        >
          Enregistrer
        </Button>
      }
    >
      <NomenclaturePatternPanel
        profile="configurable_seq"
        pattern={String(pkg.customer_package_reference_format ?? '{prefix}-{seq}')}
        onPatternChange={(v) => setK('customer_package_reference_format', v)}
        previewForm={pkg}
        nextSeqKey="customer_package_next_seq"
        sectionDescription="Références des colis en réception (PKG)."
        configurable={{
          keys: {
            prefixKey: 'customer_package_reference_prefix',
            padKey: 'customer_package_reference_seq_pad',
            nextSeqKey: 'customer_package_next_seq',
          },
          defaults: { prefix: 'PKG', pad: 4 },
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label>Préfixe</Label>
            <Input
              value={String(pkg.customer_package_reference_prefix ?? 'PKG')}
              onChange={(e) => setK('customer_package_reference_prefix', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Padding</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={String(pkg.customer_package_reference_seq_pad ?? '4')}
              onChange={(e) => setK('customer_package_reference_seq_pad', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Prochain compteur</Label>
            <Input
              type="number"
              min={1}
              value={String(pkg.customer_package_next_seq ?? '1')}
              onChange={(e) => setK('customer_package_next_seq', e.target.value)}
            />
          </div>
        </div>
      </NomenclaturePatternPanel>
    </SettingsCard>
  )
}
