import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface KpiCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  href?: string
  trend?: number
  trendLabel?: string
  sparklineData?: number[]
  color?: string
  loading?: boolean
  animateValue?: boolean
  delay?: number
}

function useCountUp(end: number, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!enabled || typeof end !== 'number') {
      setCount(end)
      return
    }
    let start = 0
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [end, duration, enabled])

  return count
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
  trendLabel,
  sparklineData,
  color = '#3B82F6',
  loading = false,
  animateValue = true,
  delay = 0,
}: KpiCardProps) {
  const numericValue = typeof value === 'number' ? value : 0
  const displayCount = useCountUp(numericValue, 1200, animateValue && typeof value === 'number')

  const sparkData = sparklineData?.map((v, i) => ({ v, i }))

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        href && 'cursor-pointer'
      )}
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] -translate-y-8 translate-x-8"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          {loading ? (
            <div className="h-8 w-20 rounded bg-muted animate-shimmer" />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {typeof value === 'number' ? displayCount.toLocaleString('fr-FR') : value}
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: color + '15' }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>

      {/* Trend + sparkline row */}
      <div className="mt-3 flex items-center justify-between">
        {trend !== undefined ? (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend >= 0 ? 'text-emerald-600' : 'text-red-500'
          )}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{trend >= 0 ? '+' : ''}{trend}%</span>
            {trendLabel && <span className="text-muted-foreground font-normal ml-1">{trendLabel}</span>}
          </div>
        ) : (
          <div />
        )}

        {sparkData && sparkData.length > 1 && (
          <div className="w-16 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#spark-${title})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  )

  if (href) {
    return <Link to={href}>{content}</Link>
  }

  return content
}
