import { Pencil, Trash2 } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MerchantLogoBadge } from '@/components/shopping/MerchantLogoBadge'
import type { SettingsMerchantRow } from '@/components/settings/merchant/merchantTypes'

type DeleteMutation = UseMutationResult<unknown, unknown, number, unknown>

interface MerchantsSettingsTableProps {
  merchants: SettingsMerchantRow[]
  onEdit: (m: SettingsMerchantRow) => void
  deleteMutation: DeleteMutation
}

export function MerchantsSettingsTable({
  merchants,
  onEdit,
  deleteMutation,
}: MerchantsSettingsTableProps) {
  return (
    <div className="rounded-xl border border-border/80 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[72px]">Logo</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead className="min-w-[200px]">Domaines associés</TableHead>
            <TableHead className="w-[100px]">Commission</TableHead>
            <TableHead className="w-[100px]">Délai est.</TableHead>
            <TableHead className="w-[80px]">Actif</TableHead>
            <TableHead className="w-[88px] text-right">Ordre</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {merchants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm">
                Aucun marchand. Ajoutez-en un pour activer les listes et l’auto-détection.
              </TableCell>
            </TableRow>
          ) : (
            merchants.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <MerchantLogoBadge logoUrl={m.logo_url} merchantName={m.name} />
                </TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {Array.isArray(m.domains) && m.domains.length > 0 ? m.domains.join(', ') : '—'}
                  </p>
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {m.commission_rate != null && Number(m.commission_rate) > 0 ? `${m.commission_rate} %` : '—'}
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {m.estimated_delivery_days ? `${m.estimated_delivery_days} j` : '—'}
                </TableCell>
                <TableCell>
                  {m.is_active ? (
                    <Badge variant="secondary" className="text-xs">
                      Oui
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Non
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {m.sort_order ?? 0}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(m)}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Modifier {m.name}</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          <span className="sr-only">Supprimer {m.name}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer ce marchand ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Les lignes d’achat assisté existantes conserveront un lien optionnel sans marchand
                            associé si vous supprimez cette entrée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(m.id)}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
