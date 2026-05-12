import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { type LucideIcon } from 'lucide-react'

interface HeroAction {
  label: string
  href: string
  icon?: LucideIcon
  variant?: 'default' | 'outline'
}

interface DashboardHeroProps {
  title: string
  subtitle?: string
  gradient: readonly [string, string]
  actions?: HeroAction[]
  stats?: { label: string; value: string | number }[]
  illustration?: React.ReactNode
}

export function DashboardHero({
  title,
  subtitle,
  gradient,
  actions,
  stats,
  illustration,
}: DashboardHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-5 text-white sm:p-6 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/5" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-2xl md:text-3xl font-bold tracking-tight"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-white/80 text-sm md:text-base max-w-lg"
            >
              {subtitle}
            </motion.p>
          )}

          {actions && actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap"
            >
              {actions.map((action) => (
                <Link key={action.href} to={action.href} className="w-full sm:w-auto">
                  <Button
                    variant={action.variant === 'outline' ? 'outline' : 'default'}
                    className={
                      action.variant === 'outline'
                        ? 'min-h-11 w-full border-white/30 text-white hover:bg-white/10 bg-transparent sm:w-auto'
                        : 'min-h-11 w-full bg-white text-gray-900 hover:bg-white/90 shadow-lg sm:w-auto'
                    }
                  >
                    {action.icon && <action.icon size={16} className="mr-2" />}
                    {action.label}
                  </Button>
                </Link>
              ))}
            </motion.div>
          )}
        </div>

        {/* Stats or illustration */}
        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          className="grid grid-cols-2 gap-4 sm:flex sm:gap-6"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {illustration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="hidden lg:block"
          >
            {illustration}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
