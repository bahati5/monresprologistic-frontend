import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SettingsCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  badge?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  isLoading?: boolean
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  children,
  className,
  isLoading,
}: SettingsCardProps) {
  return (
    <Card className={cn('border border-border/50 shadow-sm bg-card', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 bg-primary/5 rounded-xl">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
              </div>
              {description && <CardDescription className="mt-0.5 text-sm">{description}</CardDescription>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : children}
      </CardContent>
    </Card>
  )
}
