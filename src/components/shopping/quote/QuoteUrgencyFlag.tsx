import { Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface QuoteUrgencyFlagProps {
  isUrgent: boolean
  onUrgentChange: (value: boolean) => void
  urgencySurchargePercent: string
  onUrgencySurchargeChange: (value: string) => void
  readOnly?: boolean
}

export function QuoteUrgencyFlag({
  isUrgent,
  onUrgentChange,
  urgencySurchargePercent,
  onUrgencySurchargeChange,
  readOnly,
}: QuoteUrgencyFlagProps) {
  return (
    <div className={`rounded-xl border p-3 transition-colors ${
      isUrgent
        ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800'
        : 'border-border bg-background'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className={isUrgent ? 'text-orange-600' : 'text-muted-foreground'} />
          <Label htmlFor="urgent-toggle" className="text-xs font-medium cursor-pointer">
            Commande urgente
          </Label>
          {isUrgent && (
            <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100">
              URGENT
            </Badge>
          )}
        </div>
        <Switch
          id="urgent-toggle"
          checked={isUrgent}
          onCheckedChange={onUrgentChange}
          disabled={readOnly}
        />
      </div>

      {isUrgent && (
        <div className="mt-3 flex items-center gap-2">
          <Label htmlFor="urgency-surcharge" className="text-[11px] text-orange-700 whitespace-nowrap">
            Majoration urgence (%)
          </Label>
          <Input
            id="urgency-surcharge"
            type="number"
            min={0}
            max={100}
            step={1}
            disabled={readOnly}
            value={urgencySurchargePercent}
            onChange={(e) => onUrgencySurchargeChange(e.target.value)}
            className="h-7 w-20 text-right text-xs"
            placeholder="15"
          />
          <span className="text-[11px] text-muted-foreground">
            appliqué sur le total
          </span>
        </div>
      )}
    </div>
  )
}
