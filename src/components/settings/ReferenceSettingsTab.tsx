import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppSettings, useUpdateAppSettingsPartial } from '@/hooks/useSettings'
import { SettingsCard } from './SettingsCard'
import { LockerSettings } from './LockerSettings'
import { NomenclaturePatternPanel } from './NomenclaturePatternPanel'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import {
  buildLockerPayload,
  buildTrackingPayload,
  buildShipmentInvoicePdfPayload,
  buildExpeditionDefaultsPayload,
  buildFinanceInvoicePayload,
  buildPrealertPayload,
  buildPurchaseOrderPayload,
  buildCustomerPackagePayload,
} from '@/lib/appSettingsSectionPayloads'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import {
  MapPin,
  Route,
  Receipt,
  Box,
  FileSpreadsheet,
  ClipboardList,
  ShoppingCart,
  Package,
  Hash,
} from 'lucide-react'
import type { AppSettings } from '@/types/settings'

function toFormRecord(s: AppSettings | undefined): Record<string, unknown> {
  if (!s) return {}
  return { ...(s as unknown as Record<string, unknown>) }
}

export default function ReferenceSettingsTab() {
  const { data: settings, isLoading } = useAppSettings()
  const updatePartial = useUpdateAppSettingsPartial()

  const [locker, setLocker] = useState<Record<string, unknown>>({})
  const [tracking, setTracking] = useState<Record<string, unknown>>({})
  const [shipInv, setShipInv] = useState<Record<string, unknown>>({})
  const [expDef, setExpDef] = useState<Record<string, unknown>>({})
  const [finInv, setFinInv] = useState<Record<string, unknown>>({})
  const [prealert, setPrealert] = useState<Record<string, unknown>>({})
  const [po, setPo] = useState<Record<string, unknown>>({})
  const [pkg, setPkg] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const f = toFormRecord(settings)
    setLocker(f)
    setTracking(f)
    setShipInv(f)
    setExpDef({
      volumetric_divisor: f.volumetric_divisor != null && f.volumetric_divisor !== '' ? String(f.volumetric_divisor) : '',
      default_insurance_pct: f.default_insurance_pct ?? '',
      default_customs_duty_pct: f.default_customs_duty_pct ?? '',
      default_tax_pct: f.default_tax_pct ?? '',
    })
    setFinInv(f)
    setPrealert(f)
    setPo(f)
    setPkg(f)
  }, [settings])

  const setL = useCallback((k: string, v: unknown) => setLocker((p) => ({ ...p, [k]: v })), [])
  const setT = useCallback((k: string, v: unknown) => setTracking((p) => ({ ...p, [k]: v })), [])
  const setS = useCallback((k: string, v: unknown) => setShipInv((p) => ({ ...p, [k]: v })), [])
  const setE = useCallback((k: string, v: unknown) => setExpDef((p) => ({ ...p, [k]: v })), [])
  const setF = useCallback((k: string, v: unknown) => setFinInv((p) => ({ ...p, [k]: v })), [])
  const setP = useCallback((k: string, v: unknown) => setPrealert((p) => ({ ...p, [k]: v })), [])
  const setO = useCallback((k: string, v: unknown) => setPo((p) => ({ ...p, [k]: v })), [])
  const setK = useCallback((k: string, v: unknown) => setPkg((p) => ({ ...p, [k]: v })), [])

  const save = useCallback(
    (label: string, payload: Record<string, unknown>) => {
      updatePartial.mutate(payload, {
        onSuccess: () => toast.success(`${label} enregistré.`),
      })
    },
    [updatePartial],
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Hash className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Nomenclature</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Formats de numérotation et compteurs. Chaque onglet s&apos;enregistre indépendamment (mise à jour
              partielle).
            </p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="locker" className="w-full">
        <TabsList className={`${settingsInnerTabsList} flex-wrap h-auto gap-1 py-2`}>
          <TabsTrigger value="locker" className={settingsInnerTabsTrigger}>
            Casier
          </TabsTrigger>
          <TabsTrigger value="tracking" className={settingsInnerTabsTrigger}>
            Suivi
          </TabsTrigger>
          <TabsTrigger value="ship-inv" className={settingsInnerTabsTrigger}>
            Facture expédition
          </TabsTrigger>
          <TabsTrigger value="exp-defaults" className={settingsInnerTabsTrigger}>
            Expédition
          </TabsTrigger>
          <TabsTrigger value="fin-inv" className={settingsInnerTabsTrigger}>
            Facture finance
          </TabsTrigger>
          <TabsTrigger value="prealert" className={settingsInnerTabsTrigger}>
            Préalertes
          </TabsTrigger>
          <TabsTrigger value="po" className={settingsInnerTabsTrigger}>
            Bons d&apos;achat
          </TabsTrigger>
          <TabsTrigger value="pkg" className={settingsInnerTabsTrigger}>
            Colis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locker" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Casier virtuel"
            icon={MapPin}
            description="Adresse du hub et format du numéro de casier client"
            actions={
              <Button
                size="sm"
                disabled={updatePartial.isPending}
                onClick={() => save('Casier', buildLockerPayload(locker))}
              >
                Enregistrer
              </Button>
            }
          >
            <LockerSettings form={locker} set={setL} />
          </SettingsCard>
        </TabsContent>

        <TabsContent value="tracking" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Numéro de suivi public"
            icon={Route}
            description="Format affiché au client pour suivre une expédition"
            actions={
              <Button
                size="sm"
                disabled={updatePartial.isPending}
                onClick={() => save('Suivi', buildTrackingPayload(tracking))}
              >
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
        </TabsContent>

        <TabsContent value="ship-inv" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Facture PDF expédition"
            icon={Receipt}
            description="Numéro sur le document, termes et signatures"
            actions={
              <Button
                size="sm"
                disabled={updatePartial.isPending}
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
                <Input value={String(shipInv.signing_company ?? '')} onChange={(e) => setS('signing_company', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Libellé signature client</Label>
                <Input value={String(shipInv.signing_customer ?? '')} onChange={(e) => setS('signing_customer', e.target.value)} />
              </div>
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="exp-defaults" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Paramètres expédition (défauts)"
            icon={Box}
            description="Cubage et pourcentages indicatifs utilisés côté expédition"
            actions={
              <Button
                size="sm"
                disabled={updatePartial.isPending}
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
        </TabsContent>

        <TabsContent value="fin-inv" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Factures finance (portail)"
            icon={FileSpreadsheet}
            description="Numérotation des factures émises depuis la partie finance"
            actions={
              <Button
                size="sm"
                disabled={updatePartial.isPending}
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
        </TabsContent>

        <TabsContent value="prealert" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Préalertes (ASN)"
            icon={ClipboardList}
            actions={
              <Button
                size="sm"
                disabled={updatePartial.isPending}
                onClick={() => save('Préalertes', buildPrealertPayload(prealert))}
              >
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
        </TabsContent>

        <TabsContent value="po" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Bons d&apos;achat (PO)"
            icon={ShoppingCart}
            actions={
              <Button size="sm" disabled={updatePartial.isPending} onClick={() => save("Bons d'achat", buildPurchaseOrderPayload(po))}>
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
        </TabsContent>

        <TabsContent value="pkg" className={settingsInnerTabsContent}>
          <SettingsCard
            title="Colis réception (PKG)"
            icon={Package}
            actions={
              <Button size="sm" disabled={updatePartial.isPending} onClick={() => save('Colis réception', buildCustomerPackagePayload(pkg))}>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
