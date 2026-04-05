import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import { useAppSettings, useFormatMoney } from '@/hooks/useSettings'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { useCreateInvoice } from '@/hooks/useFinance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { BillingExtra } from '@/types/settings'
import { displayLocalized } from '@/lib/localizedString'

type ExtraRow = {
  key: string
  billing_extra_id: number | null
  label: string
  calculation_description: string
  type: 'percentage' | 'fixed'
  value: string
}

function computeLineAmount(base: number, type: 'percentage' | 'fixed', value: number): number {
  if (type === 'fixed') return Math.round(Math.max(value, 0) * 100) / 100
  return Math.round(Math.max(base, 0) * Math.max(value, 0) * 100) / 10000
}

export function ShipmentInvoiceCreatePanel({
  shipmentId,
  defaultBaseAmount,
  currencyHint,
}: {
  shipmentId: string
  defaultBaseAmount: number
  currencyHint?: string | null
}) {
  const qc = useQueryClient()
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

  const currency = (currencyHint || appSettings?.currency || 'USD').toUpperCase()
  const currencyUi = resolveMoneySymbol({
    currency,
    currency_symbol: String(appSettings?.currency_symbol ?? ''),
  })

  const [useExtras, setUseExtras] = useState(false)
  const [simpleAmount, setSimpleAmount] = useState(String(defaultBaseAmount ?? 0))
  const [baseAmount, setBaseAmount] = useState(String(defaultBaseAmount ?? 0))
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([])

  const [newExtraOpen, setNewExtraOpen] = useState(false)
  const [newExtraForm, setNewExtraForm] = useState({
    label: '',
    calculation_description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
  })
  const createCatalogExtra = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/api/finance/billing-extras', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'billing-extras-catalog'] })
      qc.invalidateQueries({ queryKey: ['settings', 'billing_extras'] })
      toast.success('Extra créé')
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Erreur'),
  })

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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={!useExtras ? 'default' : 'outline'}
              onClick={() => setUseExtras(false)}
            >
              Montant simple
            </Button>
            <Button
              type="button"
              size="sm"
              variant={useExtras ? 'default' : 'outline'}
              onClick={() => setUseExtras(true)}
            >
              Base + extras
            </Button>
          </div>

          {!useExtras ? (
            <div className="space-y-2">
              <Label>Montant ({currencyUi})</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={simpleAmount}
                onChange={(e) => setSimpleAmount(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Montant de base ({currencyUi})</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Extras</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      onValueChange={(v) => {
                        const id = Number(v)
                        const found = catalog.find((x) => x.id === id)
                        if (found) addFromCatalog(found)
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Ajouter du catalogue" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {displayLocalized(e.label as unknown)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" onClick={addAdHocRow}>
                      Ligne libre
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setNewExtraOpen(true)}>
                      Nouvel extra (catalogue)
                    </Button>
                  </div>
                </div>

                {extraRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune ligne d&apos;extra.</p>
                ) : (
                  <div className="space-y-3 rounded-md border p-3">
                    {extraRows.map((r) => (
                      <div key={r.key} className="grid gap-2 border-b pb-3 last:border-0 last:pb-0 md:grid-cols-2">
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">Libellé</Label>
                          <Input
                            value={r.label}
                            disabled={r.billing_extra_id != null}
                            onChange={(e) => updateRow(r.key, { label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={r.type}
                            disabled={r.billing_extra_id != null}
                            onValueChange={(v) => updateRow(r.key, { type: v as ExtraRow['type'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Pourcentage</SelectItem>
                              <SelectItem value="fixed">Fixe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valeur</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={r.value}
                            disabled={r.billing_extra_id != null}
                            onChange={(e) => updateRow(r.key, { value: e.target.value })}
                          />
                        </div>
                        <div className="flex items-end md:col-span-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(r.key)}>
                            Retirer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Total estimé : <strong>{formatMoney(previewTotal)}</strong> (base {formatMoney(baseNum)} + extras{' '}
                {formatMoney(extrasTotal)})
              </p>
            </>
          )}

          <Button type="button" onClick={submit} disabled={createInvoice.isPending}>
            {createInvoice.isPending ? 'Enregistrement…' : 'Enregistrer la facture'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={newExtraOpen} onOpenChange={setNewExtraOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel extra (catalogue)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Libellé</Label>
              <Input
                value={newExtraForm.label}
                onChange={(e) => setNewExtraForm((p) => ({ ...p, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Mode de calcul</Label>
              <Textarea
                rows={2}
                value={newExtraForm.calculation_description}
                onChange={(e) => setNewExtraForm((p) => ({ ...p, calculation_description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={newExtraForm.type}
                onValueChange={(v) =>
                  setNewExtraForm((p) => ({ ...p, type: v as typeof p.type }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage</SelectItem>
                  <SelectItem value="fixed">Fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Valeur</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={newExtraForm.value}
                onChange={(e) => setNewExtraForm((p) => ({ ...p, value: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewExtraOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={createCatalogExtra.isPending || !newExtraForm.label.trim()}
              onClick={() => {
                const v = Number(newExtraForm.value) || 0
                createCatalogExtra.mutate(
                  {
                    label: newExtraForm.label.trim(),
                    calculation_description: newExtraForm.calculation_description.trim() || null,
                    type: newExtraForm.type,
                    value: v,
                    is_active: true,
                  } as Record<string, unknown>,
                  {
                    onSuccess: () => {
                      setNewExtraOpen(false)
                      setNewExtraForm({
                        label: '',
                        calculation_description: '',
                        type: 'percentage',
                        value: '',
                      })
                    },
                  },
                )
              }}
            >
              {createCatalogExtra.isPending ? 'Création…' : 'Créer dans le catalogue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
