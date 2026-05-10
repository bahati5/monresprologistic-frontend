import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import api from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { useCreateShipmentNotice } from '@/hooks/useInbound'
import { useCheckExistingDraft, useDraftAutoSave, useDeleteDraft } from '@/hooks/useDrafts'
import type { FormDraft } from '@/hooks/useDrafts'
import { DraftStatusIndicator } from '@/components/drafts/DraftStatusIndicator'
import { DraftResumeDialog } from '@/components/drafts/DraftResumeDialog'
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
import { BellRing, ArrowLeft, Save } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

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
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const isClient = user?.roles?.includes('client') ?? false
  const create = useCreateShipmentNotice()
  const deleteDraft = useDeleteDraft()

  const [draftDialogOpen, setDraftDialogOpen] = useState(false)
  const [draftChecked, setDraftChecked] = useState(false)

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
    reset,
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

  // react-hook-form watch() is not memoization-safe; values feed draft autosave only.
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch API
  const formValues = watch()
  const clientId = watch('client_id')

  const { data: existingDraft } = useCheckExistingDraft('pre_alert', !draftChecked)

  const { lastSavedAt, isSaving, saveDraftManually, loadDraft, clearAfterSubmit } =
    useDraftAutoSave('pre_alert', formValues as Record<string, unknown>, {
      enabled: draftChecked,
    })

  useEffect(() => {
    if (draftChecked) return

    const draftIdParam = searchParams.get('draft_id')
    if (draftIdParam && existingDraft && String(existingDraft.id) === draftIdParam) {
      reset(existingDraft.payload as FormValues)
      loadDraft(existingDraft)
      setDraftChecked(true)
      return
    }

    if (existingDraft) {
      setDraftDialogOpen(true)
    } else if (existingDraft === null) {
      setDraftChecked(true)
    }
  }, [existingDraft, draftChecked, searchParams, reset, loadDraft])

  const handleResumeDraft = (draft: FormDraft) => {
    reset(draft.payload as FormValues)
    loadDraft(draft)
    setDraftDialogOpen(false)
    setDraftChecked(true)
  }

  const handleDiscardDraft = (draft: FormDraft) => {
    deleteDraft.mutate(draft.id)
    setDraftDialogOpen(false)
    setDraftChecked(true)
  }

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
        clearAfterSubmit()
        navigate('/shipment-notices')
      },
      onError: () => {},
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-16 pt-2">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)} title="Retour">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            {""}
            <h1 className="text-2xl font-bold tracking-tight">Nouveau Colis Attendu</h1>
            <p className="text-sm text-muted-foreground">
              {"Indiquez le transporteur et le suivi pour pr\u00E9parer la r\u00E9ception \u00E0 l\u2019entrep\u00F4t."}
            </p>
          </div>
        </div>
      </div>

      <DraftResumeDialog
        draft={existingDraft ?? null}
        open={draftDialogOpen}
        onResume={handleResumeDraft}
        onDiscard={handleDiscardDraft}
        onOpenChange={setDraftDialogOpen}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>{"D\u00E9tails du colis"}</CardTitle>
              <CardDescription>{"Les champs marqu\u00E9s d\u2019une ast\u00E9risque sont obligatoires."}</CardDescription>
            </div>
            <DraftStatusIndicator lastSavedAt={lastSavedAt} isSaving={isSaving} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isClient && (
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select value={clientId} onValueChange={(v) => setValue('client_id', v, { shouldValidate: true })}>
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="S\u00E9lectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!clientId && <p className="text-xs text-muted-foreground">{"Requis pour cr\u00E9er l\u2019avis au nom du client."}</p>}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="carrier_name">Transporteur *</Label>
                <Input
                  id="carrier_name"
                  placeholder="Ex. Chronopost, DHL\u2026"
                  {...register('carrier_name', { required: 'Transporteur requis' })}
                />
                {errors.carrier_name && (
                  <p className="text-sm text-destructive">{errors.carrier_name.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vendor_tracking_number">{"Num\u00E9ro de suivi *"}</Label>
                <Input
                  id="vendor_tracking_number"
                  placeholder="Num\u00E9ro de tracking"
                  {...register('vendor_tracking_number', { required: 'Num\u00E9ro de suivi requis' })}
                />
                {errors.vendor_tracking_number && (
                  <p className="text-sm text-destructive">{errors.vendor_tracking_number.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="merchant_name">Marchand / boutique (optionnel)</Label>
                <Input id="merchant_name" placeholder="Ex. Amazon, Zalando\u2026" {...register('merchant_name')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description courte (optionnel)</Label>
              <Textarea id="description" rows={3} placeholder="Contenu approximatif, r\u00E9f\u00E9rence commande\u2026" {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes (optionnel)</Label>
              <Textarea id="notes" rows={3} placeholder="Instructions pour l'\u00E9quipe\u2026" {...register('notes')} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" variant="outline" onClick={saveDraftManually} disabled={isSaving}>
                <Save className="mr-1 h-4 w-4" />
                Enregistrer en brouillon
              </Button>
              <Button type="submit" disabled={create.isPending} className="min-w-[200px]">
                {create.isPending ? 'Enregistrement\u2026' : 'Enregistrer le colis attendu'}
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
