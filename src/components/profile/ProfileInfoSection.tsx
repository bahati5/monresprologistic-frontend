import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookUser, MapPin, Package, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CountryNameWithFlag, type CountryLike } from '@/components/CountryNameWithFlag'

interface ProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  phone_secondary?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: CountryLike
  landmark?: string
}

interface AddressBookRow {
  id: number
  alias?: string
  contact?: { first_name?: string; last_name?: string; email?: string; phone?: string }
}

interface ProfileInfoSectionProps {
  profile: ProfileData | undefined
  user: { name?: string; email?: string; locker_number?: string } | null
  addressRows: AddressBookRow[]
  name: string
  email: string
  phone: string
  saving: boolean
  onNameChange: (v: string) => void
  onEmailChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onProfileSubmit: (e: React.FormEvent) => void
}

export function ProfileInfoSection({
  profile,
  user,
  addressRows,
  name,
  email,
  phone,
  saving,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onProfileSubmit,
}: ProfileInfoSectionProps) {
  return (
    <>
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} /> Informations du profil
            </CardTitle>
            <CardDescription>
              Donnees associees a votre profil logistique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {profile.first_name && (
                <div>
                  <p className="text-muted-foreground text-xs">Prenom</p>
                  <p className="font-medium">{profile.first_name}</p>
                </div>
              )}
              {profile.last_name && (
                <div>
                  <p className="text-muted-foreground text-xs">Nom</p>
                  <p className="font-medium">{profile.last_name}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <p className="text-muted-foreground text-xs">Telephone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}
              {profile.phone_secondary && (
                <div>
                  <p className="text-muted-foreground text-xs">Telephone secondaire</p>
                  <p className="font-medium">{profile.phone_secondary}</p>
                </div>
              )}
              {profile.address && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs">Adresse</p>
                  <p className="font-medium">{profile.address}</p>
                </div>
              )}
              {(profile.city || profile.state) && (
                <div>
                  <p className="text-muted-foreground text-xs">Ville / Region</p>
                  <p className="font-medium">
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {profile.zip_code && (
                <div>
                  <p className="text-muted-foreground text-xs">Code postal</p>
                  <p className="font-medium">{profile.zip_code}</p>
                </div>
              )}
              {profile.country && (
                <div>
                  <p className="text-muted-foreground text-xs">Pays</p>
                  <div className="font-medium flex items-center gap-2 pt-0.5">
                    <CountryNameWithFlag country={profile.country} flagSize="sm" />
                  </div>
                </div>
              )}
              {profile.landmark && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs">Point de repere</p>
                  <p className="font-medium">{profile.landmark}</p>
                </div>
              )}
            </div>
            {user?.locker_number && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 text-sm">
                  <Package size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Casier :</span>
                  <span className="font-mono font-semibold">{user.locker_number}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookUser size={18} /> Carnet d&apos;adresses
          </CardTitle>
          <CardDescription>
            Destinataires enregistres pour vos expeditions.
          </CardDescription>
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
            <p className="text-sm text-muted-foreground">
              Aucune entree pour le moment.
            </p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/shipments/create">Nouvelle expedition</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={18} /> Informations personnelles
          </CardTitle>
          <CardDescription>
            Mettez a jour votre nom, email et telephone.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onProfileSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </>
  )
}
