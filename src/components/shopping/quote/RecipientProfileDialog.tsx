import { useEffect, useState } from 'react'
import { Loader2, Mail, MapPin, Phone, Save } from 'lucide-react'
import { toast } from 'sonner'

import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocationCountries, useLocationCities, useLocationStates } from '@/hooks/useLocationCascade'

export interface RecipientProfileData {
  phone: string
  country_id: number | null
  city_id: number | null
  address: string
}

interface MissingProfileInfo {
  missing_fields: string[]
  message: string
  client_profile: RecipientProfileData
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseId: string | number
  missingInfo: MissingProfileInfo | null
  onConvertWithOverrides: (overrides: {
    recipient_country_id?: number
    recipient_city_id?: number
    recipient_address?: string
    recipient_phone?: string
  }) => void
  isPending: boolean
}

export function RecipientProfileDialog({
  open,
  onOpenChange,
  purchaseId,
  missingInfo,
  onConvertWithOverrides,
  isPending,
}: Props) {
  const [phone, setPhone] = useState('')
  const [countryId, setCountryId] = useState<number | null>(null)
  const [stateId, setStateId] = useState<number | null>(null)
  const [cityId, setCityId] = useState<number | null>(null)
  const [address, setAddress] = useState('')
  const [notifying, setNotifying] = useState(false)

  const { data: countries = [] } = useLocationCountries()
  const { data: states = [] } = useLocationStates(countryId ?? undefined)
  const { data: cities = [] } = useLocationCities(stateId ?? undefined)

  useEffect(() => {
    if (open && missingInfo) {
      setPhone(missingInfo.client_profile.phone ?? '')
      setCountryId(missingInfo.client_profile.country_id ?? null)
      setCityId(missingInfo.client_profile.city_id ?? null)
      setAddress(missingInfo.client_profile.address ?? '')
      setStateId(null)
    }
  }, [open, missingInfo])

  const missingFields = missingInfo?.missing_fields ?? []

  const canSubmit =
    (!missingFields.includes('phone') || phone.trim().length > 0) &&
    (!missingFields.includes('country_id') || countryId != null) &&
    (!missingFields.includes('address') || address.trim().length > 0 || cityId != null)

  const handleSubmit = () => {
    const overrides: Record<string, unknown> = {}
    if (countryId != null) overrides.recipient_country_id = countryId
    if (cityId != null) overrides.recipient_city_id = cityId
    if (address.trim()) overrides.recipient_address = address.trim()
    if (phone.trim()) overrides.recipient_phone = phone.trim()
    onConvertWithOverrides(overrides as Parameters<typeof onConvertWithOverrides>[0])
  }

  const handleNotifyClient = async () => {
    setNotifying(true)
    try {
      await api.post(`/api/assisted-purchases/${purchaseId}/convert-to-shipment`, {
        check_only: false,
        notify_client: true,
      })
      toast.success('Un e-mail a été envoyé au client pour compléter son profil.')
    } catch {
      toast.error('Impossible d\'envoyer la notification.')
    } finally {
      setNotifying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin size={18} className="text-amber-500" />
            Profil destinataire incomplet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {missingInfo?.message ?? 'Des informations sont manquantes pour créer l\'expédition.'}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Complétez les champs ci-dessous ou envoyez un e-mail au client.
            </p>
          </div>

          {missingFields.includes('phone') && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Phone size={12} /> Téléphone du destinataire
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 900 000 000"
                className="text-sm"
              />
            </div>
          )}

          {missingFields.includes('country_id') && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MapPin size={12} /> Pays de destination
              </Label>
              <Select
                value={countryId != null ? String(countryId) : ''}
                onValueChange={(v) => {
                  setCountryId(Number(v))
                  setStateId(null)
                  setCityId(null)
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.emoji ? `${c.emoji} ` : ''}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {countryId != null && states.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Province / État</Label>
              <Select
                value={stateId != null ? String(stateId) : ''}
                onValueChange={(v) => {
                  setStateId(Number(v))
                  setCityId(null)
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner une province" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {stateId != null && cities.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ville</Label>
              <Select
                value={cityId != null ? String(cityId) : ''}
                onValueChange={(v) => setCityId(Number(v))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner une ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {missingFields.includes('address') && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MapPin size={12} /> Adresse complète
              </Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123, Avenue de la Paix, Commune de Gombe"
                className="text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={handleNotifyClient}
            disabled={notifying || isPending}
          >
            {notifying ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
            Envoyer un e-mail au client
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="gap-1.5 bg-[#073763] hover:bg-[#0b5394] text-white"
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Compléter et convertir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
