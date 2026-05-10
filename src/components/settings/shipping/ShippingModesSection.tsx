import { useState } from 'react'
import { shippingModeHooks } from '@/hooks/useSettings'
import type { ShippingMode } from '@/types/settings'
import { SettingsCard } from '../SettingsCard'
import { CrudSheet } from '../CrudSheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Clock, Plus, Pencil, Trash2 } from 'lucide-react'
import { ShippingModeSheetFields } from './ShippingModeSheetFields'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { displayLocalized } from '@/lib/localizedString'

function normalizeModeDeliveryOptions(mode: Record<string, unknown>): string[] {
  const raw = (mode.delivery_options ?? mode.deliveryOptions) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x)).filter((s) => s.trim() !== '')
}

export function ShippingModesSection() {
  const { data: modes, isLoading } = shippingModeHooks.useList()
  const create = shippingModeHooks.useCreate()
  const update = shippingModeHooks.useUpdate()
  const del = shippingModeHooks.useDelete()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setEditItem(null)
    setForm({
      name: '',
      description: '',
      is_active: true,
      sort_order: 0,
      volumetric_divisor: '' as string | number,
      default_pricing_type: '' as string,
      delivery_options: [] as string[],
    })
    setSheetOpen(true)
  }

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item)
    setForm({
      name: item.name ?? '',
      description: item.description ?? '',
      is_active: item.is_active !== false,
      sort_order: item.sort_order ?? 0,
      volumetric_divisor:
        item.volumetric_divisor != null && item.volumetric_divisor !== ''
          ? String(item.volumetric_divisor)
          : '',
      default_pricing_type: String(
        (item as Record<string, unknown>).default_pricing_type ??
          (item as Record<string, unknown>).defaultPricingType ??
          '',
      ),
      delivery_options: normalizeModeDeliveryOptions(item),
    })
    setSheetOpen(true)
  }

  const addDeliveryOptionRow = () => {
    const rows = (form.delivery_options as string[]) ?? []
    setForm((p) => ({
      ...p,
      delivery_options: [...rows, ''],
    }))
  }

  const updateDeliveryOptionRow = (index: number, value: string) => {
    const rows = [...((form.delivery_options as string[]) ?? [])]
    rows[index] = value
    set('delivery_options', rows)
  }

  const removeDeliveryOptionRow = (index: number) => {
    const rows = [...((form.delivery_options as string[]) ?? [])]
    rows.splice(index, 1)
    set('delivery_options', rows)
  }

  const buildPayload = () => {
    const delivery_options = ((form.delivery_options as string[]) ?? [])
      .map((s) => String(s).trim())
      .filter((s) => s !== '')

    const vd = String(form.volumetric_divisor ?? '').trim()
    const volumetricDivisor =
      vd === '' ? null : (() => {
        const n = parseInt(vd, 10)
        return Number.isFinite(n) && n >= 1 ? n : null
      })()

    const dpt = String(form.default_pricing_type ?? '').trim()
    const defaultPricingType: ShippingMode['default_pricing_type'] =
      dpt === 'per_kg' || dpt === 'per_volume' || dpt === 'flat' ? dpt : null

    return {
      name: String(form.name ?? '').trim(),
      description: form.description ? String(form.description) : null,
      is_active: form.is_active !== false,
      sort_order: Number(form.sort_order) || 0,
      volumetric_divisor: volumetricDivisor,
      default_pricing_type: defaultPricingType,
      delivery_options,
    }
  }

  const handleSubmit = () => {
    const payload = buildPayload()
    if (!payload.name) return
    if (editItem?.id != null) {
      update.mutate(
        { id: editItem.id as number, data: payload as Record<string, unknown> },
        { onSuccess: () => setSheetOpen(false) }
      )
    } else {
      create.mutate(payload as Record<string, unknown>, { onSuccess: () => setSheetOpen(false) })
    }
  }

  const modeRows = Array.isArray(modes) ? modes : []

  return (
    <>
      <SettingsCard
        title="Modes d'expédition & délais"
        icon={Truck}
        badge={`${modeRows.length}`}
        isLoading={isLoading}
        description="Libellés de délai saisis à la main pour chaque mode (assistant et surcharges sur les tarifs ligne)."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} className="mr-1" />
            Ajouter un mode
          </Button>
        }
      >
        <div className="space-y-2">
          {modeRows.map((item) => {
            const row = item as unknown as Record<string, unknown>
            const dts = normalizeModeDeliveryOptions(row)
            return (
              <div
                key={String(row.id)}
                className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{displayLocalized(String(row.name ?? ''))}</p>
                  {row.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {displayLocalized(String(row.description))}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1 align-middle" />
                    {dts.length} libellé{dts.length !== 1 ? 's' : ''} de délai
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row.is_active !== undefined && (
                    <Badge variant={row.is_active ? 'default' : 'secondary'} className="text-xs">
                      {row.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                    <Pencil size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce mode ?</AlertDialogTitle>
                        <AlertDialogDescription>Les options de délai de ce mode seront supprimées avec lui.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del.mutate(row.id as number)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
          {modeRows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun mode d'expédition</p>
          )}
        </div>
      </SettingsCard>

      <CrudSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editItem ? 'Modifier le mode' : 'Nouveau mode'}
        onSubmit={handleSubmit}
        isLoading={create.isPending || update.isPending}
      >
        <ShippingModeSheetFields
          form={form}
          set={set}
          addDeliveryOptionRow={addDeliveryOptionRow}
          updateDeliveryOptionRow={updateDeliveryOptionRow}
          removeDeliveryOptionRow={removeDeliveryOptionRow}
        />
      </CrudSheet>
    </>
  )
}
