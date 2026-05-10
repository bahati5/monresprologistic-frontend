import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Truck, CheckCircle, Loader2, Package, FileText,
  CreditCard, AlertTriangle, PartyPopper,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { displayLocalized } from '@/lib/localizedString'
import { Link } from 'react-router-dom'

type LocalizedOrString = Record<string, unknown> | string | undefined

interface DispatchShipment {
  id?: number
  public_tracking?: string
  payment_status?: string
  status_name?: LocalizedOrString
  assigned_driver_name?: string
  assigned_driver?: { name?: string }
}

interface StatusTransitionOption {
  id?: number | string
  code?: string
  label?: LocalizedOrString
  name?: LocalizedOrString
}

interface DispatchStepProps {
  shipment: DispatchShipment | null | undefined
  availableTransitions: StatusTransitionOption[]
  drivers: unknown[]
  onDispatch: (data: { status: string; notes?: string }) => Promise<void>
  isProcessing?: boolean
}

export function DispatchStep(props: DispatchStepProps) {
  const { shipment, availableTransitions, onDispatch, isProcessing } = props
  const [selectedStatusCode, setSelectedStatusCode] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dispatched, setDispatched] = useState(false)

  const paymentStatus = shipment?.payment_status || 'unpaid'
  const isFullyPaid = paymentStatus === 'paid'
  const currentStatus = shipment?.status_name
    ? (typeof shipment.status_name === 'object' ? displayLocalized(shipment.status_name) : shipment.status_name)
    : '—'

  const driverName = shipment?.assigned_driver_name || shipment?.assigned_driver?.name || null

  const handleDispatch = async () => {
    if (!selectedStatusCode) {
      toast.error('Veuillez sélectionner le prochain statut')
      return
    }

    setSubmitting(true)
    try {
      await onDispatch({
        status: selectedStatusCode,
        notes: notes || undefined,
      })
      setDispatched(true)
      toast.success('Expédition validée et statut mis à jour !')
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la validation'))
    } finally {
      setSubmitting(false)
    }
  }

  if (dispatched) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <PartyPopper className="mx-auto h-16 w-16 text-emerald-500" />
          <h2 className="text-2xl font-bold text-emerald-700">Expédition validée !</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            L'expédition <span className="font-mono font-semibold">{shipment?.public_tracking || `#${shipment?.id}`}</span> a été
            traitée avec succès. Les documents ont été vérifiés et le paiement enregistré.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" asChild>
              <Link to={`/shipments/${shipment?.id}`}>
                <Package size={16} className="mr-2" /> Voir l'expédition
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/shipments">
                <FileText size={16} className="mr-2" /> Liste des expéditions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck size={20} /> Validation finale & expédition
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Vérifiez le récapitulatif puis validez l'expédition.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Données vérifiées</p>
                <p className="text-xs text-muted-foreground">Les informations de l'expédition ont été validées</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">OK</Badge>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText size={20} className="text-emerald-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Documents vérifiés</p>
                <p className="text-xs text-muted-foreground">La facture et l'étiquette ont été prévisualisées</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">OK</Badge>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              {isFullyPaid ? (
                <CreditCard size={20} className="text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle size={20} className="text-amber-500 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">Paiement</p>
                <p className="text-xs text-muted-foreground">
                  {isFullyPaid ? 'Le paiement a été enregistré en totalité' : 'Paiement en attente ou partiel'}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={isFullyPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
              >
                {isFullyPaid ? 'Payé' : 'En attente'}
              </Badge>
            </div>

            {driverName && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Truck size={20} className="text-blue-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Chauffeur assigné</p>
                  <p className="text-xs text-muted-foreground">{driverName}</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Assigné</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status transition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Changer le statut</CardTitle>
          <p className="text-sm text-muted-foreground">
            Statut actuel : <Badge variant="outline">{currentStatus}</Badge>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prochain statut</Label>
              <Select value={selectedStatusCode} onValueChange={setSelectedStatusCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {(availableTransitions || []).map((s: StatusTransitionOption) => {
                    const code = s.code ?? String(s.id)
                    const label = s.label
                      ? (typeof s.label === 'object' ? displayLocalized(s.label) : s.label)
                      : s.name
                        ? (typeof s.name === 'object' ? displayLocalized(s.name) : s.name)
                        : code
                    return (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note (optionnel)</Label>
              <Textarea
                placeholder="Commentaire sur la transition..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleDispatch}
              disabled={submitting || !selectedStatusCode || isProcessing}
              size="lg"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              Valider l'expédition
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
