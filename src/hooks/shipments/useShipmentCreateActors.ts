import { useCallback, useMemo, useState } from "react";
import { useClient } from "@/hooks/useCrm";
import { profileCountryIdFromApi } from "@/lib/profileCountry";
import type { WizardEditProfile } from "@/components/workflow/ProfileWizardEditModal";
import type { WizardCountryRow } from "@/types/shipmentCreate";

export function useShipmentCreateActors(
  clientId: string,
  setClientId: (v: string) => void,
  recipientId: string,
  setRecipientId: (v: string) => void,
  setUserOverrodeOrigin: (v: boolean) => void,
  setUserOverrodeDest: (v: boolean) => void,
) {
  const [editProfileModal, setEditProfileModal] = useState<{
    open: boolean;
    profile: WizardEditProfile | null;
  }>({ open: false, profile: null });

  const handleUserSenderChange = useCallback(
    (newSenderId: string) => {
      if (newSenderId !== clientId) {
        setRecipientId("");
        setUserOverrodeOrigin(false);
        setUserOverrodeDest(false);
      }
      setClientId(newSenderId);
    },
    [
      clientId,
      setClientId,
      setRecipientId,
      setUserOverrodeOrigin,
      setUserOverrodeDest,
    ],
  );

  const { data: senderClientDetail } = useClient(clientId || undefined);
  const { data: recipientClientDetail } = useClient(recipientId || undefined);

  const handleUpdateClientCountry = useCallback(
    (type: "sender" | "recipient") => {
      const profile =
        type === "sender" ? senderClientDetail : recipientClientDetail;
      if (!profile) return;
      setEditProfileModal({ open: true, profile: profile as WizardEditProfile });
    },
    [senderClientDetail, recipientClientDetail],
  );

  const senderProfileCountryId =
    profileCountryIdFromApi(senderClientDetail);
  const recipientProfileCountryId =
    profileCountryIdFromApi(recipientClientDetail);

  const senderMissingCountry = Boolean(
    clientId && senderClientDetail && senderProfileCountryId == null,
  );
  const recipientMissingCountry = Boolean(
    recipientId && recipientClientDetail && recipientProfileCountryId == null,
  );

  const profileCountriesForPin = useMemo((): WizardCountryRow[] => {
    const rows: WizardCountryRow[] = [];
    const push = (raw: unknown) => {
      if (!raw || typeof raw !== "object") return;
      const c = raw as {
        id?: number;
        name?: unknown;
        code?: string | null;
        iso2?: string | null;
        emoji?: string | null;
      };
      if (c.id == null) return;
      rows.push({
        id: c.id,
        name: c.name ?? "",
        code: c.code ?? null,
        iso2: c.iso2 ?? null,
        emoji: c.emoji ?? null,
      });
    };
    push((senderClientDetail as { country?: unknown } | undefined)?.country);
    push((recipientClientDetail as { country?: unknown } | undefined)?.country);
    return rows;
  }, [senderClientDetail, recipientClientDetail]);

  return {
    handleUserSenderChange,
    senderClientDetail,
    recipientClientDetail,
    handleUpdateClientCountry,
    editProfileModal,
    setEditProfileModal,
    senderProfileCountryId,
    recipientProfileCountryId,
    senderMissingCountry,
    recipientMissingCountry,
    profileCountriesForPin,
  };
}
