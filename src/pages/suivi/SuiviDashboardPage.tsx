import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  Package,
  ShoppingBag,
  HeadphonesIcon,
  Truck,
  Layers,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Lightbulb,
  ChevronDown,
  ExternalLink,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSuiviBoard } from '@/hooks/useSuivi'
import type { SuiviBoardItemType, SuiviBoardItem, SuiviBoardFilters } from '@/types/suivi'

type ViewTab = 'all' | 'mine' | 'urgences'

const VIEW_TABS: { value: ViewTab; label: string }[] = [
  { value: 'mine', label: 'Mes items' },
  { value: 'urgences', label: 'Urgences' },
  { value: 'all', label: 'Tout' },
]

const TYPE_FILTERS: { value: SuiviBoardItemType | ''; label: string; icon: React.ElementType }[] = [
  { value: '', label: 'Tous les types', icon: Eye },
  { value: 'devis', label: 'Devis', icon: ShoppingBag },
  { value: 'expedition', label: 'Expéditions', icon: Package },
  { value: 'sav', label: 'SAV', icon: HeadphonesIcon },
  { value: 'ramassage', label: 'Ramassages', icon: Truck },
  { value: 'regroupement', label: 'Regroupements', icon: Layers },
  { value: 'paiement', label: 'Paiements', icon: DollarSign },
]

const PRIORITY_CONFIG: Record<string, { dot: string; bg: string; border: string }> = {
  critical: { dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' },
  high:     { dot: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800' },
  medium:   { dot: 'bg-yellow-500', bg: 'bg-background', border: 'border-border' },
  low:      { dot: 'bg-emerald-500', bg: 'bg-background', border: 'border-border' },
}

const TYPE_ICON: Record<string, React.ElementType> = {
  devis: ShoppingBag,
  expedition: Package,
  sav: HeadphonesIcon,
  ramassage: Truck,
  regroupement: Layers,
  paiement: DollarSign,
  livraison: Truck,
}

function CounterPill({
  icon: Icon,
  label,
  count,
  colorClass,
  bgClass,
  active,
  onClick,
}: {
  icon: React.ElementType
  label: string
  count: number
  colorClass: string
  bgClass: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl px-4 py-3 transition-all text-left ${bgClass} ${
        active ? 'ring-2 ring-primary shadow-sm' : 'hover:shadow-sm'
      }`}
    >
      <div className="p-1.5 bg-white/60 dark:bg-white/10 rounded-lg shrink-0">
        <Icon size={16} className={colorClass} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold leading-none ${colorClass}`}>{count}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
      </div>
    </button>
  )
}

function BoardItemCard({ item }: { item: SuiviBoardItem }) {
  const config = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.medium
  const ItemIcon = TYPE_ICON[item.type] ?? Package

  return (
    <Link
      to={item.href}
      className={`block rounded-xl border p-4 transition-all hover:shadow-md group ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${config.dot}`} />
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Ligne 1 : ref + type + statut */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                {item.reference}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal gap-1">
                <ItemIcon size={10} />
                {item.type_label}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {item.status_label}
              </Badge>
              {item.client_name && (
                <span className="text-xs text-muted-foreground truncate">
                  {item.client_name}
                </span>
              )}
            </div>

            {/* Ligne 2 : action */}
            {item.action && (
              <p className="text-sm">
                <span className="font-medium text-foreground">Action :</span>{' '}
                <span className="text-muted-foreground">{item.action}</span>
              </p>
            )}

            {/* Ligne 3 : attention */}
            {item.attention && (
              <p className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={12} className="shrink-0" />
                {item.attention}
              </p>
            )}

            {/* Ligne 4 : suggestion */}
            {item.suggestion && (
              <p className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Lightbulb size={12} className="shrink-0" />
                {item.suggestion}
              </p>
            )}

            {/* Métadonnées */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
              {item.assigned_to && <span>Assigné : {item.assigned_to}</span>}
              <span>{formatRelativeTime(item.last_activity)}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={14} className="text-muted-foreground" />
        </div>
      </div>
    </Link>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export default function SuiviDashboardPage() {
  const [view, setView] = useState<ViewTab>('mine')
  const [typeFilter, setTypeFilter] = useState<SuiviBoardItemType | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const filters: SuiviBoardFilters = useMemo(() => ({
    view,
    type: typeFilter || undefined,
    search: search || undefined,
  }), [view, typeFilter, search])

  const { data, isLoading, refetch, isFetching } = useSuiviBoard(filters)

  const items = data?.items ?? []
  const counters = data?.counters

  const handleSearch = () => setSearch(searchInput)
  const clearSearch = () => { setSearch(''); setSearchInput('') }
  const handleCounterClick = (type: SuiviBoardItemType | '') => {
    setTypeFilter(prev => prev === type ? '' : type)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-linear-to-r from-[#073763] to-[#1a4f8a] rounded-xl p-5 text-white shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Eye className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-light">Tableau de suivi</h1>
              <p className="text-white/70 text-sm font-light mt-0.5">
                Vue unifiée de tous les dossiers actifs — actions, alertes, suggestions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-lg p-0.5 gap-0.5">
              {VIEW_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setView(tab.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    view === tab.value
                      ? 'bg-white text-[#073763]'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'urgences' && counters?.urgences ? (
                    <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0 rounded-full">
                      {counters.urgences}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </div>

      {/* Compteurs */}
      {counters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <CounterPill
            icon={AlertTriangle} label="Urgences" count={counters.urgences}
            colorClass="text-red-600" bgClass="bg-red-50 dark:bg-red-950/30"
            active={false} onClick={() => setView('urgences')}
          />
          <CounterPill
            icon={ShoppingBag} label="Devis" count={counters.devis}
            colorClass="text-violet-600" bgClass="bg-violet-50 dark:bg-violet-950/30"
            active={typeFilter === 'devis'} onClick={() => handleCounterClick('devis')}
          />
          <CounterPill
            icon={Package} label="Expéditions" count={counters.expeditions}
            colorClass="text-blue-600" bgClass="bg-blue-50 dark:bg-blue-950/30"
            active={typeFilter === 'expedition'} onClick={() => handleCounterClick('expedition')}
          />
          <CounterPill
            icon={Truck} label="Ramassages" count={counters.ramassages}
            colorClass="text-teal-600" bgClass="bg-teal-50 dark:bg-teal-950/30"
            active={typeFilter === 'ramassage'} onClick={() => handleCounterClick('ramassage')}
          />
          <CounterPill
            icon={DollarSign} label="Paiements" count={counters.paiements}
            colorClass="text-emerald-600" bgClass="bg-emerald-50 dark:bg-emerald-950/30"
            active={typeFilter === 'paiement'} onClick={() => handleCounterClick('paiement')}
          />
          <CounterPill
            icon={HeadphonesIcon} label="SAV" count={counters.sav}
            colorClass="text-rose-600" bgClass="bg-rose-50 dark:bg-rose-950/30"
            active={typeFilter === 'sav'} onClick={() => handleCounterClick('sav')}
          />
          <CounterPill
            icon={Layers} label="Regroup." count={counters.regroupements}
            colorClass="text-indigo-600" bgClass="bg-indigo-50 dark:bg-indigo-950/30"
            active={typeFilter === 'regroupement'} onClick={() => handleCounterClick('regroupement')}
          />
        </div>
      )}

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par référence ou client..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9 pr-8 h-9 text-sm"
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as SuiviBoardItemType | '')}
            className="h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TYPE_FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {(typeFilter || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setTypeFilter(''); clearSearch() }}
            className="text-xs"
          >
            Réinitialiser
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste des items */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-24 border-0 bg-muted/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Eye size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Aucun dossier actif</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {typeFilter ? 'Essayez de changer le filtre de type.' : 'Tous les dossiers sont traités.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map(item => (
            <BoardItemCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      {/* Footer */}
      {data && (
        <p className="text-xs text-muted-foreground text-right">
          Mis à jour : {new Date(data.generated_at).toLocaleString('fr-FR')}
          {' · '}
          <button onClick={() => refetch()} className="text-primary hover:underline">Actualiser</button>
        </p>
      )}
    </div>
  )
}
