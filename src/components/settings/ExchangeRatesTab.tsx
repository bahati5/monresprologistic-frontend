import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { SettingsCard } from './SettingsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Coins, History, RefreshCw } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/apiErrors'

type ExchangeRateRow = {
  id: number
  from_currency: string
  to_currency: string
  rate: string | number
  valid_from: string
  set_by_user?: { id: number; name: string } | null
}

export default function ExchangeRatesTab() {
  const qc = useQueryClient()
  const [from, setFrom] = useState('EUR')
  const [to, setTo] = useState('CDF')
  const [rate, setRate] = useState('')
  const [convAmount, setConvAmount] = useState('100')
  const [convFrom, setConvFrom] = useState('EUR')
  const [convTo, setConvTo] = useState('CDF')
  const [convResult, setConvResult] = useState<string | null>(null)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['settings', 'exchange-rates'],
    queryFn: () =>
      api
        .get<{ current_rates: ExchangeRateRow[]; history: ExchangeRateRow[] }>('/api/settings/exchange-rates')
        .then((r) => r.data),
  })

  const storeMutation = useMutation({
    mutationFn: (payload: { from_currency: string; to_currency: string; rate: number }) =>
      api.post('/api/settings/exchange-rates', payload),
    onSuccess: () => {
      toast.success('Taux enregistré.')
      setRate('')
      void qc.invalidateQueries({ queryKey: ['settings', 'exchange-rates'] })
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Impossible d’enregistrer le taux.')),
  })

  const convertMutation = useMutation({
    mutationFn: (payload: { amount: number; from: string; to: string }) =>
      api.post<{
        converted_amount: number
        rate: number
        rate_date?: string | null
      }>('/api/currency/convert', payload),
    onSuccess: (res) => {
      const r = res.data
      const rd = r.rate_date ? ` (taux du ${new Date(r.rate_date).toLocaleString('fr-FR')})` : ''
      setConvResult(`${r.converted_amount.toFixed(2)} ${convTo.trim().toUpperCase()} — taux ${Number(r.rate).toFixed(6)}${rd}`)
      toast.success('Conversion calculée.')
    },
    onError: (err: unknown) => {
      setConvResult(null)
      toast.error(getApiErrorMessage(err, 'Conversion impossible.'))
    },
  })

  const current = useMemo(() => data?.current_rates ?? [], [data?.current_rates])
  const history = useMemo(() => data?.history ?? [], [data?.history])

  const submitRate = () => {
    const r = Number(String(rate).replace(',', '.'))
    if (!Number.isFinite(r) || r <= 0) {
      toast.error('Indiquez un taux numérique strictement positif.')
      return
    }
    const f = from.trim().toUpperCase()
    const t = to.trim().toUpperCase()
    if (f.length < 3 || t.length < 3) {
      toast.error('Devises invalides (ex. EUR, CDF, USD).')
      return
    }
    storeMutation.mutate({ from_currency: f, to_currency: t, rate: r })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Taux de change</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique horodaté des taux saisis (traçabilité). Les devis PDF et le convertisseur utilisent la dernière
          ligne valide pour chaque paire.
        </p>
      </div>

      <SettingsCard
        title="Nouveau taux"
        description="Saisissez une paire source → cible. Chaque enregistrement crée une ligne datée dans l’historique."
        icon={Coins}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="xr-from">De</Label>
            <Input id="xr-from" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={8} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xr-to">Vers</Label>
            <Input id="xr-to" value={to} onChange={(e) => setTo(e.target.value)} maxLength={8} className="uppercase" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xr-rate">Taux (1 unité « de » = x « vers »)</Label>
            <Input
              id="xr-rate"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="ex. 2800"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={submitRate} disabled={storeMutation.isPending}>
            {storeMutation.isPending ? 'Enregistrement…' : 'Enregistrer le taux'}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Convertisseur indicatif"
        description="Vérifie rapidement un montant avec les taux publiés (réservé aux comptes staff : paramètres, finances ou chiffrage achat assisté — jamais les comptes portail client)."
        icon={RefreshCw}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cv-amt">Montant</Label>
            <Input id="cv-amt" inputMode="decimal" value={convAmount} onChange={(e) => setConvAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-from">De</Label>
            <Input id="cv-from" value={convFrom} onChange={(e) => setConvFrom(e.target.value)} className="uppercase" maxLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-to">Vers</Label>
            <Input id="cv-to" value={convTo} onChange={(e) => setConvTo(e.target.value)} className="uppercase" maxLength={8} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={convertMutation.isPending}
            onClick={() => {
              const amt = Number(String(convAmount).replace(',', '.'))
              if (!Number.isFinite(amt) || amt < 0) {
                toast.error('Montant invalide.')
                return
              }
              convertMutation.mutate({
                amount: amt,
                from: convFrom.trim().toUpperCase(),
                to: convTo.trim().toUpperCase(),
              })
            }}
          >
            {convertMutation.isPending ? 'Calcul…' : 'Convertir'}
          </Button>
          {convResult ? <p className="text-sm font-medium text-foreground">{convResult}</p> : null}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Taux courants"
        description="Dernière valeur publiée par paire (selon date de validité)."
        icon={Coins}
        actions={
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
            Actualiser
          </Button>
        }
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : current.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun taux enregistré pour l’instant.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Paire</th>
                  <th className="px-3 py-2 text-right font-medium">Taux</th>
                  <th className="px-3 py-2 text-left font-medium">Valide depuis</th>
                  <th className="px-3 py-2 text-left font-medium">Saisi par</th>
                </tr>
              </thead>
              <tbody>
                {current.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2 font-medium">
                      {row.from_currency} → {row.to_currency}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{String(row.rate)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.valid_from ? new Date(row.valid_from).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="px-3 py-2">{row.set_by_user?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Historique (100 derniers)" description="Audit des modifications de taux." icon={History}>
        <ScrollArea className="h-[min(420px,50vh)] rounded-lg border">
          {history.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucun historique.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-[1] bg-muted/80 backdrop-blur">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Paire</th>
                  <th className="px-3 py-2 text-right font-medium">Taux</th>
                  <th className="px-3 py-2 text-left font-medium">Valide depuis</th>
                  <th className="px-3 py-2 text-left font-medium">Saisi par</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      {row.from_currency} → {row.to_currency}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{String(row.rate)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.valid_from ? new Date(row.valid_from).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="px-3 py-2">{row.set_by_user?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </SettingsCard>
    </div>
  )
}
