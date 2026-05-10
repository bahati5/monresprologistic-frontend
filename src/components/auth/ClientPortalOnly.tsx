import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import ClientPortalLayout from '@/layouts/ClientPortalLayout'

/**
 * Enveloppe portail client : navigation dédiée (sans barre staff).
 * Les comptes non-client sont renvoyés vers le tableau de bord interne.
 */
export default function ClientPortalOnly() {
  const { user } = useAuthStore()
  if (!user?.roles?.includes('client')) {
    return <Navigate to="/dashboard" replace />
  }
  return <ClientPortalLayout />
}
