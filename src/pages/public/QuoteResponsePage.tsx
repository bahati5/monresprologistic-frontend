import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { REFUSAL_REASONS } from '@/types/assistedPurchase'

type QuoteInfo = {
  reference: string
  client_name: string
  amount: number
  currency: string
  expires_at: string
  items_summary: string[]
}

type ResponseState = 'loading' | 'ready' | 'confirm_refuse' | 'submitting' | 'done' | 'expired' | 'error'

export default function QuoteResponsePage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const action = params.get('action') as 'accept' | 'refuse' | null

  const [state, setState] = useState<ResponseState>('loading')
  const [quote, setQuote] = useState<QuoteInfo | null>(null)
  const [doneAction, setDoneAction] = useState<'accepted' | 'refused' | null>(null)
  const [refusalReason, setRefusalReason] = useState('')
  const [refusalNote, setRefusalNote] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setErrorMessage('Lien invalide — aucun jeton fourni.')
      setState('error')
      return
    }

    api
      .get<{ quote: QuoteInfo }>(`/api/quotes/verify-token`, { params: { token } })
      .then(({ data }) => {
        setQuote(data.quote)

        const expiry = new Date(data.quote.expires_at)
        if (expiry < new Date()) {
          setState('expired')
          return
        }

        if (action === 'accept') {
          submitResponse('accepted', null, null)
        } else if (action === 'refuse') {
          setState('confirm_refuse')
        } else {
          setState('ready')
        }
      })
      .catch(() => {
        setErrorMessage('Ce lien n\'est plus valide ou a déjà été utilisé.')
        setState('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submitResponse = async (
    type: 'accepted' | 'refused',
    reason: string | null,
    note: string | null,
  ) => {
    setState('submitting')
    try {
      await api.post('/api/quotes/respond', {
        token,
        response: type,
        refusal_reason: reason,
        refusal_note: note,
      })
      setDoneAction(type)
      setState('done')
    } catch {
      setErrorMessage('Erreur lors de l\'enregistrement de votre réponse.')
      setState('error')
    }
  }

  const handleAccept = () => submitResponse('accepted', null, null)

  const handleRefuseConfirm = () => {
    if (!refusalReason) return
    submitResponse('refused', refusalReason, refusalNote.trim() || null)
  }

  if (state === 'loading' || state === 'submitting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#073763] mx-auto" />
          <p className="text-sm text-muted-foreground">
            {state === 'loading' ? 'Vérification du lien...' : 'Enregistrement de votre réponse...'}
          </p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Lien invalide</h1>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <p className="text-xs text-muted-foreground">
            Contactez-nous : <a href="mailto:info@monrespro.cd" className="text-[#0b5394] underline">info@monrespro.cd</a>
          </p>
        </div>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Devis expiré</h1>
          <p className="text-sm text-muted-foreground">
            Le devis <span className="font-semibold">{quote?.reference}</span> a expiré.
            Contactez-nous pour en obtenir un nouveau.
          </p>
          <p className="text-xs text-muted-foreground">
            <a href="mailto:info@monrespro.cd" className="text-[#0b5394] underline">info@monrespro.cd</a>
          </p>
        </div>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            doneAction === 'accepted' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {doneAction === 'accepted' ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {doneAction === 'accepted' ? 'Devis accepté' : 'Devis refusé'}
          </h1>
          {doneAction === 'accepted' && quote && (
            <div className="bg-white rounded-xl border p-5 shadow-sm text-left space-y-3">
              <p className="text-sm text-muted-foreground">
                Merci ! Votre devis <span className="font-semibold text-foreground">{quote.reference}</span> a
                été accepté.
              </p>
              <p className="text-sm text-muted-foreground">
                Procédez au paiement de <span className="font-semibold text-foreground">{quote.amount.toLocaleString('fr-FR')} {quote.currency}</span> avec
                la référence <span className="font-semibold text-foreground">{quote.reference}</span>.
              </p>
              <div className="rounded-lg bg-[#073763]/5 p-3">
                <p className="text-xs font-medium text-[#073763]">Moyens de paiement</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <li>M-Pesa · Orange Money · Airtel Money</li>
                  <li>Dépôt espèces au comptoir</li>
                </ul>
              </div>
            </div>
          )}
          {doneAction === 'refused' && (
            <p className="text-sm text-muted-foreground">
              Votre réponse a été enregistrée. N'hésitez pas à nous contacter pour toute nouvelle demande.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (state === 'confirm_refuse') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-foreground">Refuser le devis</h1>
            {quote && (
              <p className="text-sm text-muted-foreground">
                Devis <span className="font-semibold">{quote.reference}</span> · {quote.amount.toLocaleString('fr-FR')} {quote.currency}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pourquoi refusez-vous ce devis ?</Label>
              <div className="space-y-1.5">
                {REFUSAL_REASONS.map((r) => (
                  <label
                    key={r.code}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-md p-2 transition-colors"
                  >
                    <input
                      type="radio"
                      name="refusal_reason"
                      value={r.code}
                      checked={refusalReason === r.code}
                      onChange={() => setRefusalReason(r.code)}
                      className="accent-[#073763]"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            {refusalReason === 'other' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Précisez (optionnel)</Label>
                <Textarea
                  rows={2}
                  value={refusalNote}
                  onChange={(e) => setRefusalNote(e.target.value)}
                  placeholder="Votre commentaire..."
                  className="text-sm"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setState('ready')}
              >
                Retour
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!refusalReason}
                onClick={handleRefuseConfirm}
              >
                Confirmer le refus
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#073763]/5 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-[#073763]">Votre devis Monrespro</h1>
          {quote && (
            <p className="text-sm text-muted-foreground">
              Référence <span className="font-semibold text-foreground">{quote.reference}</span>
            </p>
          )}
        </div>

        {quote && (
          <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="text-sm font-medium">{quote.client_name}</span>
            </div>
            {quote.items_summary.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Articles</p>
                <ul className="space-y-0.5">
                  {quote.items_summary.map((item, i) => (
                    <li key={i} className="text-sm">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="h-px bg-border/60" />
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-[#073763]">
                {quote.amount.toLocaleString('fr-FR')} {quote.currency}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Valable jusqu'au {new Date(quote.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold"
            onClick={handleAccept}
          >
            <CheckCircle2 size={18} />
            J'accepte
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 gap-2 font-semibold"
            onClick={() => setState('confirm_refuse')}
          >
            <XCircle size={18} />
            Je refuse
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Vous pouvez aussi répondre directement par email pour nous faire part de votre décision.
        </p>
      </div>
    </div>
  )
}
