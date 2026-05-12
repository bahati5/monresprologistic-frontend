import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/lib/animations'

interface HandoverDossier {
  reference: string
  subject: string
  status: string
  last_active: string
  href: string
}

interface HandoverItem {
  user_name: string
  open_count: number
  dossiers: HandoverDossier[]
}

interface Props {
  items: HandoverItem[]
}

export function DashboardHandoverCard({ items }: Props) {
  if (!items || items.length === 0) return null

  return (
    <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Passation de service
          </CardTitle>
          <p className="text-xs text-muted-foreground">Dossiers ouverts par l'équipe (non clôturés)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.user_name} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {item.user_name.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-medium">{item.user_name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.open_count} dossier(s) ouvert(s)</span>
                </div>
              </div>
              <div className="pl-10 space-y-1.5">
                {item.dossiers.map((d) => (
                  <div key={d.reference} className="flex items-center justify-between text-sm rounded-lg border bg-card p-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-medium">{d.reference}</span>
                      <span className="text-xs text-muted-foreground ml-2">{d.subject}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">{d.status}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" asChild className="shrink-0 text-xs">
                      <Link to={d.href}>
                        Reprendre <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
