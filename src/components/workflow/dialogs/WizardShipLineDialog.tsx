import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  shipLineHooks,
  shippingModeHooks,
  useAppSettings,
  useCountriesList,
  useMergeShipLineRoute,
} from '@/hooks/useSettings'
import { resolveMoneySymbol } from '@/lib/formatCurrency'
import { userCan } from '@/lib/permissions'
import type { AuthUser } from '@/types'
import type { AppSettings } from '@/types/settings'
import { CREATE_OPTIONS_KEY, deliveryOptionsForMode, refetchAndPickMaxId } from './wizardDialogUtils'
import { WizardShipLineDialogSections } from './WizardShipLineDialogSections'

interface WizardShipLineCreateDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  user: AuthUser | null
  onCreated: (id: string) => void
  prefillOriginCountryId?: string
  prefillDestCountryId?: string
}

export function WizardShipLineCreateDialog({
  open,
  onOpenChange,
  user,
  onCreated,
  prefillOriginCountryId,
  prefillDestCountryId,
}: WizardShipLineCreateDialogProps) {
  if (!userCan(user, 'manage_settings')) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <WizardShipLineForm
          onOpenChange={onOpenChange}
          onCreated={onCreated}
          prefillOriginCountryId={prefillOriginCountryId}
          prefillDestCountryId={prefillDestCountryId}
        />
      </DialogContent>
    </Dialog>
  )
}

function WizardShipLineForm({
  onOpenChange,
  onCreated,
  prefillOriginCountryId,
  prefillDestCountryId,
}: {
  onOpenChange: (o: boolean) => void
  onCreated: (id: string) => void
  prefillOriginCountryId?: string
  prefillDestCountryId?: string
}) {
  const qc = useQueryClient()
  const create = shipLineHooks.useCreate()
  const mergeRoute = useMergeShipLineRoute()
  const { data: shipLinesRaw = [], isLoading: shipLinesLoading } = shipLineHooks.useList()
  const { data: modes } = shippingModeHooks.useList()
  const { data: countriesRaw = [] } = useCountriesList()
  const { data: appSettings } = useAppSettings()
  const globalCurrency = String((appSettings as AppSettings | undefined)?.currency ?? '').toUpperCase()
  const currencyUi = resolveMoneySymbol({
    currency: globalCurrency,
    currency_symbol: String((appSettings as AppSettings | undefined)?.currency_symbol ?? ''),
  })

  const initOrigin = prefillOriginCountryId ? [Number(prefillOriginCountryId)] : []
  const initDest = prefillDestCountryId ? [Number(prefillDestCountryId)] : []

  const [wizardTab, setWizardTab] = useState<'create' | 'extend'>('create')
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([])
  const [description, setDescription] = useState('')
  const [originIds, setOriginIds] = useState<number[]>(
    Number.isFinite(initOrigin[0]) && initOrigin[0] > 0 ? initOrigin : [],
  )
  const [destIds, setDestIds] = useState<number[]>(
    Number.isFinite(initDest[0]) && initDest[0] > 0 ? initDest : [],
  )
  const [modeId, setModeId] = useState(0)
  const [deliveryLabelOverride, setDeliveryLabelOverride] = useState('')
  const [delayPickKey, setDelayPickKey] = useState('__pick')
  const [unitPrice, setUnitPrice] = useState('0')

  const countries = (countriesRaw ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code || null,
    iso2: c.iso2 ?? null,
    emoji: c.emoji ?? null,
  }))
  const shipLines = (shipLinesRaw ?? []) as unknown as Record<string, unknown>[]
  const modeList = Array.isArray(modes) ? (modes as unknown as Record<string, unknown>[]) : []
  const selectedMode = modeList.find((m) => Number(m.id) === modeId)
  const delayOpts = selectedMode ? deliveryOptionsForMode(selectedMode) : []

  const toggleLineSelect = (id: number, on: boolean) => {
    setSelectedLineIds((p) => (on ? [...new Set([...p, id])] : p.filter((x) => x !== id)))
  }

  const onModeIdChange = (mid: number) => {
    setModeId(mid)
    setDeliveryLabelOverride('')
    setDelayPickKey('__pick')
  }

  const buildRatesPayload = (): Record<string, unknown>[] => {
    const ov = deliveryLabelOverride.trim()
    return [
      {
        shipping_mode_id: modeId,
        unit_price: Number(unitPrice) || 0,
        currency: globalCurrency,
        is_active: true,
        delivery_label_override: ov !== '' ? ov : null,
      },
    ]
  }

  const submit = () => {
    if (originIds.length === 0 || destIds.length === 0 || modeId <= 0) return
    create.mutate(
      {
        name: '',
        description: description.trim() || null,
        is_active: true,
        origin_country_ids: originIds,
        dest_country_ids: destIds,
        rates: buildRatesPayload(),
      } as Record<string, unknown>,
      {
        onSuccess: async (data: { ship_line?: { id: number } }) => {
          await qc.invalidateQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
          await qc.invalidateQueries({ queryKey: ['shipment-wizard', 'ship-lines-route'] })
          const sid = data?.ship_line?.id
          if (sid != null) {
            onCreated(String(sid))
            onOpenChange(false)
            return
          }
          const id = await refetchAndPickMaxId(qc, 'shipLines')
          if (id) onCreated(id)
          onOpenChange(false)
        },
      },
    )
  }

  const submitExtend = () => {
    if (selectedLineIds.length === 0 || originIds.length === 0 || destIds.length === 0 || modeId <= 0) return
    mergeRoute.mutate(
      {
        ship_line_ids: selectedLineIds,
        origin_country_ids: originIds,
        dest_country_ids: destIds,
        rates: buildRatesPayload(),
      },
      {
        onSuccess: async (data: { ship_lines?: { id: number }[] }) => {
          await qc.invalidateQueries({ queryKey: [...CREATE_OPTIONS_KEY] })
          await qc.invalidateQueries({ queryKey: ['shipment-wizard', 'ship-lines-route'] })
          const first = data?.ship_lines?.[0]?.id
          if (first != null) onCreated(String(first))
          onOpenChange(false)
        },
      },
    )
  }

  const pending = create.isPending || mergeRoute.isPending
  const canSubmitCreate = originIds.length > 0 && destIds.length > 0 && modeId > 0
  const canSubmitExtend =
    selectedLineIds.length > 0 && originIds.length > 0 && destIds.length > 0 && modeId > 0

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ligne d&apos;expédition</DialogTitle>
        <DialogDescription>
          {wizardTab === 'create'
            ? 'Choisissez les pays, un mode et un prix ; le libellé de la ligne est déduit automatiquement des pays.'
            : 'Ajoutez des pays et un tarif aux lignes cochées. Si un tarif existe déjà pour le même mode, il est mis à jour.'}
        </DialogDescription>
      </DialogHeader>
      <WizardShipLineDialogSections
        wizardTab={wizardTab}
        setWizardTab={setWizardTab}
        shipLinesLoading={shipLinesLoading}
        shipLines={shipLines}
        selectedLineIds={selectedLineIds}
        toggleLineSelect={toggleLineSelect}
        countries={countries}
        originIds={originIds}
        setOriginIds={setOriginIds}
        destIds={destIds}
        setDestIds={setDestIds}
        modeList={modeList}
        modeId={modeId}
        onModeIdChange={onModeIdChange}
        delayOpts={delayOpts}
        delayPickKey={delayPickKey}
        setDelayPickKey={setDelayPickKey}
        deliveryLabelOverride={deliveryLabelOverride}
        setDeliveryLabelOverride={setDeliveryLabelOverride}
        currencyUi={currencyUi}
        unitPrice={unitPrice}
        setUnitPrice={setUnitPrice}
        description={description}
        setDescription={setDescription}
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button
          onClick={wizardTab === 'create' ? submit : submitExtend}
          disabled={pending || (wizardTab === 'create' ? !canSubmitCreate : !canSubmitExtend)}
        >
          {pending ? '…' : wizardTab === 'create' ? 'Créer' : 'Ajouter aux lignes'}
        </Button>
      </DialogFooter>
    </>
  )
}
