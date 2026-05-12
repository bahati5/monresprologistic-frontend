import { useState, useEffect } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useQuoteCurrencySettings, useUpdateQuoteCurrencySettings } from '@/hooks/useQuoteCurrencySettings'
import { ISO_4217_CURRENCIES } from '@/lib/iso4217'
import type { QuoteCurrencySettings } from '@/types/assistedPurchase'

export function QuoteCurrencySection() {
  const { data: settings, isLoading, dataUpdatedAt } = useQuoteCurrencySettings()
  const updateMut = useUpdateQuoteCurrencySettings()

  const [form, setForm] = useState<QuoteCurrencySettings>({
    primary_currency: '',
    secondary_currency_enabled: false,
    secondary_currency: '',
    secondary_currency_rate_mode: 'manual',
    secondary_currency_rate: 0,
    secondary_currency_rate_updated_at: null,
  })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings, dataUpdatedAt])

  const set = <K extends keyof QuoteCurrencySettings>(k: K, v: QuoteCurrencySettings[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const exampleTotal = 538.71
  const equivalentAmount = form.secondary_currency_enabled && form.secondary_currency_rate > 0
    ? Math.round(exampleTotal * form.secondary_currency_rate)
    : null

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Chargement…</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Devise principale</CardTitle>
          <CardDescription>Tous les montants des devis sont exprimés dans cette devise.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={form.primary_currency} onValueChange={(v) => set('primary_currency', v)}>
            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ISO_4217_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Équivalent en devise secondaire</CardTitle>
              <CardDescription>
                Affiche un montant équivalent sous le total principal sur le PDF, l'email et le portail.
              </CardDescription>
            </div>
            <Switch
              checked={form.secondary_currency_enabled}
              onCheckedChange={(v) => set('secondary_currency_enabled', v)}
            />
          </div>
        </CardHeader>
        {form.secondary_currency_enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Devise secondaire</Label>
              <Select value={form.secondary_currency} onValueChange={(v) => set('secondary_currency', v)}>
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISO_4217_CURRENCIES.filter((c) => c.code !== form.primary_currency).map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Taux de conversion</Label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="rate_mode"
                    checked={form.secondary_currency_rate_mode === 'manual'}
                    onChange={() => set('secondary_currency_rate_mode', 'manual')}
                    className="accent-[#073763]"
                  />
                  Taux fixe saisi manuellement
                </label>
                {form.secondary_currency_rate_mode === 'manual' && (
                  <div className="flex items-center gap-2 ml-6">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={form.secondary_currency_rate}
                      onChange={(e) => set('secondary_currency_rate', Number(e.target.value))}
                      className="max-w-[140px]"
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.secondary_currency} pour 1 {form.primary_currency}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="rate_mode"
                    checked={form.secondary_currency_rate_mode === 'automatic'}
                    onChange={() => set('secondary_currency_rate_mode', 'automatic')}
                    className="accent-[#073763]"
                  />
                  <span>
                    Taux automatique <span className="text-muted-foreground">(source : open.er-api.com, actualisé chaque jour)</span>
                  </span>
                </label>
              </div>
            </div>

            {form.secondary_currency_rate_updated_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <RefreshCw size={12} />
                Mis à jour le : {new Date(form.secondary_currency_rate_updated_at).toLocaleDateString('fr-FR')}
              </p>
            )}

            {equivalentAmount !== null && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium">Aperçu :</p>
                <p className="text-sm font-semibold mt-1">
                  {exampleTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {form.primary_currency}
                  {' = '}
                  {equivalentAmount.toLocaleString('fr-FR')} {form.secondary_currency}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => updateMut.mutate(form)}
          disabled={updateMut.isPending}
          size="lg"
          className="gap-2"
        >
          <Save size={16} />
          {updateMut.isPending ? 'Enregistrement…' : 'Enregistrer les devises'}
        </Button>
      </div>
    </div>
  )
}
