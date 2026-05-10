import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'

interface ProfilePasswordSectionProps {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  changingPw: boolean
  onCurrentPasswordChange: (v: string) => void
  onNewPasswordChange: (v: string) => void
  onConfirmPasswordChange: (v: string) => void
  onPasswordSubmit: (e: React.FormEvent) => void
}

export function ProfilePasswordSection({
  currentPassword,
  newPassword,
  confirmPassword,
  changingPw,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onPasswordSubmit,
}: ProfilePasswordSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={18} /> Changer le mot de passe
        </CardTitle>
        <CardDescription>
          Utilisez un mot de passe fort d&apos;au moins 8 caracteres.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onPasswordSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pw">Mot de passe actuel</Label>
            <Input
              id="current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pw">Nouveau mot de passe</Label>
            <Input
              id="new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirmer le mot de passe</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" variant="outline" disabled={changingPw}>
            {changingPw ? 'Modification...' : 'Changer le mot de passe'}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
