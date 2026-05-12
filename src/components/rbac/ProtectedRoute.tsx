import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AccessDenied from './AccessDenied'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: string
  requiredPermissions?: string[]
  allPermissions?: string[]
  requiredMenu?: string
  requiredPage?: string
  fallback?: ReactNode
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  allPermissions,
  requiredMenu,
  requiredPage,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, hasAllPermissions, hasMenuAccess, hasPageAccess } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback ? <>{fallback}</> : <AccessDenied requiredPermission={requiredPermission} />
  }

  if (requiredPermissions && !hasAnyPermission(requiredPermissions)) {
    return fallback ? <>{fallback}</> : <AccessDenied requiredPermission={requiredPermissions.join(' | ')} />
  }

  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return fallback ? <>{fallback}</> : <AccessDenied requiredPermission={allPermissions.join(' & ')} />
  }

  if (requiredMenu && !hasMenuAccess(requiredMenu)) {
    return fallback ? <>{fallback}</> : <AccessDenied />
  }

  if (requiredPage && !hasPageAccess(requiredPage)) {
    return fallback ? <>{fallback}</> : <AccessDenied />
  }

  return <>{children}</>
}
