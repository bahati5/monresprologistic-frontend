import { motion } from 'framer-motion'
import {
  AreaChart, Area, Bar, PieChart, Pie, Cell as PieCell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeInUp } from '@/lib/animations'
import { displayLocalized } from '@/lib/localizedString'
import { useFormatMoney } from '@/hooks/useSettings'

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']

function MonthlyEvolutionTooltip(props: {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; name?: string; value?: unknown }>
  label?: string
}) {
  const { formatMoney } = useFormatMoney()
  const { active, payload, label } = props
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
      <p className="font-medium mb-1">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((entry: { dataKey?: string | number; name?: string; value?: unknown }) => (
          <li key={String(entry.dataKey)} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium tabular-nums">
              {entry.dataKey === 'revenue' && typeof entry.value === 'number'
                ? formatMoney(entry.value)
                : String(entry.value ?? '')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface MonthlyEvolutionEntry {
  month?: string
  shipments?: number
  revenue?: number
}

interface DashboardChartsSectionProps {
  monthlyEvolution: MonthlyEvolutionEntry[]
  statusDistribution: Array<{ name: unknown; value: number; color?: string }>
}

export function DashboardChartsSection({ monthlyEvolution, statusDistribution }: DashboardChartsSectionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <motion.div variants={fadeInUp} className="lg:col-span-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp size={16} /> Evolution mensuelle
            </CardTitle>
            <p className="text-xs text-muted-foreground">Expeditions et encaissements (6 derniers mois)</p>
          </CardHeader>
          <CardContent className="pt-2">
            {monthlyEvolution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyEvolution}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <Tooltip content={<MonthlyEvolutionTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="shipments" name="Expeditions" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenus" stroke="#14B8A6" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">Aucune expedition sur les 6 derniers mois.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Repartition par statut</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {statusDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry: { color?: string }, i: number) => (
                        <PieCell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {statusDistribution.map((s: { name: unknown; color?: string }, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {displayLocalized(s.name)}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">Aucune expedition avec statut.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
