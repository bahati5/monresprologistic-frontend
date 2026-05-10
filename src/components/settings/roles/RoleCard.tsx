import { motion } from 'framer-motion'
import { Shield, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface RoleData {
  id: number
  name: string
  permissions: string[]
  users_count: number
  is_system: boolean
}

interface RoleCardProps {
  role: RoleData
  selected: boolean
  onSelect: (name: string) => void
}

export function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(role.name)}
      whileHover={{ x: 2 }}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-transparent hover:bg-muted/50'
      )}
    >
      <Shield className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{role.name}</div>
        <div className="text-xs text-muted-foreground">{role.permissions.length} perms · {role.users_count} utilisateur{role.users_count !== 1 ? 's' : ''}</div>
      </div>
      {selected && <ChevronRight className="h-4 w-4 text-primary" />}
    </motion.button>
  )
}
