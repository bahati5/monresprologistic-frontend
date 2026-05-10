import { useState } from 'react'
import { Search, User, Users } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  UserDirectPermissionsMatrix,
  type UserPermData,
} from '@/components/settings/roles/PermissionMatrix'

type UserListEntry = {
  id: number
  name?: string
  email?: string
  roles?: { name: string }[]
}

type UpdateUserPermsMut = UseMutationResult<
  unknown,
  unknown,
  { userId: number; perms: string[] },
  unknown
>

type UserDirectPermissionsSectionProps = {
  grouped: Record<string, string[]>
  userSearch: string
  onUserSearchChange: (v: string) => void
  filteredUsers: UserListEntry[]
  selectedUserId: number | null
  onSelectUserId: (id: number) => void
  matrixSyncKey: number
  userPermData: UserPermData | undefined
  updateUserPermsMut: UpdateUserPermsMut
}

function UserDirectPermissionsMatrixShell({
  grouped,
  userPermData,
  updateUserPermsMut,
}: {
  grouped: Record<string, string[]>
  userPermData: UserPermData
  updateUserPermsMut: UpdateUserPermsMut
}) {
  const [userDirectPerms, setUserDirectPerms] = useState(
    () => new Set<string>(userPermData.direct_permissions),
  )
  const [userDirty, setUserDirty] = useState(false)
  return (
    <UserDirectPermissionsMatrix
      grouped={grouped}
      userPermData={userPermData}
      userDirectPerms={userDirectPerms}
      setUserDirectPerms={setUserDirectPerms}
      setUserDirty={setUserDirty}
      userDirty={userDirty}
      updateUserPermsMut={updateUserPermsMut}
    />
  )
}

export function UserDirectPermissionsSection({
  grouped,
  userSearch,
  onUserSearchChange,
  filteredUsers,
  selectedUserId,
  onSelectUserId,
  matrixSyncKey,
  userPermData,
  updateUserPermsMut,
}: UserDirectPermissionsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Permissions directes par utilisateur
        </CardTitle>
        <CardDescription>
          Un utilisateur hérite des permissions de son rôle. Vous pouvez lui ajouter ou retirer des permissions
          individuelles ici (permissions directes).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 min-h-[350px]">
          <div className="w-72 flex-shrink-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Chercher un utilisateur…"
                value={userSearch}
                onChange={(e) => onUserSearchChange(e.target.value)}
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
              {filteredUsers.slice(0, 30).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onSelectUserId(u.id)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                    selectedUserId === u.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
                  )}
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  {u.roles?.[0] ? (
                    <Badge variant="secondary" className="text-xs">
                      {u.roles[0].name}
                    </Badge>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 border-l pl-6">
            {userPermData ? (
              <UserDirectPermissionsMatrixShell
                key={`${selectedUserId}-${matrixSyncKey}`}
                grouped={grouped}
                userPermData={userPermData}
                updateUserPermsMut={updateUserPermsMut}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sélectionnez un utilisateur pour gérer ses permissions directes.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
