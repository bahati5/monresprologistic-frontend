import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Box, Package, ArrowRight, RefreshCw, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

interface LockerPackage {
  id: number
  reference_code?: string
  description?: string
  weight_kg?: number
  received_at?: string
}

export default function ClientLockerPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['client-locker'],
    queryFn: () => api.get('/api/client/locker').then(r => r.data),
  })

  const locker = data?.locker
  const packages: LockerPackage[] = data?.packages ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Box className="h-6 w-6 text-green-600" />
            Mon casier
          </h1>
          <p className="text-muted-foreground text-sm">
            Colis actuellement reçus au hub Monrespro en attente d'expédition
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} className="mr-1.5" />Actualiser
        </Button>
      </div>

      {locker && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Box className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Casier n° {locker.locker_number}</p>
              <p className="text-xs text-green-700">Identifiant unique de votre casier virtuel Monrespro</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Aucun colis dans votre casier</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les colis reçus au hub apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg: LockerPackage) => (
            <Card key={pkg.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{pkg.reference_code}</p>
                    <p className="font-medium">{pkg.description || 'Colis sans description'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Au hub</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {pkg.weight_kg && <p>Poids : <span className="font-medium">{pkg.weight_kg} kg</span></p>}
                  {pkg.received_at && (
                    <p>Reçu le : <span className="font-medium">{new Date(pkg.received_at).toLocaleDateString('fr-FR')}</span></p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                    <Link to="/shipments/create">
                      <ArrowRight size={12} className="mr-1" />Expédier ce colis
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7" asChild>
                    <Link to="/pickups">
                      <Truck size={12} className="mr-1" />Livraison à domicile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium mb-1">Comment ça marche ?</p>
        <ul className="space-y-1 text-xs">
          <li>• Vos colis reçus au hub Monrespro apparaissent ici automatiquement</li>
          <li>• Vous pouvez demander l'expédition immédiate ou la livraison à domicile pour chaque colis</li>
        </ul>
      </div>
    </div>
  )
}
