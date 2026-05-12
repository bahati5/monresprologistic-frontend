import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'

interface PermissionGateProps {
  permission: string
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission(permission)) return <>{fallback}</>
  return <>{children}</>
}

interface AnyPermissionGateProps {
  permissions: string[]
  fallback?: ReactNode
  children: ReactNode
}

export function AnyPermissionGate({ permissions, fallback = null, children }: AnyPermissionGateProps) {
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)
  if (!hasAnyPermission(permissions)) return <>{fallback}</>
  return <>{children}</>
}

interface AllPermissionsGateProps {
  permissions: string[]
  fallback?: ReactNode
  children: ReactNode
}

export function AllPermissionsGate({ permissions, fallback = null, children }: AllPermissionsGateProps) {
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions)
  if (!hasAllPermissions(permissions)) return <>{fallback}</>
  return <>{children}</>
}
