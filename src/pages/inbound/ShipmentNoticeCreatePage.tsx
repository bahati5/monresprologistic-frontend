import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { useCreateShipmentNotice } from '@/hooks/useInbound'
import type { ShipmentNoticeCreatePayload } from '@/types/inbound'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BellRing, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

type FormValues = {
  client_id: string
  carrier_name: string
  vendor_tracking_number: string
  merchant_name: string
  description: string
  notes: string
}

export default function ShipmentNoticeCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isClient = user?.roles?.includes('client') ?? false
  const create = useCreateShipmentNotice()

  const { data: meta } = useQuery({
    queryKey: ['shipment-notices', 'create-meta'],
    queryFn: () => api.get('/api/shipment-notices/create').then((r) => r.data),
    enabled: !isClient,
  })

  const clients = useMemo(() => (meta?.clients as { id: number; name: string }[] | undefined) ?? [], [meta])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      client_id: '',
      carrier_name: '',
      vendor_tracking_number: '',
      merchant_name: '',
      description: '',
      notes: '',
    },
  })

  const clientId = watch('client_id')

  const onSubmit = (values: FormValues) => {
    if (!isClient && !values.client_id) {
      toast.error('Choisissez un client.')
      return
    }

    const payload: ShipmentNoticeCreatePayload = {
      carrier_name: values.carrier_name.trim(),
      vendor_tracking_number: values.vendor_tracking_number.trim(),
      merchant_name: values.merchant_name.trim() || undefined,
      description: values.description.trim() || undefined,
      notes: values.notes.trim() || undefined,
    }

    if (!isClient) {
      payload.client_id = Number(values.client_id)
    }

    create.mutate(payload, {
      onSuccess: () => {
        navigate('/shipment-notices')
      },
      onError: () => {},
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-16 pt-2">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link to="/shipment-notices" title="Retour">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nouveau Colis Attendu</h1>
            <p className="text-sm text-muted-foreground">
              Indiquez le transporteur et le suivi pour préparer la réception à l’entrepôt.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails du colis</CardTitle>
          <CardDescription>Les champs marqués d’une astérisque sont obligatoires.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isClient && (
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select value={clientId} onValueChange={(v) => setValue('client_id', v, { shouldValidate: true })}>
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!clientId && <p className="text-xs text-muted-foreground">Requis pour créer l’avis au nom du client.</p>}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="carrier_name">Transporteur *</Label>
                <Input
                  id="carrier_name"
                  placeholder="Ex. Chronopost, DHL…"
                  {...register('carrier_name', { required: 'Transporteur requis' })}
                />
                {errors.carrier_name && (
                  <p className="text-sm text-destructive">{errors.carrier_name.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vendor_tracking_number">Numéro de suivi *</Label>
                <Input
                  id="vendor_tracking_number"
                  placeholder="Numéro de tracking"
                  {...register('vendor_tracking_number', { required: 'Numéro de suivi requis' })}
                />
                {errors.vendor_tracking_number && (
                  <p className="text-sm text-destructive">{errors.vendor_tracking_number.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="merchant_name">Marchand / boutique (optionnel)</Label>
                <Input id="merchant_name" placeholder="Ex. Amazon, Zalando…" {...register('merchant_name')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description courte (optionnel)</Label>
              <Textarea id="description" rows={3} placeholder="Contenu approximatif, référence commande…" {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes (optionnel)</Label>
              <Textarea id="notes" rows={3} placeholder="Instructions pour l’équipe…" {...register('notes')} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={create.isPending} className="min-w-[200px]">
                {create.isPending ? 'Enregistrement…' : 'Enregistrer le colis attendu'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/shipment-notices">Annuler</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
