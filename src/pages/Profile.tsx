import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.patch('/api/profile', { name, email })
      setUser(data.user)
      toast.success('Profil mis a jour.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise a jour.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Mettez a jour vos informations de profil.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>Choisissez votre theme prefere.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {([
              { value: 'light' as const, label: 'Clair', icon: <Sun size={18} /> },
              { value: 'dark' as const, label: 'Sombre', icon: <Moon size={18} /> },
              { value: 'system' as const, label: 'Systeme', icon: <Monitor size={18} /> },
            ]).map((opt) => (
              <Button
                key={opt.value}
                variant={theme === opt.value ? 'default' : 'outline'}
                className="flex items-center gap-2"
                onClick={() => setTheme(opt.value)}
              >
                {opt.icon} {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
