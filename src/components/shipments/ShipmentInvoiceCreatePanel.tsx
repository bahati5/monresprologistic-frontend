import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { useAppSettings, useFormatMoney } from '@/hooks/useSettings'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { useCreateInvoice } from '@/hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BillingExtra } from '@/types/settings'
import { NewBillingExtraCatalogDialog } from './invoice/NewBillingExtraCatalogDialog'
import { ShipmentInvoiceExtrasEditor } from './invoice/ShipmentInvoiceExtrasEditor'
import { computeLineAmount, type ExtraRow } from './invoice/ShipmentInvoiceExtrasTypes'
import { ShipmentInvoiceModeToggle } from '@/components/shipments/invoice/ShipmentInvoiceModeToggle'
import { ShipmentInvoiceSimpleAmountFields } from '@/components/shipments/invoice/ShipmentInvoiceSimpleAmountFields'

export function ShipmentInvoiceCreatePanel({
  shipmentId,
  defaultBaseAmount,
  currencyHint,
}: {
  shipmentId: string
  defaultBaseAmount: number
  currencyHint?: string | null
}) {
  const { data: appSettings } = useAppSettings()
  const { formatMoney } = useFormatMoney()
  const { data: catalog = [] } = useQuery({
    queryKey: ['finance', 'billing-extras-catalog'],
    queryFn: () =>
      api
        .get<{ billing_extras?: BillingExtra[] }>('/api/finance/billing-extras')
        .then((r) => (Array.isArray(r.data?.billing_extras) ? r.data.billing_extras! : [])),
  })
  const createInvoice = useCreateInvoice()

  const currency = (currencyHint || appSettings?.currency || '').toUpperCase()
  const currencyUi = resolveMoneySymbol({
    currency,
    currency_symbol: String(appSettings?.currency_symbol ?? ''),
  })

  const [useExtras, setUseExtras] = useState(false)
  const [simpleAmount, setSimpleAmount] = useState(String(defaultBaseAmount ?? 0))
  const [baseAmount, setBaseAmount] = useState(String(defaultBaseAmount ?? 0))
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([])

  const [newExtraOpen, setNewExtraOpen] = useState(false)

  const baseNum = Number(baseAmount) || 0
  const extrasTotal = useMemo(() => {
    let s = 0
    for (const r of extraRows) {
      const v = Number(r.value) || 0
      s += computeLineAmount(baseNum, r.type, v)
    }
    return Math.round(s * 100) / 100
  }, [extraRows, baseNum])

  const previewTotal = useExtras ? Math.round((baseNum + extrasTotal) * 100) / 100 : Number(simpleAmount) || 0

  const addFromCatalog = (e: BillingExtra) => {
    setExtraRows((rows) => [
      ...rows,
      {
        key: `${e.id}-${Date.now()}`,
        billing_extra_id: e.id,
        label: e.label,
        calculation_description: e.calculation_description ?? '',
        type: e.type,
        value: String(e.value),
      },
    ])
  }

  const addAdHocRow = () => {
    setExtraRows((rows) => [
      ...rows,
      {
        key: `adhoc-${Date.now()}`,
        billing_extra_id: null,
        label: '',
        calculation_description: '',
        type: 'percentage',
        value: '0',
      },
    ])
  }

  const updateRow = (key: string, patch: Partial<ExtraRow>) => {
    setExtraRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const removeRow = (key: string) => {
    setExtraRows((rows) => rows.filter((r) => r.key !== key))
  }

  const submit = () => {
    if (useExtras) {
      const lines = extraRows.map((r) => ({
        billing_extra_id: r.billing_extra_id,
        label: r.label.trim(),
        calculation_description: r.calculation_description.trim() || null,
        type: r.type,
        value: Number(r.value) || 0,
      }))
      for (const line of lines) {
        if (!line.label || line.value < 0) {
          return
        }
      }
      createInvoice.mutate({
        shipment_id: Number(shipmentId),
        currency,
        base_amount: baseNum,
        extra_lines: lines,
      })
    } else {
      const amt = Number(simpleAmount) || 0
      createInvoice.mutate({
        shipment_id: Number(shipmentId),
        currency,
        amount: amt,
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Créer une facture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ShipmentInvoiceModeToggle
            useExtras={useExtras}
            onSimple={() => setUseExtras(false)}
            onExtras={() => setUseExtras(true)}
          />

          {!useExtras ? (
            <ShipmentInvoiceSimpleAmountFields
              currencyUi={currencyUi}
              value={simpleAmount}
              onChange={setSimpleAmount}
            />
          ) : (
            <ShipmentInvoiceExtrasEditor
              catalog={catalog}
              currencyUi={currencyUi}
              baseAmount={baseAmount}
              onBaseAmountChange={setBaseAmount}
              extraRows={extraRows}
              formatMoney={formatMoney}
              previewTotal={previewTotal}
              baseNum={baseNum}
              extrasTotal={extrasTotal}
              onOpenNewCatalogExtra={() => setNewExtraOpen(true)}
              addFromCatalog={addFromCatalog}
              addAdHocRow={addAdHocRow}
              updateRow={updateRow}
              removeRow={removeRow}
            />
          )}

          <Button type="button" onClick={submit} disabled={createInvoice.isPending}>
            {createInvoice.isPending ? 'Enregistrement…' : 'Enregistrer la facture'}
          </Button>
        </CardContent>
      </Card>

      <NewBillingExtraCatalogDialog open={newExtraOpen} onOpenChange={setNewExtraOpen} />
    </>
  )
}
