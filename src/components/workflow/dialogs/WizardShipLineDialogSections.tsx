import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CountryMultiSelect } from '@/components/ui/CountryMultiSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { displayLocalized } from '@/lib/localizedString'
import { shipLineRouteSummary } from './wizardDialogUtils'

export type WizardShipLineCountryOption = {
  id: number
  name: string
  code: string | null
  iso2: string | null
  emoji: string | null
}

export interface WizardShipLineDialogSectionsProps {
  wizardTab: 'create' | 'extend'
  setWizardTab: (v: 'create' | 'extend') => void
  shipLinesLoading: boolean
  shipLines: Record<string, unknown>[]
  selectedLineIds: number[]
  toggleLineSelect: (id: number, on: boolean) => void
  countries: WizardShipLineCountryOption[]
  originIds: number[]
  setOriginIds: (ids: number[]) => void
  destIds: number[]
  setDestIds: (ids: number[]) => void
  modeList: Record<string, unknown>[]
  modeId: number
  onModeIdChange: (mid: number) => void
  delayOpts: string[]
  delayPickKey: string
  setDelayPickKey: (v: string) => void
  deliveryLabelOverride: string
  setDeliveryLabelOverride: (v: string) => void
  currencyUi: string
  unitPrice: string
  setUnitPrice: (v: string) => void
  description: string
  setDescription: (v: string) => void
}

export function WizardShipLineDialogSections({
  wizardTab,
  setWizardTab,
  shipLinesLoading,
  shipLines,
  selectedLineIds,
  toggleLineSelect,
  countries,
  originIds,
  setOriginIds,
  destIds,
  setDestIds,
  modeList,
  modeId,
  onModeIdChange,
  delayOpts,
  delayPickKey,
  setDelayPickKey,
  deliveryLabelOverride,
  setDeliveryLabelOverride,
  currencyUi,
  unitPrice,
  setUnitPrice,
  description,
  setDescription,
}: WizardShipLineDialogSectionsProps) {
  return (
    <>
      <Tabs
        value={wizardTab}
        onValueChange={(v) => setWizardTab(v === 'extend' ? 'extend' : 'create')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Nouvelle ligne</TabsTrigger>
          <TabsTrigger value="extend">Lignes existantes</TabsTrigger>
        </TabsList>
        <TabsContent value="create" className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Pas de nom à saisir : il sera généré à partir des pays d&apos;origine et de destination (ex. BE, FR → CD).
          </p>
        </TabsContent>
        <TabsContent value="extend" className="mt-3 space-y-2">
          <Label className="text-xs font-semibold">Lignes à enrichir *</Label>
          <p className="text-xs text-muted-foreground">
            Cochez une ou plusieurs lignes : les pays et le tarif ci-dessous leur seront ajoutés (sans supprimer
            l&apos;existant).
          </p>
          <div className="max-h-32 overflow-y-auto rounded border p-2 space-y-1.5">
            {shipLinesLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : shipLines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune ligne enregistrée. Créez d&apos;abord une ligne.</p>
            ) : (
              shipLines.map((line) => {
                const lid = Number(line.id)
                if (!Number.isFinite(lid)) return null
                const summary = shipLineRouteSummary(line)
                return (
                  <label key={lid} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border border-input"
                      checked={selectedLineIds.includes(lid)}
                      onChange={(e) => toggleLineSelect(lid, e.target.checked)}
                    />
                    <span>
                      <span className="font-medium">{String(line.name ?? '')}</span>
                      {summary ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{summary}</span>
                      ) : null}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-3 border-t pt-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Pays d&apos;origine *</Label>
          <CountryMultiSelect
            options={countries}
            selectedIds={originIds}
            onChange={setOriginIds}
            placeholder="Rechercher et sélectionner…"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Pays de destination *</Label>
          <CountryMultiSelect
            options={countries}
            selectedIds={destIds}
            onChange={setDestIds}
            placeholder="Rechercher et sélectionner…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Mode d&apos;expédition *</Label>
          <Select
            value={modeId ? String(modeId) : ''}
            onValueChange={(v: string) => {
              const mid = Number(v)
              onModeIdChange(mid)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {modeList.map((m) => (
                <SelectItem key={String(m.id)} value={String(m.id)}>
                  {displayLocalized(String(m.name ?? ''))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Le type de prix et le diviseur volumétrique viennent du mode (paramètres).
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Surcharge délai (optionnel)</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              className="flex-1"
              placeholder="ex. 5–7 jours ouvrés"
              value={deliveryLabelOverride}
              onChange={(e) => setDeliveryLabelOverride(e.target.value)}
              disabled={!modeId}
            />
            <Select
              value={delayPickKey}
              onValueChange={(v) => {
                if (v === '__pick') return
                if (v === '__clear') {
                  setDeliveryLabelOverride('')
                } else {
                  setDeliveryLabelOverride(v)
                }
                setDelayPickKey('__pick')
              }}
              disabled={!modeId || delayOpts.length === 0}
            >
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Depuis le mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__pick">Insérer un libellé du mode…</SelectItem>
                <SelectItem value="__clear">Effacer</SelectItem>
                {delayOpts.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Prix * ({currencyUi})</Label>
          <Input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </div>
        {wizardTab === 'create' ? (
          <div className="space-y-1.5">
            <Label>Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Notes internes…"
            />
          </div>
        ) : null}
      </div>
    </>
  )
}
