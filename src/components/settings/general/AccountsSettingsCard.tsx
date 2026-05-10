import { SettingsCard } from '../SettingsCard'
import { Switch } from '@/components/ui/switch'
import { UserCheck } from 'lucide-react'

interface AccountsSettingsCardProps {
  form: Record<string, unknown>
  set: (key: string, value: unknown) => void
}

export function AccountsSettingsCard({ form, set }: AccountsSettingsCardProps) {
  return (
    <SettingsCard title="Comptes et inscriptions" icon={UserCheck} description="Verification et notifications">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Verification automatique</p>
            <p className="text-xs text-muted-foreground">Les nouveaux comptes sont immediatement actifs</p>
          </div>
          <Switch checked={!!form.auto_verify} onCheckedChange={(v) => set('auto_verify', v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Inscription autorisee</p>
            <p className="text-xs text-muted-foreground">La page d'inscription est accessible au public</p>
          </div>
          <Switch checked={!!form.allow_registration} onCheckedChange={(v) => set('allow_registration', v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Notification admin</p>
            <p className="text-xs text-muted-foreground">L'admin recoit un email a chaque inscription</p>
          </div>
          <Switch checked={!!form.admin_notification} onCheckedChange={(v) => set('admin_notification', v)} />
        </div>
      </div>
    </SettingsCard>
  )
}
