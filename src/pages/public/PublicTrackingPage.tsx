import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Circle, MapPin, PackageSearch, QrCode, Truck } from 'lucide-react'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type TrackingStep = {
  code: string
  label: string
  completed?: boolean
  current?: boolean
  date?: string | null
}

type TrackingPayload = {
  tracking_number: string
  status?: { code?: string | null; label?: string | null } | null
  origin_country?: string | null
  destination_country?: string | null
  estimated_arrival?: string | null
  steps?: TrackingStep[]
}

function trackEventsUrl(): string {
  if (import.meta.env.DEV) return '/api/track-events'
  const root = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')

  return `${root}/api/track-events`
}

async function shortTrackingHash(text: string): Promise<string | undefined> {
  try {
    const enc = new TextEncoder().encode(text.trim().toLowerCase())
    const digest = await crypto.subtle.digest('SHA-256', enc)

    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32)
  } catch {
    return undefined
  }
}

function reportTrackEvent(event: 'search_ok' | 'search_fail', hash?: string): void {
  const body = JSON.stringify({ event, ...(hash ? { h: hash } : {}) })
  const url = trackEventsUrl()
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(url, blob)) return
    }
  } catch {
    // ignore
  }
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export default function PublicTrackingPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TrackingPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusLabel = useMemo(() => data?.status?.label || 'Statut indisponible', [data])

  const normalizeTrackingQuery = (raw: string): string => {
    const value = raw.trim()
    if (value === '') return ''
    try {
      const u = new URL(value)
      if (u.pathname.includes('/track/')) {
        return decodeURIComponent(u.pathname.split('/track/').pop() || '').trim()
      }
      const qp = u.searchParams.get('tracking') || u.searchParams.get('q')
      if (qp) return qp.trim()
    } catch {
      // Not a URL -> treat as direct tracking code
    }
    return value
  }

  const fetchTracking = async (raw: string) => {
    const value = normalizeTrackingQuery(raw)
    if (!value) return
    setQuery(value)
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/track/${encodeURIComponent(value)}`)
      setData(res.data as TrackingPayload)
      const h = await shortTrackingHash(value)
      reportTrackEvent('search_ok', h)
    } catch {
      setData(null)
      setError('Numero introuvable. Verifiez le tracking puis reessayez.')
      const h = await shortTrackingHash(value)
      reportTrackEvent('search_fail', h)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await fetchTracking(query)
  }

  useEffect(() => {
    const initial = searchParams.get('tracking') || searchParams.get('q')
    if (initial) {
      void fetchTracking(initial)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">Suivi public Monrespro</p>
          <h1 className="text-2xl font-bold tracking-tight">Suivre mon expedition</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre numero de tracking pour consulter le statut sans compte client.
          </p>
        </header>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" aria-label="Recherche par numéro de suivi">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: MRP-2026-000123"
                className="h-11"
                aria-label="Numéro de suivi ou URL contenant le suivi"
                autoComplete="off"
              />
              <Button type="submit" className="h-11 sm:min-w-36" disabled={loading}>
                {loading ? 'Recherche…' : 'Rechercher'}
              </Button>
            </form>
            {error ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            {!loading && !data ? (
              <div className="mt-4 rounded-lg border border-dashed bg-muted/30 px-3 py-3 text-left text-sm text-muted-foreground">
                <p className="flex items-start gap-2 font-medium text-foreground">
                  <QrCode className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Conseils
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-0.5">
                  <li>Collez une URL de suivi (le numero sera extrait automatiquement).</li>
                  <li>Sur mobile, vous pouvez scanner un QR code etiquette puis ouvrir le lien dans le navigateur.</li>
                  <li>Verifiez les espaces en debut ou fin de code.</li>
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <section aria-live="polite" aria-busy={loading} className="space-y-6">
        {data ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PackageSearch className="h-4 w-4" />
                  {data.tracking_number}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabel}</Badge>
                  {data.estimated_arrival ? (
                    <span className="text-sm text-muted-foreground">
                      Arrivee estimee: {new Date(data.estimated_arrival).toLocaleDateString('fr-FR')}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Origine: </span>
                    <span className="font-medium">{data.origin_country || '—'}</span>
                  </div>
                  <div className="rounded-lg border bg-background px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Destination: </span>
                    <span className="font-medium">{data.destination_country || '—'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Timeline de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data.steps || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune etape detaillee n’est disponible pour ce colis pour le moment. Le statut ci-dessus reste la
                    reference principale.
                  </p>
                ) : (
                <ol className="space-y-3">
                  {(data.steps || []).map((step, idx) => {
                    const done = !!step.completed
                    const current = !!step.current
                    return (
                      <li
                        key={`${step.code}-${idx}`}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          current ? 'border-primary bg-primary/5' : 'bg-background'
                        }`}
                      >
                        <div className="pt-0.5">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : current ? (
                            <MapPin className="h-4 w-4 text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{step.label}</p>
                          {step.date ? (
                            <p className="text-xs text-muted-foreground">
                              {new Date(step.date).toLocaleString('fr-FR')}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ol>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
        </section>

        <footer className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground leading-relaxed">
          Les informations affichées sont fournies à titre indicatif et peuvent différer des données internes
          opérationnelles. Monrespro ne peut être tenue responsable d’un retard de mise à jour du suivi public. Pour toute
          question, contactez votre agence ou l’assistance client avec votre numéro de suivi.
        </footer>
      </div>
    </main>
  )
}
