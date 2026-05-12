import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ClipboardList, Package, ArrowRight, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/lib/animations'

interface PendingDossier {
  type: string
  section: string
  label: string
  detail: string
  href: string
  action_label: string
}

interface Props {
  dossiers: PendingDossier[]
}

const SECTION_ICONS: Record<string, typeof ClipboardList> = {
  'Devis à envoyer': ClipboardList,
  'Colis à réceptionner au hub': Package,
  'Conversions en expédition': RefreshCw,
}

export function DashboardPendingDossiersCard({ dossiers }: Props) {
  if (!dossiers || dossiers.length === 0) return null

  const grouped = dossiers.reduce<Record<string, PendingDossier[]>>((acc, d) => {
    ;(acc[d.section] ??= []).push(d)
    return acc
  }, {})

  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-lg">&#9203;</span>
              Dossiers en attente d'action
            </CardTitle>
            <Link to="/purchase-orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {Object.entries(grouped).map(([section, items]) => {
            const Icon = SECTION_ICONS[section] ?? ClipboardList
            return (
              <div key={section}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {section} ({items.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium font-mono">{d.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{d.detail}</span>
                      </div>
                      <Button size="sm" variant="outline" asChild className="shrink-0 ml-3">
                        <Link to={d.href}>
                          {d.action_label} <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
