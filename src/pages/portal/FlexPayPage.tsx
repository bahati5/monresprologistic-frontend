import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Smartphone, CheckCircle2, Clock, XCircle, RefreshCw, CreditCard } from 'lucide-react'
import { getApiErrorMessage } from '@/lib/apiError'

interface FlexPayOrder {
  order_number: string
  amount: number
  currency: string
  description: string
  status?: string
}

export default function FlexPayPage() {
  const [invoiceId, setInvoiceId] = useState('')
  const [phone, setPhone] = useState('')
  const [activeOrder, setActiveOrder] = useState<FlexPayOrder | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(false)

  const initiateMutation = useMutation({
    mutationFn: (payload: { invoice_id: string; phone: string }) =>
      api.post('/api/flexpay/initiate', payload).then(r => r.data),
    onSuccess: (data) => {
      setActiveOrder(data.order)
      setPollingEnabled(true)
    },
  })

  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: ['flexpay-status', activeOrder?.order_number],
    queryFn: () =>
      api.get(`/api/flexpay/check/${activeOrder!.order_number}`).then(r => r.data),
    enabled: pollingEnabled && !!activeOrder?.order_number,
    refetchInterval: 5000,
    select: (data) => {
      if (data.status === 'SUCCESS' || data.status === 'FAILED') {
        setPollingEnabled(false)
      }
      return data
    },
  })

  const paymentStatus = statusData?.status ?? activeOrder?.status

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    PENDING:   { label: 'En attente de confirmation', icon: <Clock size={16} />, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    PROCESSING:{ label: 'Traitement en cours…', icon: <RefreshCw size={16} className="animate-spin" />, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    SUCCESS:   { label: 'Paiement confirmé', icon: <CheckCircle2 size={16} />, color: 'bg-green-100 text-green-800 border-green-200' },
    FAILED:    { label: 'Paiement échoué', icon: <XCircle size={16} />, color: 'bg-red-100 text-red-800 border-red-200' },
  }

  const currentStatus = paymentStatus ? statusConfig[paymentStatus] : null

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Paiement Mobile Money
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Payez votre facture via FlexPay (M-Pesa, Airtel Money, Orange Money)
        </p>
      </div>

      {!activeOrder ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Initier un paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invoice">Numéro de facture</Label>
              <Input
                id="invoice"
                placeholder="EX-2024-XXXX"
                value={invoiceId}
                onChange={e => setInvoiceId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Numéro de téléphone Mobile Money</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className="pl-9"
                  placeholder="+243 8X XXX XXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Format international recommandé : +243…
              </p>
            </div>

            {initiateMutation.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {getApiErrorMessage(initiateMutation.error, 'Erreur lors de l\'initiation du paiement.')}
              </div>
            )}

            <Button
              className="w-full"
              disabled={!invoiceId.trim() || !phone.trim() || initiateMutation.isPending}
              onClick={() => initiateMutation.mutate({ invoice_id: invoiceId.trim(), phone: phone.trim() })}
            >
              {initiateMutation.isPending ? (
                <RefreshCw size={16} className="mr-2 animate-spin" />
              ) : (
                <Smartphone size={16} className="mr-2" />
              )}
              Initier le paiement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Statut du paiement */}
            {currentStatus && (
              <div className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium ${currentStatus.color}`}>
                {currentStatus.icon}
                {currentStatus.label}
              </div>
            )}

            {/* Détails de la transaction */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">N° de commande</span>
                <span className="font-mono font-medium">{activeOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-semibold">
                  {activeOrder.amount} {activeOrder.currency}
                </span>
              </div>
              {activeOrder.description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description</span>
                  <span className="text-right max-w-[60%]">{activeOrder.description}</span>
                </div>
              )}
            </div>

            {paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING' ? (
              <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground text-center">
                <p className="font-medium mb-1">Confirmez la demande sur votre téléphone</p>
                <p>Une notification de paiement a été envoyée au <strong>{phone}</strong>.</p>
                <p className="mt-1">Cette page se rafraîchit automatiquement toutes les 5 secondes.</p>
              </div>
            ) : paymentStatus === 'SUCCESS' ? (
              <div className="text-center space-y-2 py-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <p className="font-semibold text-green-700">Paiement effectué avec succès !</p>
                <p className="text-sm text-muted-foreground">Votre facture a été mise à jour.</p>
                <Button variant="outline" size="sm" onClick={() => { setActiveOrder(null); setInvoiceId(''); setPhone('') }}>
                  Faire un autre paiement
                </Button>
              </div>
            ) : paymentStatus === 'FAILED' ? (
              <div className="text-center space-y-2 py-2">
                <XCircle className="mx-auto h-10 w-10 text-red-500" />
                <p className="font-semibold text-red-700">Paiement échoué</p>
                <p className="text-sm text-muted-foreground">Veuillez vérifier votre solde et réessayer.</p>
                <Button variant="outline" size="sm" onClick={() => { setActiveOrder(null); setPollingEnabled(false) }}>
                  Réessayer
                </Button>
              </div>
            ) : null}

            {(paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING') && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => refetchStatus()}>
                <RefreshCw size={14} className="mr-1.5" />
                Vérifier maintenant
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-muted bg-muted/20">
        <CardContent className="py-4 px-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">Opérateurs supportés</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {['M-Pesa', 'Airtel Money', 'Orange Money', 'Vodacom'].map(op => (
              <Badge key={op} variant="secondary" className="font-normal">{op}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
