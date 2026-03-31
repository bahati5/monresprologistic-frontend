import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3, TrendingUp, Package, Truck, Users, DollarSign,
  Download, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

const REPORT_SECTIONS = [
  { id: 'shipments', label: 'Expeditions', icon: Package, color: '#3B82F6', description: 'Volume, statuts, delais de livraison' },
  { id: 'finance', label: 'Finance', icon: DollarSign, color: '#14B8A6', description: 'Revenus, creances, paiements' },
  { id: 'pickups', label: 'Ramassages', icon: Truck, color: '#10B981', description: 'Performance des collectes' },
  { id: 'clients', label: 'Clients', icon: Users, color: '#8B5CF6', description: 'Activite, retention, top clients' },
]

export default function ReportsHub() {
  const [period, setPeriod] = useState('month')
  const [activeSection, setActiveSection] = useState('shipments')

  const { data, isLoading } = useQuery({
    queryKey: ['reports', activeSection, period],
    queryFn: () => api.get('/api/reports', { params: { section: activeSection, period } }).then(r => r.data),
    retry: false,
  })

  const kpis = data?.kpis || []

  const exportSlug: Record<string, string | null> = {
    shipments: 'export/shipments',
    finance: 'export/finance',
    pickups: 'export/pickups',
    clients: null,
  }

  const handleExportCsv = () => {
    const slug = exportSlug[activeSection]
    if (!slug) {
      toast.info('Export non disponible pour cette section.')
      return
    }
    const base = api.defaults.baseURL || ''
    const q = new URLSearchParams()
    if (period === 'week') q.set('date_from', new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0, 10))
    if (period === 'month') q.set('date_from', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
    if (period === 'quarter') {
      const m = new Date().getMonth()
      const qStart = m - (m % 3)
      q.set('date_from', new Date(new Date().getFullYear(), qStart, 1).toISOString().slice(0, 10))
    }
    if (period === 'year') q.set('date_from', new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
    const url = `${base}/api/reports/${slug}${q.toString() ? `?${q}` : ''}`
    window.open(url, '_blank')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble de l'activite et des performances</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar size={14} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette annee</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={!exportSlug[activeSection]} onClick={handleExportCsv}>
            <Download size={14} className="mr-1.5" />CSV
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-3 flex-wrap">
        {REPORT_SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all ${
              activeSection === s.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-transparent bg-card hover:bg-muted/50'
            }`}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: s.color + '15' }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* KPI Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse h-28" />)}
        </div>
      ) : kpis.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi: any, i: number) => {
            const trend = kpi.trend
            const isPositive = trend != null && trend >= 0
            return (
              <Card key={i}>
                <CardContent className="pt-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    {trend != null && (
                      <div className="flex items-center gap-0.5">
                        {isPositive ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {Math.abs(trend)}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      {/* Detail Table */}
      {data?.table && data.table.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />Donnees detaillees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {data.table_headers?.map((h: string, i: number) => (
                      <th key={i} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.table.map((row: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      {Object.values(row).map((cell: any, j: number) => (
                        <td key={j} className="px-4 py-3">{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state when no data */}
      {!isLoading && !data?.table?.length && kpis.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Aucune donnee pour cette periode</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Les statistiques apparaitront ici une fois l'activite enregistree.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}
