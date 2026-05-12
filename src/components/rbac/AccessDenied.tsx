import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

interface AccessDeniedProps {
  requiredPermission?: string
  message?: string
}

export default function AccessDenied({ requiredPermission, message }: AccessDeniedProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-destructive/10 p-6 mb-6">
        <ShieldAlert className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Accès refusé</h1>
      <p className="mt-3 text-lg text-muted-foreground max-w-md">
        {message ?? 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'}
      </p>
      {requiredPermission && (
        <p className="mt-2 text-sm text-muted-foreground">
          Permission requise : <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{requiredPermission}</code>
        </p>
      )}
      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Retour au tableau de bord
      </Link>
    </div>
  )
}
