import type { ElementType } from 'react'

export interface InfoRowProps {
  icon: ElementType
  label: string
  value?: string | number | null
}

export function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}
