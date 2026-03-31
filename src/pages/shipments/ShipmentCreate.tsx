import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useCreateShipment,
  useSearchClients,
  useSearchRecipients,
  useShipmentCreateOptions,
  usePreviewQuote,
  useUpdateShipmentStatus,
} from '@/hooks/useShipments'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DbCombobox, DbComboboxAsync } from '@/components/ui/DbCombobox'
import { ShipmentWizardStepper } from '@/components/workflow/ShipmentWizardStepper'
import { ShipmentWorkflowProvider, useShipmentWorkflow } from '@/contexts/ShipmentWorkflowContext'
import { ShipmentProcessSteps } from '@/components/workflow/ShipmentProcessSteps'
import { DocumentPreviewStep } from '@/components/workflow/DocumentPreviewStep'
import { CheckoutStep } from '@/components/workflow/CheckoutStep'
import { DispatchStep } from '@/components/workflow/DispatchStep'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Plus, Trash2, AlertCircle, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { displayLocalized } from '@/lib/localizedString'
import { cn } from '@/lib/utils'

interface ShipmentItem {
  description: string
  quantity: number
  weight_kg: number
  value: number
  origin_country_id: string
}

function ShipmentCreateContent() {
  const navigate = useNavigate()
  const {
    currentStep: workflowStep,
    completedSteps,
    goToStep,
    nextStep: workflowNext,
    markStepCompleted,
    shipmentId: createdShipmentId,
    setShipmentId,
  } = useShipmentWorkflow()

  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const [clientQuery, setClientQuery] = useState('')
  const [recipientQuery, setRecipientQuery] = useState('')
  const [clientId, setClientId] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [items, setItems] = useState<ShipmentItem[]>([
    { description: '', quantity: 1, weight_kg: 0, value: 0, origin_country_id: '' },
  ])
  const [shippingModeId, setShippingModeId] = useState('')
  const [agencyId, setAgencyId] = useState('')
  const [officeId, setOfficeId] = useState('')
  const [packagingTypeId, setPackagingTypeId] = useState('')
  const [deliveryTimeId, setDeliveryTimeId] = useState('')
  const [transportCompanyId, setTransportCompanyId] = useState('')
  const [shipLineId, setShipLineId] = useState('')
  const [shippingModeFilter, setShippingModeFilter] = useState('')
  const [notes, setNotes] = useState('')

  const [insurancePct, setInsurancePct] = useState('0')
  const [customsDutyPct, setCustomsDutyPct] = useState('0')
  const [taxPct, setTaxPct] = useState('0')
  const [discountPct, setDiscountPct] = useState('0')
  const [manualFee, setManualFee] = useState('0')
  const [manualFeeLabel, setManualFeeLabel] = useState('')
  const [declaredOverride, setDeclaredOverride] = useState('')
  const [legalDeclarationAccepted, setLegalDeclarationAccepted] = useState(false)

  // Post-creation state for workflow phases
  const [shipmentData, setShipmentData] = useState<any>(null)
  const [docSettings, setDocSettings] = useState<any>(null)
  const [availableTransitions, setAvailableTransitions] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])

  const updateStatus = useUpdateShipmentStatus()

  const { data: options, isLoading: loadingOptions } = useShipmentCreateOptions()
  const { data: clientsRaw } = useSearchClients(clientQuery)
  const { data: recipientsRaw } = useSearchRecipients(recipientQuery, clientId ? Number(clientId) : undefined)
  const createMutation = useCreateShipment()
  const { mutate: runPreview, data: previewData, isPending: previewPending } = usePreviewQuote()

  const clientList = Array.isArray(clientsRaw) ? clientsRaw : clientsRaw?.clients || []
  const recipientList = Array.isArray(recipientsRaw) ? recipientsRaw : recipientsRaw?.recipients || []

  const modeList = useMemo(
    () => (Array.isArray(options?.shippingModes) ? options.shippingModes : []),
    [options?.shippingModes]
  )
  const agencyList = useMemo(
    () => (Array.isArray(options?.agencies) ? options.agencies : []),
    [options?.agencies]
  )
  const officeList = useMemo(
    () => (Array.isArray(options?.offices) ? options.offices : []),
    [options?.offices]
  )
  const packagingList = useMemo(
    () => (Array.isArray(options?.packagingTypes) ? options.packagingTypes : []),
    [options?.packagingTypes]
  )
  const transportCompanyList = useMemo(
    () => (Array.isArray(options?.transportCompanies) ? options.transportCompanies : []),
    [options?.transportCompanies]
  )
  const shipLineList = useMemo(
    () => (Array.isArray(options?.shipLines) ? options.shipLines : []),
    [options?.shipLines]
  )
  const countryList = useMemo(
    () => (Array.isArray(options?.countries) ? options.countries : []),
    [options?.countries]
  )
  const modesFiltered = useMemo(() => {
    const q = shippingModeFilter.trim().toLowerCase()
    if (!q) return modeList
    return modeList.filter((m: { name: unknown }) =>
      String(displayLocalized(m.name as string)).toLowerCase().includes(q)
    )
  }, [modeList, shippingModeFilter])

  const selectedMode = useMemo(
    () => modeList.find((m: { id: number }) => String(m.id) === shippingModeId),
    [modeList, shippingModeId]
  )

  const timeListFiltered = useMemo(() => {
    const raw = selectedMode
      ? ((selectedMode as { delivery_times?: unknown[]; deliveryTimes?: unknown[] }).delivery_times ??
          (selectedMode as { deliveryTimes?: unknown[] }).deliveryTimes ??
          [])
      : []
    if (!Array.isArray(raw)) return []
    return (raw as { is_active?: boolean }[]).filter((t) => t.is_active !== false)
  }, [selectedMode])

  const pricingDefaultsApplied = useRef(false)
  useEffect(() => {
    if (!options || pricingDefaultsApplied.current) return
    pricingDefaultsApplied.current = true
    setInsurancePct(String(options.defaultInsurancePct ?? '0'))
    setCustomsDutyPct(String(options.defaultCustomsDutyPct ?? '0'))
    setTaxPct(String(options.defaultTaxPct ?? '0'))
    if (options.defaultAgencyId != null) {
      setAgencyId(String(options.defaultAgencyId))
    }
  }, [options])

  useEffect(() => {
    if (!shippingModeId) {
      setDeliveryTimeId('')
      return
    }
    if (!deliveryTimeId) return
    const ok = (timeListFiltered as { id: number }[]).some((t) => String(t.id) === deliveryTimeId)
    if (!ok) setDeliveryTimeId('')
  }, [shippingModeId, timeListFiltered, deliveryTimeId])

  useEffect(() => {
    setRecipientId('')
    setRecipientQuery('')
  }, [clientId])

  const itemsSumValue = useMemo(
    () => items.reduce((s, i) => s + Number(i.value || 0) * Number(i.quantity || 0), 0),
    [items]
  )

  const buildWizardPayload = useCallback((): Record<string, unknown> | null => {
    if (!clientId || !recipientId) return null
    const body: Record<string, unknown> = {
      sender_client_id: Number(clientId),
      recipient_id: Number(recipientId),
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        weight_kg: i.weight_kg,
        value: i.value || 0,
        ...(i.origin_country_id ? { origin_country_id: Number(i.origin_country_id) } : {}),
      })),
      shipping_mode_id: shippingModeId ? Number(shippingModeId) : undefined,
      delivery_time_id: deliveryTimeId ? Number(deliveryTimeId) : undefined,
      agency_id: agencyId ? Number(agencyId) : undefined,
      office_id: officeId ? Number(officeId) : undefined,
      packaging_type_id: packagingTypeId ? Number(packagingTypeId) : undefined,
      transport_company_id: transportCompanyId ? Number(transportCompanyId) : undefined,
      ship_line_id: shipLineId ? Number(shipLineId) : undefined,
      declared_currency: 'USD',
      insurance_pct: Number(insurancePct) || 0,
      customs_duty_pct: Number(customsDutyPct) || 0,
      tax_pct: Number(taxPct) || 0,
      discount_pct: Number(discountPct) || 0,
      manual_fee: Number(manualFee) || 0,
      service_options: {
        ...(manualFeeLabel.trim() ? { manual_fee_label: manualFeeLabel.trim() } : {}),
      },
    }
    const ov = declaredOverride.trim()
    if (ov !== '') body.declared_value = Number(ov)
    return body
  }, [
    clientId,
    recipientId,
    items,
    shippingModeId,
    deliveryTimeId,
    agencyId,
    officeId,
    packagingTypeId,
    transportCompanyId,
    shipLineId,
    declaredOverride,
    insurancePct,
    customsDutyPct,
    taxPct,
    discountPct,
    manualFee,
    manualFeeLabel,
  ])

  useEffect(() => {
    if (step !== 4) return
    const body = buildWizardPayload()
    if (!body || !shippingModeId) return
    const t = window.setTimeout(() => {
      runPreview(body, {
        onError: () => {
          /* erreurs preview non bloquantes */
        },
      })
    }, 450)
    return () => window.clearTimeout(t)
  }, [step, buildWizardPayload, shippingModeId, runPreview])

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, weight_kg: 0, value: 0, origin_country_id: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ShipmentItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Fetch full shipment data after creation (for Documents/Checkout/Dispatch phases)
  const fetchShipmentData = useCallback(async (sid: number) => {
    try {
      const r = await api.get(`/api/shipments/${sid}`)
      setShipmentData(r.data?.shipment ?? r.data)
      setDocSettings(r.data?.doc_settings ?? null)
      setAvailableTransitions(r.data?.available_transitions ?? [])
      setDrivers(r.data?.drivers ?? [])
    } catch {
      toast.error('Erreur lors du chargement des données')
    }
  }, [])

  // When workflow advances past registration, fetch the shipment data
  useEffect(() => {
    if (workflowStep !== 'registration' && createdShipmentId && !shipmentData) {
      fetchShipmentData(createdShipmentId)
    }
  }, [workflowStep, createdShipmentId, shipmentData, fetchShipmentData])

  const handleDocumentsValidate = () => {
    markStepCompleted('documents')
    workflowNext()
    toast.success('Documents vérifiés')
  }

  const handleRecordPayment = async (data: { amount: number; method: string; reference?: string; note?: string }) => {
    await api.post(`/api/shipments/${createdShipmentId}/record-payment`, {
      amount: data.amount,
      payment_method: data.method,
      reference: data.reference,
      notes: data.note,
    })
    if (createdShipmentId) await fetchShipmentData(createdShipmentId)
  }

  const handlePaymentComplete = () => {
    markStepCompleted('checkout')
    workflowNext()
    toast.success('Paiement validé')
  }

  const handleDispatch = async (data: { status_id: number; notes?: string }) => {
    await updateStatus.mutateAsync({
      id: createdShipmentId!,
      status_id: data.status_id,
      note: data.notes,
    })
    markStepCompleted('dispatch')
    if (createdShipmentId) await fetchShipmentData(createdShipmentId)
  }

  const handleSubmit = () => {
    const payload = buildWizardPayload()
    if (!payload) return
    if (notes.trim()) {
      const so = (payload.service_options as Record<string, unknown>) || {}
      payload.service_options = { ...so, notes: notes.trim() }
    }

    createMutation.mutate(
      { ...payload, legal_declaration_accepted: true },
      {
      onSuccess: (data: { id?: number }) => {
        const newId = data?.id
        if (newId) {
          setShipmentId(newId)
          markStepCompleted('registration')
          workflowNext()
          toast.success('Expédition créée avec succès')
        } else {
          navigate('/shipments')
        }
      },
      onError: (err: { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }) => {
        if (err.response?.status === 422) {
          setErrors(err.response.data?.errors || {})
        }
      },
    }
    )
  }

  const snap = previewData?.pricing_snapshot as Record<string, number | string> | undefined

  const canProceedStep1 = Boolean(clientId && recipientId)
  const canProceedStep2 = items.length > 0 && items.every((i) => i.description && i.quantity > 0)
  const canProceedStep3 = Boolean(shippingModeId)
  const canSubmit =
    canProceedStep1 &&
    canProceedStep2 &&
    canProceedStep3 &&
    step === 4 &&
    legalDeclarationAccepted &&
    !createMutation.isPending

  const clientOptions = useMemo(
    () =>
      clientList.map((c: { id: number; name: string; email?: string }) => ({
        value: String(c.id),
        label: (
          <span className="truncate">
            {displayLocalized(c.name)} ({c.email})
          </span>
        ),
        keywords: [String(displayLocalized(c.name)), c.email ?? ''].filter(Boolean),
      })),
    [clientList],
  )

  const recipientOptions = useMemo(
    () =>
      recipientList.map((r: { id: number; name: string }) => ({
        value: String(r.id),
        label: r.name,
        keywords: [r.name],
      })),
    [recipientList],
  )

  const agencyOptions = useMemo(
    () =>
      agencyList.map((a: { id: number; name: unknown }) => ({
        value: String(a.id),
        label: displayLocalized(a.name as string),
        keywords: [String(displayLocalized(a.name as string))],
      })),
    [agencyList],
  )

  const officeOptions = useMemo(
    () => [
      { value: '__none', label: 'Aucun', keywords: ['aucun'] },
      ...officeList.map((o: { id: number; name: unknown }) => ({
        value: String(o.id),
        label: displayLocalized(o.name as string),
        keywords: [String(displayLocalized(o.name as string))],
      })),
    ],
    [officeList],
  )

  const packagingOptions = useMemo(
    () => [
      { value: '__none', label: 'Aucun', keywords: ['aucun'] },
      ...packagingList.map((p: { id: number; name: unknown }) => ({
        value: String(p.id),
        label: displayLocalized(p.name as string),
        keywords: [String(displayLocalized(p.name as string))],
      })),
    ],
    [packagingList],
  )

  const deliveryTimeOptions = useMemo(
    () =>
      (timeListFiltered as { id: number; label?: unknown }[]).map((t) => ({
        value: String(t.id),
        label: displayLocalized((t.label as string) ?? ''),
        keywords: [String(displayLocalized((t.label as string) ?? ''))],
      })),
    [timeListFiltered],
  )

  const countryOptions = useMemo(
    () => [
      { value: '__none', label: 'Non renseigné', keywords: ['aucun', 'non'] },
      ...countryList.map((c: { id: number; name: string; iso2?: string | null; code?: string | null }) => {
        const code = c.iso2 || c.code || ''
        const label = code ? `${c.name} (${code})` : c.name
        return { value: String(c.id), label, keywords: [c.name, code].filter(Boolean) as string[] }
      }),
    ],
    [countryList],
  )

  const transportCompanyOptions = useMemo(
    () => [
      { value: '__none', label: 'Aucune', keywords: ['aucun'] },
      ...transportCompanyList.map((c: { id: number; name: string }) => ({
        value: String(c.id),
        label: c.name,
        keywords: [c.name],
      })),
    ],
    [transportCompanyList],
  )

  const shipLineOptions = useMemo(
    () => [
      { value: '__none', label: 'Aucune', keywords: ['aucun'] },
      ...shipLineList.map((l: { id: number; name: string }) => ({
        value: String(l.id),
        label: l.name,
        keywords: [l.name],
      })),
    ],
    [shipLineList],
  )

  const trackingNumber = shipmentData?.public_tracking || (createdShipmentId ? `#${createdShipmentId}` : '')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/shipments')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle expédition</h1>
          {createdShipmentId && (
            <p className="text-sm text-muted-foreground">{trackingNumber}</p>
          )}
        </div>
      </div>

      {/* Main workflow stepper */}
      <Card>
        <CardContent className="pt-6">
          <ShipmentProcessSteps
            currentStep={workflowStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {/* Phase 1: Registration (existing wizard) */}
      {workflowStep === 'registration' && (
        <>
          {loadingOptions && (
            <p className="text-sm text-muted-foreground">Chargement des options de l&apos;assistant…</p>
          )}

          <ShipmentWizardStepper step={step} onStepChange={setStep} />

          <div className="space-y-4">
            {step === 1 && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Client expediteur (CRM)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client expéditeur (recherche min. 2 caractères)</Label>
                <DbComboboxAsync
                  value={clientId}
                  onValueChange={setClientId}
                  filterQuery={clientQuery}
                  onFilterQueryChange={setClientQuery}
                  options={clientOptions}
                  searchMinLength={2}
                  belowMinText="Saisissez au moins 2 caractères pour lancer la recherche."
                  emptyText="Aucun client trouvé."
                  placeholder={clientQuery.length < 2 ? 'Recherchez puis choisissez…' : 'Choisir un client…'}
                />
                {errors.sender_client_id && (
                  <p className="text-sm text-destructive">{errors.sender_client_id[0]}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {clientId && (
            <Card>
              <CardHeader>
                <CardTitle>Destinataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Destinataire (recherche min. 2 caractères)</Label>
                  <DbComboboxAsync
                    value={recipientId}
                    onValueChange={setRecipientId}
                    filterQuery={recipientQuery}
                    onFilterQueryChange={setRecipientQuery}
                    options={recipientOptions}
                    searchMinLength={2}
                    belowMinText="Saisissez au moins 2 caractères pour lancer la recherche."
                    emptyText="Aucun destinataire trouvé."
                    placeholder={recipientQuery.length < 2 ? 'Recherchez puis choisissez…' : 'Choisir…'}
                  />
                  {errors.recipient_id && (
                    <p className="text-sm text-destructive">{errors.recipient_id[0]}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
              Suivant <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Articles a expedier</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-4 rounded-lg border p-4">
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Description de l'article"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Qte</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Poids (kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.weight_kg}
                        onChange={(e) => updateItem(index, 'weight_kg', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-2">
                        <Label>Valeur déclarée (ligne)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.value}
                          onChange={(e) => updateItem(index, 'value', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pays d&apos;origine de l&apos;article (optionnel)</Label>
                    <DbCombobox
                      value={item.origin_country_id || '__none'}
                      onValueChange={(v) => updateItem(index, 'origin_country_id', v === '__none' ? '' : v)}
                      options={countryOptions}
                      placeholder="Non renseigné"
                      searchPlaceholder="Rechercher un pays…"
                    />
                  </div>
                </div>
              ))}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Résumé</AlertTitle>
                <AlertDescription>
                  {items.reduce((sum, i) => sum + i.quantity, 0)} articles | Poids total :{' '}
                  {items.reduce((sum, i) => sum + i.weight_kg * i.quantity, 0).toFixed(2)} kg | Valeur totale
                  articles : {itemsSumValue.toFixed(2)} — Les % assurance / douane / taxe s&apos;appliquent sur la
                  valeur déclarée (somme des lignes, ou montant forcé à l&apos;étape Résumé).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
              Suivant <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logistique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mode d&apos;expédition (service) *</Label>
                {modeList.length > 5 && (
                  <Input
                    value={shippingModeFilter}
                    onChange={(e) => setShippingModeFilter(e.target.value)}
                    placeholder="Filtrer les modes…"
                    className="max-w-md"
                    aria-label="Filtrer les modes d'expédition"
                  />
                )}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {modesFiltered.map((m: { id: number; name: unknown }) => {
                    const idStr = String(m.id)
                    const selected = idStr === shippingModeId
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setShippingModeId(idStr)}
                        className={cn(
                          'rounded-lg border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected && 'border-primary bg-primary/5 ring-2 ring-primary'
                        )}
                      >
                        <span className="font-medium leading-snug">{displayLocalized(m.name as string)}</span>
                      </button>
                    )
                  })}
                </div>
                {modeList.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun mode d&apos;expédition configuré.</p>
                )}
                {modeList.length > 0 && modesFiltered.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun mode ne correspond au filtre.</p>
                )}
                {errors.shipping_mode_id && (
                  <p className="text-sm text-destructive">{errors.shipping_mode_id[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Agence</Label>
                <DbCombobox
                  value={agencyId}
                  onValueChange={setAgencyId}
                  options={agencyOptions}
                  placeholder="Sélectionner…"
                  searchPlaceholder="Filtrer les agences…"
                />
              </div>

              <div className="space-y-2">
                <Label>Bureau / point (optionnel)</Label>
                <DbCombobox
                  value={officeId || '__none'}
                  onValueChange={(v) => setOfficeId(v === '__none' ? '' : v)}
                  options={officeOptions}
                  placeholder="Aucun"
                  searchPlaceholder="Filtrer…"
                />
              </div>

              <div className="space-y-2">
                <Label>Emballage (optionnel)</Label>
                <DbCombobox
                  value={packagingTypeId || '__none'}
                  onValueChange={(v) => setPackagingTypeId(v === '__none' ? '' : v)}
                  options={packagingOptions}
                  placeholder="Aucun"
                  searchPlaceholder="Filtrer…"
                />
              </div>

              <div className="space-y-2">
                <Label>Délai de livraison (optionnel)</Label>
                <DbCombobox
                  value={deliveryTimeId || '__none'}
                  onValueChange={(v) => setDeliveryTimeId(v === '__none' ? '' : v)}
                  options={[
                    { value: '__none', label: 'Aucun', keywords: ['aucun'] },
                    ...deliveryTimeOptions,
                  ]}
                  disabled={!shippingModeId}
                  placeholder={shippingModeId ? 'Sélectionner…' : "Choisir un mode d'abord"}
                  searchPlaceholder="Filtrer les délais…"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Compagnie de transport (optionnel)</Label>
                  <DbCombobox
                    value={transportCompanyId || '__none'}
                    onValueChange={(v) => setTransportCompanyId(v === '__none' ? '' : v)}
                    options={transportCompanyOptions}
                    placeholder="Aucune"
                    searchPlaceholder="Filtrer…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ligne d&apos;expédition (optionnel)</Label>
                  <DbCombobox
                    value={shipLineId || '__none'}
                    onValueChange={(v) => setShipLineId(v === '__none' ? '' : v)}
                    options={shipLineOptions}
                    placeholder="Aucune"
                    searchPlaceholder="Filtrer…"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
            </Button>
            <Button onClick={() => setStep(4)} disabled={!canProceedStep3}>
              Suivant <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résumé & tarification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Valeur déclarée forcée (optionnel)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={declaredOverride}
                  onChange={(e) => setDeclaredOverride(e.target.value)}
                  placeholder={`Par défaut : somme des articles (${itemsSumValue.toFixed(2)})`}
                />
                <p className="text-xs text-muted-foreground">
                  Assurance, droits de douane et calculs utilisent cette base. Laisser vide pour utiliser la somme des
                  valeurs des lignes.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Assurance (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={insurancePct}
                    onChange={(e) => setInsurancePct(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Droits de douane (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={customsDutyPct}
                    onChange={(e) => setCustomsDutyPct(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxe (%)</Label>
                  <Input type="number" step="0.01" min={0} max={100} value={taxPct} onChange={(e) => setTaxPct(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Remise (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Supplément (montant fixe)</Label>
                  <Input type="number" step="0.01" min={0} value={manualFee} onChange={(e) => setManualFee(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Libellé du supplément (optionnel)</Label>
                  <Input
                    value={manualFeeLabel}
                    onChange={(e) => setManualFeeLabel(e.target.value)}
                    placeholder="Ex. Frais spéciaux — affiché « Supplément … » sur la facture"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="legal-declaration"
                    checked={legalDeclarationAccepted}
                    onChange={(e) => setLegalDeclarationAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-input"
                  />
                  <Label htmlFor="legal-declaration" className="cursor-pointer text-sm font-normal leading-snug">
                    Je certifie que les informations déclarées (description, quantités, valeurs et pays d&apos;origine)
                    sont exactes et que le contenu respecte la réglementation en vigueur (douanes, produits interdits,
                    etc.). *
                  </Label>
                </div>
                {errors.legal_declaration_accepted && (
                  <p className="text-sm text-destructive">{errors.legal_declaration_accepted[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes / instructions</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions spéciales…" rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aperçu du tarif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {previewPending && <p className="text-muted-foreground">Calcul…</p>}
              {snap && !previewPending && (
                <ul className="grid gap-1 sm:grid-cols-2">
                  <li>
                    Base : <strong>{Number(snap.base_quote).toFixed(2)}</strong>
                  </li>
                  <li>
                    Emballage : <strong>{Number(snap.packaging_fee ?? 0).toFixed(2)}</strong>
                  </li>
                  {Number(snap.manual_fee ?? 0) > 0 && (
                    <li>
                      Supplément : <strong>{Number(snap.manual_fee).toFixed(2)}</strong>
                    </li>
                  )}
                  <li>
                    Assurance : <strong>{Number(snap.insurance_amount).toFixed(2)}</strong> ({snap.insurance_pct}%)
                  </li>
                  <li>
                    Douane : <strong>{Number(snap.customs_duty_amount).toFixed(2)}</strong> ({snap.customs_duty_pct}%)
                  </li>
                  <li>
                    Sous-total : <strong>{Number(snap.subtotal).toFixed(2)}</strong>
                  </li>
                  <li>
                    Taxe : <strong>{Number(snap.tax_amount).toFixed(2)}</strong> ({snap.tax_pct}%)
                  </li>
                  <li>
                    Remise : <strong>{Number(snap.discount_amount).toFixed(2)}</strong>
                  </li>
                  <li className="sm:col-span-2 text-base font-semibold">
                    Total : {Number(snap.total).toFixed(2)} {previewData?.currency ?? ''}
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Precedent
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {createMutation.isPending ? 'Creation...' : "Creer l'expedition"}
            </Button>
          </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* Phase 2: Documents */}
      {workflowStep === 'documents' && createdShipmentId && (
        <DocumentPreviewStep
          shipmentId={createdShipmentId}
          trackingNumber={trackingNumber}
          onValidate={handleDocumentsValidate}
        />
      )}

      {/* Phase 3: Checkout / Caisse */}
      {workflowStep === 'checkout' && createdShipmentId && (
        <CheckoutStep
          shipment={shipmentData}
          docSettings={docSettings}
          onPaymentRecorded={handlePaymentComplete}
          onRecordPayment={handleRecordPayment}
          isProcessing={false}
        />
      )}

      {/* Phase 4: Dispatch / Expédition */}
      {workflowStep === 'dispatch' && createdShipmentId && (
        <DispatchStep
          shipment={shipmentData}
          availableTransitions={availableTransitions}
          drivers={drivers}
          onDispatch={handleDispatch}
          isProcessing={updateStatus.isPending}
        />
      )}
    </div>
  )
}

export default function ShipmentCreate() {
  return (
    <ShipmentWorkflowProvider>
      <ShipmentCreateContent />
    </ShipmentWorkflowProvider>
  )
}
