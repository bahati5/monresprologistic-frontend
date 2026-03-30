import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Settings,
  Building2,
  Truck,
  CreditCard,
  Bell,
  Mail,
  Globe,
  Package,
  FileText,
  Users,
  MapPin,
  DollarSign,
  Workflow,
  Paintbrush,
} from 'lucide-react'

export default function SettingsHub() {
  const [activeTab, setActiveTab] = useState('general')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/settings').then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Parametres</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parametres</h1>
        <Badge variant="outline">Admin</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap justify-start h-auto gap-2">
          <TabsTrigger value="general" className="gap-2"><Settings size={16} /> General</TabsTrigger>
          <TabsTrigger value="agencies" className="gap-2"><Building2 size={16} /> Agences</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2"><Truck size={16} /> Transport</TabsTrigger>
          <TabsTrigger value="finance" className="gap-2"><DollarSign size={16} /> Finance</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell size={16} /> Notifications</TabsTrigger>
          <TabsTrigger value="email" className="gap-2"><Mail size={16} /> Email/SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings settings={settings?.app} />
        </TabsContent>

        <TabsContent value="agencies" className="space-y-4">
          <AgenciesSettings />
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <ShippingSettings />
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <FinanceSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsSettings />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GeneralSettings({ settings }: { settings?: any }) {
  const [appName, setAppName] = useState(settings?.app_name || 'Monrespro')
  const [currency, setCurrency] = useState(settings?.currency || 'USD')

  const handleSave = async () => {
    try {
      await api.put('/api/settings/app', { app_name: appName, currency })
      toast.success('Parametres enregistres')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={20} /> Parametres generaux
        </CardTitle>
        <CardDescription>Configuration de base de l'application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nom de l'application</Label>
          <Input value={appName} onChange={e => setAppName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Devise par defaut</Label>
          <Input value={currency} onChange={e => setCurrency(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Logo</Label>
          <Input type="file" accept="image/*" />
        </div>
        <Button onClick={handleSave}>Enregistrer</Button>
      </CardContent>
    </Card>
  )
}

function AgenciesSettings() {
  const { data: agencies } = useQuery({
    queryKey: ['settings', 'agencies'],
    queryFn: () => api.get('/api/settings/agencies').then(r => r.data),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} /> Agences
          </CardTitle>
          <CardDescription>Gestion des agences et bureaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agencies?.agencies?.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.city}, {a.country}</p>
                </div>
                <Button variant="ghost" size="sm">Modifier</Button>
              </div>
            ))}
          </div>
          <Button className="mt-4" variant="outline">Ajouter une agence</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ShippingSettings() {
  const { data: modes } = useQuery({
    queryKey: ['settings', 'shipping-modes'],
    queryFn: () => api.get('/api/settings/shipping-modes').then(r => r.data),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={20} /> Modes de transport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {modes?.shipping_modes?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-muted-foreground">{m.code}</p>
                </div>
                <Button variant="ghost" size="sm">Modifier</Button>
              </div>
            ))}
          </div>
          <Button className="mt-4" variant="outline">Ajouter un mode</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={20} /> Types d'emballage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Gerer les types d'emballage</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} /> Zones geographiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Gerer les zones</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function FinanceSettings() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={20} /> Methodes de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Configurer les paiements</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} /> Taxes et tarifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Gerer les regles de tarification</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationsSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} /> Templates de notification
        </CardTitle>
        <CardDescription>Configurer les modeles d'emails et SMS</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {['Nouvelle expedition', 'Changement de statut', 'Livraison effectuee', 'Paiement recu'].map((template) => (
            <div key={template} className="flex items-center justify-between rounded-lg border p-3">
              <span>{template}</span>
              <Button variant="ghost" size="sm">Editer</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EmailSettings() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={20} /> Configuration SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Serveur SMTP</Label>
              <Input placeholder="smtp.example.com" />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label>Utilisateur</Label>
              <Input placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input type="password" />
            </div>
          </div>
          <Button>Tester et sauvegarder</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={20} /> Configuration Twilio (SMS)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SID de compte</Label>
            <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div className="space-y-2">
            <Label>Auth Token</Label>
            <Input type="password" />
          </div>
          <Button>Sauvegarder</Button>
        </CardContent>
      </Card>
    </div>
  )
}
