import type { ElementType } from 'react'

export interface InfoRowProps {
  icon: ElementType
  label: string
  value?: string | number | null
}

export function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <Icon size={12} className="shrink-0 text-primary/50" />
      <span className="text-muted-foreground whitespace-nowrap">{label}</span>
      <span className="font-medium text-foreground ml-auto text-right truncate max-w-[140px]" title={String(value)}>{value}</span>
    </div>
  )
}
