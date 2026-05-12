import { useState } from 'react'
import { motion } from 'framer-motion'
import { useShipmentAnalytics } from '@/hooks/useSav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

export default function ShipmentAnalyticsPage() {
  const [period, setPeriod] = useState('month')
  const { data, isLoading } = useShipmentAnalytics({ period })

  const kpis = data?.kpis
  const byStatus = data?.by_status ?? []
  const byDest = data?.by_destination ?? []
  const weekly = data?.weekly_evolution ?? []

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytique Expéditions</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {kpis && (
        <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Créées', value: kpis.total },
            { label: 'Livrées', value: `${kpis.delivered} (${kpis.delivery_rate}%)` },
            { label: 'En transit', value: kpis.in_transit },
            { label: 'Taux livraison', value: `${kpis.delivery_rate}%` },
            { label: 'Transit moyen', value: `${kpis.avg_transit_days}j` },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Évolution hebdomadaire</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" name="Créées" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="delivered" name="Livrées" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Top destinations</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byDest} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {byStatus.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Répartition par statut</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={byStatus} dataKey="count" nameKey="status" outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                    {byStatus.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
