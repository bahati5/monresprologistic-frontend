import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAppSettings, useUpdateAppSettingsPartial } from '@/hooks/useSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { settingsInnerTabsContent, settingsInnerTabsList, settingsInnerTabsTrigger } from './innerTabStyles'
import { Hash } from 'lucide-react'
import { toFormRecord } from './reference/toFormRecord'
import { ReferenceLockerSection } from './reference/ReferenceLockerSection'
import { ReferenceTrackingSection } from './reference/ReferenceTrackingSection'
import { ReferenceShipmentInvoiceSection } from './reference/ReferenceShipmentInvoiceSection'
import { ReferenceExpeditionDefaultsSection } from './reference/ReferenceExpeditionDefaultsSection'
import { ReferenceFinanceInvoiceSection } from './reference/ReferenceFinanceInvoiceSection'
import { ReferencePrealertSection } from './reference/ReferencePrealertSection'
import { ReferencePurchaseOrderSection } from './reference/ReferencePurchaseOrderSection'
import { ReferenceCustomerPackageSection } from './reference/ReferenceCustomerPackageSection'
import { ReferenceQuoteSection } from './reference/ReferenceQuoteSection'

/* eslint-disable react-hooks/set-state-in-effect */
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
  const [quote, setQuote] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const f = toFormRecord(settings)
    setLocker(f)
    setTracking(f)
    setShipInv(f)
    setExpDef({
      volumetric_divisor: f.volumetric_divisor != null && f.volumetric_divisor !== '' ? String(f.volumetric_divisor) : '',
      billable_weight_rule: (() => {
        const r = String((f as Record<string, unknown>).billable_weight_rule ?? '').trim()
        return r === 'max' || r === 'min' || r === 'real' || r === 'volumetric' ? r : 'max'
      })(),
      default_insurance_pct: f.default_insurance_pct ?? '',
      default_customs_duty_pct: f.default_customs_duty_pct ?? '',
      default_tax_pct: f.default_tax_pct ?? '',
    })
    setFinInv(f)
    setPrealert(f)
    setPo(f)
    setPkg(f)
    setQuote(f)
  }, [settings])

  const setL = useCallback((k: string, v: unknown) => setLocker((p) => ({ ...p, [k]: v })), [])
  const setT = useCallback((k: string, v: unknown) => setTracking((p) => ({ ...p, [k]: v })), [])
  const setS = useCallback((k: string, v: unknown) => setShipInv((p) => ({ ...p, [k]: v })), [])
  const setE = useCallback((k: string, v: unknown) => setExpDef((p) => ({ ...p, [k]: v })), [])
  const setF = useCallback((k: string, v: unknown) => setFinInv((p) => ({ ...p, [k]: v })), [])
  const setP = useCallback((k: string, v: unknown) => setPrealert((p) => ({ ...p, [k]: v })), [])
  const setO = useCallback((k: string, v: unknown) => setPo((p) => ({ ...p, [k]: v })), [])
  const setK = useCallback((k: string, v: unknown) => setPkg((p) => ({ ...p, [k]: v })), [])
  const setQ = useCallback((k: string, v: unknown) => setQuote((p) => ({ ...p, [k]: v })), [])

  const save = useCallback(
    (label: string, payload: Record<string, unknown>) => {
      updatePartial.mutate(payload, {
        onSuccess: () => toast.success(`${label} enregistré.`),
      })
    },
    [updatePartial],
  )

  const isPending = updatePartial.isPending

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
          <TabsTrigger value="quote" className={settingsInnerTabsTrigger}>
            Devis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locker" className={settingsInnerTabsContent}>
          <ReferenceLockerSection locker={locker} setL={setL} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="tracking" className={settingsInnerTabsContent}>
          <ReferenceTrackingSection tracking={tracking} setT={setT} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="ship-inv" className={settingsInnerTabsContent}>
          <ReferenceShipmentInvoiceSection shipInv={shipInv} setS={setS} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="exp-defaults" className={settingsInnerTabsContent}>
          <ReferenceExpeditionDefaultsSection expDef={expDef} setE={setE} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="fin-inv" className={settingsInnerTabsContent}>
          <ReferenceFinanceInvoiceSection finInv={finInv} setF={setF} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="prealert" className={settingsInnerTabsContent}>
          <ReferencePrealertSection prealert={prealert} setP={setP} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="po" className={settingsInnerTabsContent}>
          <ReferencePurchaseOrderSection po={po} setO={setO} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="pkg" className={settingsInnerTabsContent}>
          <ReferenceCustomerPackageSection pkg={pkg} setK={setK} save={save} isPending={isPending} />
        </TabsContent>

        <TabsContent value="quote" className={settingsInnerTabsContent}>
          <ReferenceQuoteSection quote={quote} setQ={setQ} save={save} isPending={isPending} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
