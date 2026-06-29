import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import ClientPortalLayout from '@/layouts/ClientPortalLayout'
import { isPortalOnlyClient } from '@/lib/internalAppRoles'

/**
 * Enveloppe portail client : navigation dédiée (sans barre staff).
 * Les comptes non-client et les staff (même avec rôle client) sont renvoyés vers le tableau de bord interne.
 */
export default function ClientPortalOnly() {
  const { user } = useAuthStore()
  if (!isPortalOnlyClient(user)) {
    return <Navigate to="/dashboard" replace />
  }
  return <ClientPortalLayout />
}
