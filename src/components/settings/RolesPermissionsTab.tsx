import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

import { RoleCard, type RoleData } from '@/components/settings/roles/RoleCard'
import { CreateRoleDialog } from '@/components/settings/roles/CreateRoleDialog'
import {
  RolePermissionsMatrix,
  type UserPermData,
} from '@/components/settings/roles/PermissionMatrix'
import { groupRolePermissions, type RolesPermissionDatum } from '@/components/settings/roles/permissionGrouping'
import { UserDirectPermissionsSection } from '@/components/settings/roles/UserDirectPermissionsSection'

export default function RolesPermissionsTab() {
  const qc = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [permFilter, setPermFilter] = useState('')
  const [rolePerms, setRolePerms] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newPermName, setNewPermName] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'roles-permissions'],
    queryFn: async () => {
      const res = await api.get('/api/settings/roles-permissions')
      return res.data as { roles: RoleData[]; permissions: RolesPermissionDatum[] }
    },
  })

  const roles = data?.roles ?? []
  const allPermissions = data?.permissions?.map((p) => p.name) ?? []

  const updateRoleMut = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: number; permissions: string[] }) => {
      const role = roles.find((r) => r.id === roleId)
      await api.put(`/api/settings/roles/${roleId}`, { permissions })
      toast.success(`Permissions de « ${role?.name} » mises à jour`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'roles-permissions'] })
      setDirty(false)
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const createRoleMut = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/api/settings/roles', { name, permissions: [] })
      toast.success(`Rôle « ${name} » créé`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'roles-permissions'] })
      setNewRoleName('')
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || 'Erreur'),
  })

  const deleteRoleMut = useMutation({
    mutationFn: async (roleId: number) => {
      await api.delete(`/api/settings/roles/${roleId}`)
      toast.success('Rôle supprimé')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'roles-permissions'] })
      setSelectedRole(null)
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || 'Erreur'),
  })

  const createPermMut = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/api/settings/permissions', { name })
      toast.success(`Permission « ${name} » créée`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', 'roles-permissions'] })
      setNewPermName('')
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e?.response?.data?.message || 'Erreur'),
  })

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/api/users')
      return res.data?.users?.data ?? []
    },
  })

  const { data: userPermData, refetch: refetchUserPerms, dataUpdatedAt: userPermDataUpdatedAt } =
    useQuery<UserPermData>({
    queryKey: ['user-permissions', selectedUserId],
    enabled: !!selectedUserId,
    queryFn: async () => {
      const res = await api.get(`/api/settings/users/${selectedUserId}/permissions`)
      return res.data
    },
  })

  const updateUserPermsMut = useMutation({
    mutationFn: async ({ userId, perms }: { userId: number; perms: string[] }) => {
      await api.put(`/api/settings/users/${userId}/permissions`, { direct_permissions: perms })
      toast.success('Permissions utilisateur mises à jour')
    },
    onSuccess: () => {
      refetchUserPerms()
    },
    onError: () => toast.error('Erreur'),
  })

  const selectRole = (name: string) => {
    const role = roles.find((r) => r.name === name)
    setSelectedRole(name)
    setRolePerms(new Set(role?.permissions ?? []))
    setDirty(false)
  }

  const togglePerm = (perm: string) => {
    const next = new Set(rolePerms)
    if (next.has(perm)) next.delete(perm)
    else next.add(perm)
    setRolePerms(next)
    setDirty(true)
  }

  const saveRolePerms = () => {
    const role = roles.find((r) => r.name === selectedRole)
    if (!role) return
    updateRoleMut.mutate({ roleId: role.id, permissions: Array.from(rolePerms) })
  }

  const currentRole = roles.find((r) => r.name === selectedRole)
  const grouped = groupRolePermissions(allPermissions)

  const filteredUsers = (usersData ?? []).filter(
    (u: { name?: string; email?: string }) =>
      !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement…</div>
    )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Rôles et permissions
          </CardTitle>
          <CardDescription>
            Gérez les permissions de chaque rôle. Les modifications s'appliquent immédiatement à tous les utilisateurs du rôle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 min-h-[500px]">
            <div className="w-64 flex-shrink-0 space-y-3">
              {roles.map((role) => (
                <RoleCard
                  key={role.name}
                  role={role}
                  selected={selectedRole === role.name}
                  onSelect={selectRole}
                />
              ))}

              <CreateRoleDialog
                newRoleName={newRoleName}
                onNewRoleNameChange={setNewRoleName}
                createRoleMut={createRoleMut}
              />
            </div>

            <div className="flex-1 border-l pl-6">
              <AnimatePresence mode="wait">
                {currentRole ? (
                  <motion.div
                    key={currentRole.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <RolePermissionsMatrix
                      currentRole={currentRole}
                      grouped={grouped}
                      permFilter={permFilter}
                      setPermFilter={setPermFilter}
                      rolePerms={rolePerms}
                      dirty={dirty}
                      onTogglePerm={togglePerm}
                      onSave={saveRolePerms}
                      deleteRoleMut={deleteRoleMut}
                      updateRoleMut={updateRoleMut}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-full text-muted-foreground text-sm"
                  >
                    Sélectionnez un rôle pour voir et modifier ses permissions.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Ajouter une permission
          </CardTitle>
          <CardDescription>
            Créez une nouvelle permission qui pourra ensuite être assignée à un rôle ou directement à un utilisateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 max-w-md">
            <Input value={newPermName} onChange={(e) => setNewPermName(e.target.value)} placeholder="ex: manage_warehouse" />
            <Button
              onClick={() => createPermMut.mutate(newPermName)}
              disabled={!newPermName || createPermMut.isPending}
            >
              Créer
            </Button>
          </div>
        </CardContent>
      </Card>

      <UserDirectPermissionsSection
        grouped={grouped}
        userSearch={userSearch}
        onUserSearchChange={setUserSearch}
        filteredUsers={filteredUsers}
        selectedUserId={selectedUserId}
        onSelectUserId={setSelectedUserId}
        matrixSyncKey={userPermDataUpdatedAt}
        userPermData={userPermData}
        updateUserPermsMut={updateUserPermsMut}
      />
    </div>
  )
}
