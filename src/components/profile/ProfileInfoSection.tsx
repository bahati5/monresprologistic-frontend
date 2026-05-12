import { useCallback, useEffect, useRef, useState } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookUser, Camera, MapPin, User } from 'lucide-react'
import { toast } from 'sonner'

import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PhoneContactFields } from '@/components/PhoneContactFields'
import { LocationCascadeWithEnrichment } from '@/components/location/LocationCascadeWithEnrichment'
import { resolveImageUrl } from '@/lib/resolveImageUrl'
import { getApiErrorMessage } from '@/lib/apiError'
import { isPortalClientUser } from '@/lib/savPortalPaths'
import { usePhoneCountries } from '@/hooks/useSettings'
import type { AuthUser } from '@/types'

interface ProfileApiShape {
  id?: number
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  phone_secondary?: string | null
  address?: string | null
  landmark?: string | null
  zip_code?: string | null
  country_id?: number | null
  state_id?: number | null
  city_id?: number | null
}

interface AddressBookRow {
  id: number
  alias?: string
  contact?: { first_name?: string; last_name?: string; email?: string; phone?: string }
}

interface ProfileInfoSectionProps {
  user: AuthUser | null
  profile: ProfileApiShape | undefined | null
  addressRows: AddressBookRow[]
  setUser: (u: AuthUser | null) => void
  queryClient: QueryClient
}

export function ProfileInfoSection({
  user,
  profile,
  addressRows,
  setUser,
  queryClient,
}: ProfileInfoSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneSecondary, setPhoneSecondary] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [countryId, setCountryId] = useState<number | null>(null)
  const [stateId, setStateId] = useState<number | null>(null)
  const [cityId, setCityId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const { data: phoneCountries = [], isLoading: loadingPhoneCountries } = usePhoneCountries()

  useEffect(() => {
    if (!user) return
    setEmail(user.email || '')
    const fn = profile?.first_name ?? user.first_name ?? ''
    const ln = profile?.last_name ?? user.last_name ?? ''
    if (fn || ln) {
      setFirstName(fn || '')
      setLastName(ln || '')
    } else {
      const parts = (user.name || '').trim().split(/\s+/)
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
    }
    setPhone(profile?.phone ?? user.phone ?? '')
    setPhoneSecondary(profile?.phone_secondary ?? '')
    setAddress(profile?.address ?? '')
    setLandmark(profile?.landmark ?? '')
    setZipCode(profile?.zip_code ?? '')
    setCountryId(profile?.country_id ?? null)
    setStateId(profile?.state_id ?? null)
    setCityId(profile?.city_id ?? null)
  }, [user, profile])

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await api.post<{ user: AuthUser }>('/api/profile/avatar', fd)
      return data.user
    },
    onSuccess: (u) => {
      setUser(u)
      queryClient.invalidateQueries({ queryKey: ['profile-full'] })
      toast.success('Photo de profil mise a jour.')
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Impossible de telecharger la photo.'))
    },
  })

  const handleAvatarPick = () => fileRef.current?.click()

  const handlePrimaryDialCountryChange = useCallback((dialCountryId: number | null) => {
    if (dialCountryId == null) return
    setCountryId((current) => current ?? dialCountryId)
  }, [])

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    avatarMutation.mutate(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = `${firstName} ${lastName}`.trim()
    if (!name) {
      toast.error('Indiquez au moins un prenom ou un nom.')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.patch<{ user: AuthUser }>('/api/profile', {
        name,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        phone_secondary: phoneSecondary.trim() || null,
        address: address.trim() || null,
        landmark: landmark.trim() || null,
        zip_code: zipCode.trim() || null,
        country_id: countryId,
        state_id: stateId,
        city_id: cityId,
      })
      setUser(data.user)
      queryClient.invalidateQueries({ queryKey: ['profile-full'] })
      toast.success('Profil mis a jour.')
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la mise a jour.'))
    } finally {
      setSaving(false)
    }
  }

  const avatarSrc = user?.avatar_url ? resolveImageUrl(user.avatar_url) : ''
  const isClient = isPortalClientUser(user)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} /> Photo et identite
          </CardTitle>
          <CardDescription>
            Photo visible par les equipes pour vous reconnaitre ; prenom et nom utilises sur vos documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={onAvatarChange}
            />
            <div className="h-24 w-24 rounded-full border-2 border-muted overflow-hidden bg-muted flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-muted-foreground">
                  {(firstName || user?.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3 w-full"
              onClick={handleAvatarPick}
              disabled={avatarMutation.isPending}
            >
              <Camera size={14} className="mr-1.5" />
              {avatarMutation.isPending ? 'Envoi...' : 'Changer la photo'}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2 max-w-[10rem]">
              JPG, PNG, WebP ou GIF, 4 Mo max.
            </p>
          </div>
          <form className="flex-1 space-y-4 w-full min-w-0" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prenom</Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <PhoneContactFields
                label="Telephone"
                primary={phone}
                secondary={phoneSecondary}
                onPrimaryChange={setPhone}
                onSecondaryChange={setPhoneSecondary}
                countries={phoneCountries}
                isLoadingCountries={loadingPhoneCountries}
                disabled={saving}
                onPrimaryDialCountryChange={handlePrimaryDialCountryChange}
              />
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin size={16} className="text-primary" />
              Adresse et localisation
            </div>
            <LocationCascadeWithEnrichment
              value={{
                countryId,
                stateId,
                cityId,
              }}
              onChange={(loc) => {
                setCountryId(loc.countryId === '' || loc.countryId == null ? null : Number(loc.countryId))
                setStateId(loc.stateId === '' || loc.stateId == null ? null : Number(loc.stateId))
                setCityId(loc.cityId === '' || loc.cityId == null ? null : Number(loc.cityId))
              }}
              disabled={saving}
              allowEmpty
            />
            <div className="space-y-2">
              <Label htmlFor="address">Adresse (rue, numero, batiment)</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Numero, rue, complement..."
                autoComplete="street-address"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zip">Code postal</Label>
                <Input
                  id="zip"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  autoComplete="postal-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landmark">Point de repere</Label>
                <Input
                  id="landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Ex. : face a la pharmacie du coin"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookUser size={18} /> Carnet d&apos;adresses
          </CardTitle>
          <CardDescription>Destinataires enregistres pour vos expeditions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {addressRows.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {addressRows.map((row) => {
                const p = row.contact
                const contactName = p
                  ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                  : row.alias || 'Contact'
                return (
                  <li
                    key={row.id}
                    className="flex justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <span className="font-medium truncate">{contactName || '\u2014'}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {p?.email || p?.phone || ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune entree pour le moment.</p>
          )}
          {!isClient && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/shipments/create">Nouvelle expedition</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  )
}
