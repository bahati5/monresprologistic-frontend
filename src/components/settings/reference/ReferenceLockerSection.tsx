import { buildLockerPayload } from '@/lib/appSettingsSectionPayloads'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsCard } from '../SettingsCard'
import { LockerSettings } from '../LockerSettings'

export interface ReferenceSectionSaveProps {
  save: (label: string, payload: Record<string, unknown>) => void
  isPending: boolean
}

interface ReferenceLockerSectionProps extends ReferenceSectionSaveProps {
  locker: Record<string, unknown>
  setL: (k: string, v: unknown) => void
}

export function ReferenceLockerSection({ locker, setL, save, isPending }: ReferenceLockerSectionProps) {
  return (
    <SettingsCard
      title="Casier virtuel"
      icon={MapPin}
      description="Adresse du hub et format du numéro de casier client"
      actions={
        <Button size="sm" disabled={isPending} onClick={() => save('Casier', buildLockerPayload(locker))}>
          Enregistrer
        </Button>
      }
    >
      <LockerSettings form={locker} set={setL} />
    </SettingsCard>
  )
}
