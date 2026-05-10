import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Trash2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Dispatch, SetStateAction } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'

import type { RoleData } from '@/components/settings/roles/RoleCard'

export interface UserPermData {
  user_id: number
  user_name: string
  roles: string[]
  role_permissions: string[]
  direct_permissions: string[]
  all_permissions: string[]
}

interface RolePermissionsMatrixProps {
  currentRole: RoleData
  grouped: Record<string, string[]>
  permFilter: string
  setPermFilter: (v: string) => void
  rolePerms: Set<string>
  dirty: boolean
  onTogglePerm: (perm: string) => void
  onSave: () => void
  deleteRoleMut: UseMutationResult<unknown, unknown, number>
  updateRoleMut: UseMutationResult<unknown, unknown, { roleId: number; permissions: string[] }>
}

export function RolePermissionsMatrix({
  currentRole,
  grouped,
  permFilter,
  setPermFilter,
  rolePerms,
  dirty,
  onTogglePerm,
  onSave,
  deleteRoleMut,
  updateRoleMut,
}: RolePermissionsMatrixProps) {
  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{currentRole.name}</h3>
            <p className="text-sm text-muted-foreground">{rolePerms.size} permission{rolePerms.size !== 1 ? 's' : ''} sélectionnée{rolePerms.size !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            {!currentRole.is_system && (
              <Button variant="destructive" size="sm" onClick={() => deleteRoleMut.mutate(currentRole.id)} disabled={deleteRoleMut.isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            )}
            {dirty && (
              <Button size="sm" onClick={onSave} disabled={updateRoleMut.isPending}>
                <Save className="h-4 w-4 mr-1" /> Enregistrer
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filtrer les permissions…"
            value={permFilter}
            onChange={e => setPermFilter(e.target.value)}
          />
        </div>

        <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
          {Object.entries(grouped).map(([group, perms]) => {
            const filtered = perms.filter(p => !permFilter || p.includes(permFilter.toLowerCase()))
            if (filtered.length === 0) return null
            return (
              <div key={group}>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">{group}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {filtered.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/40 rounded px-2 py-1 transition-colors">
                      <Checkbox
                        checked={rolePerms.has(perm)}
                        onCheckedChange={() => onTogglePerm(perm)}
                      />
                      <span className="truncate">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
    </div>
  )
}

interface UserDirectPermissionsMatrixProps {
  grouped: Record<string, string[]>
  userPermData: UserPermData
  userDirectPerms: Set<string>
  setUserDirectPerms: Dispatch<SetStateAction<Set<string>>>
  setUserDirty: (v: boolean) => void
  userDirty: boolean
  updateUserPermsMut: UseMutationResult<unknown, unknown, { userId: number; perms: string[] }>
}

export function UserDirectPermissionsMatrix({
  grouped,
  userPermData,
  userDirectPerms,
  setUserDirectPerms,
  setUserDirty,
  userDirty,
  updateUserPermsMut,
}: UserDirectPermissionsMatrixProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{userPermData.user_name}</h3>
          <p className="text-sm text-muted-foreground">
            Rôle{userPermData.roles.length > 1 ? 's' : ''} : {userPermData.roles.join(', ') || 'Aucun'}
            {' · '}{userPermData.direct_permissions.length} permission{userPermData.direct_permissions.length !== 1 ? 's' : ''} directe{userPermData.direct_permissions.length !== 1 ? 's' : ''}
          </p>
        </div>
        {userDirty && (
          <Button size="sm" onClick={() => updateUserPermsMut.mutate({ userId: userPermData.user_id, perms: Array.from(userDirectPerms) })}>
            <Save className="h-4 w-4 mr-1" /> Enregistrer
          </Button>
        )}
      </div>

      <div className="grid gap-3 max-h-[280px] overflow-y-auto pr-2">
        {Object.entries(grouped).map(([group, perms]) => (
          <div key={group}>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 tracking-wider">{group}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {perms.map(perm => {
                const fromRole = userPermData.role_permissions.includes(perm)
                return (
                  <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/40 rounded px-2 py-0.5 transition-colors">
                    <Checkbox
                      checked={fromRole || userDirectPerms.has(perm)}
                      disabled={fromRole}
                      onCheckedChange={() => {
                        if (fromRole) return
                        const next = new Set(userDirectPerms)
                        if (next.has(perm)) next.delete(perm)
                        else next.add(perm)
                        setUserDirectPerms(next)
                        setUserDirty(true)
                      }}
                    />
                    <span className={cn('truncate', fromRole && 'text-muted-foreground')}>{perm}</span>
                    {fromRole && <Badge variant="outline" className="text-[10px] py-0 px-1 h-4">rôle</Badge>}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
