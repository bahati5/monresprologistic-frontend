import type { UseMutationResult } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Bell, Calendar, Monitor, Moon, Sun } from 'lucide-react'

import { useThemeStore } from '@/stores/themeStore'

interface ProfilePreferencesSectionProps {
  prefs: Record<string, boolean>
  user: { created_at?: string; roles?: string[] } | null
  updatePrefsMutation: UseMutationResult<unknown, Error, Record<string, boolean>>
}

export function ProfilePreferencesSection({ prefs, user, updatePrefsMutation }: ProfilePreferencesSectionProps) {
  const { theme, setTheme } = useThemeStore()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={18} /> Preferences de notification
          </CardTitle>
          <CardDescription>
            Choisissez comment vous souhaitez recevoir les notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'in_app', label: 'Notifications in-app', desc: "Dans l'interface Monrespro" },
            { key: 'email', label: 'Notifications par email', desc: 'Envoyees sur votre adresse email' },
            { key: 'sms', label: 'Notifications par SMS', desc: 'Envoyees sur votre numero de telephone' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={!!prefs[key]}
                onCheckedChange={(checked) => updatePrefsMutation.mutate({ [key]: checked })}
                disabled={updatePrefsMutation.isPending}
              />
            </div>
          ))}
        </CardContent>
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
            ] as const).map((opt) => (
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={18} /> Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date de creation</span>
            <span>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '\u2014'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Roles</span>
            <span>{user?.roles?.join(', ') || '\u2014'}</span>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
