import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import api from '@/api/client'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/apiError'

import { ProfileInfoSection } from '@/components/profile/ProfileInfoSection'
import { ProfilePasswordSection } from '@/components/profile/ProfilePasswordSection'
import { ProfilePreferencesSection } from '@/components/profile/ProfilePreferencesSection'
import { resolveImageUrl } from '@/lib/resolveImageUrl'

function useProfileData() {
  return useQuery({
    queryKey: ['profile-full'],
    queryFn: () => api.get('/api/profile').then((r) => r.data),
  })
}

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const { data: profileData } = useProfileData()
  const profile = profileData?.profile

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const { data: prefsData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.get('/api/client/notification-preferences').then((r) => r.data.preferences),
  })

  const prefs = prefsData ?? { sms: true, email: true, in_app: true }

  const { data: addressBookData } = useQuery({
    queryKey: ['address-book-profile'],
    queryFn: () => api.get('/api/address-book', { params: { per_page: 8 } }).then((r) => r.data),
    retry: false,
  })

  const rawBook = addressBookData?.address_book
  const addressRows = Array.isArray(rawBook?.data) ? rawBook.data : Array.isArray(rawBook) ? rawBook : []

  const updatePrefsMutation = useMutation({
    mutationFn: (newPrefs: Record<string, boolean>) =>
      api.patch('/api/client/notification-preferences', newPrefs).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.success('Preferences de notification mises a jour.')
    },
    onError: () => toast.error('Erreur lors de la mise a jour des preferences.'),
  })

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres.')
      return
    }
    setChangingPw(true)
    try {
      await api.put('/api/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      toast.success('Mot de passe modifie avec succes.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Erreur lors du changement de mot de passe.'))
    } finally {
      setChangingPw(false)
    }
  }

  const avatarSrc = user?.avatar_url ? resolveImageUrl(user.avatar_url) : ''

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-muted overflow-hidden bg-primary/10 text-primary text-xl font-bold">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            (user?.name || 'U').charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user?.name || 'Mon profil'}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <ProfileInfoSection
        user={user}
        profile={profile}
        addressRows={addressRows}
        setUser={setUser}
        queryClient={queryClient}
      />

      <ProfilePasswordSection
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        changingPw={changingPw}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onPasswordSubmit={handleChangePassword}
      />

      <ProfilePreferencesSection
        prefs={prefs}
        user={user}
        updatePrefsMutation={updatePrefsMutation}
      />
    </div>
  )
}
