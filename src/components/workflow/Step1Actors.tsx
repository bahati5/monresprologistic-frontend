import { useState, useMemo, useCallback } from "react";
import { Package, Star, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DbComboboxAsync } from "@/components/ui/DbCombobox";
import {
  useSearchProfiles,
  type ProfileSearchResult,
} from "@/hooks/useShipments";
import { useClient } from "@/hooks/useCrm";
import { ProfileWizardCreateModal } from "@/components/workflow/ProfileWizardCreateModal";
import { cn } from "@/lib/utils";

interface Step1ActorsProps {
  senderId: string;
  onSenderChange: (id: string) => void;
  recipientId: string;
  onRecipientChange: (id: string) => void;
  errors?: Record<string, string[]>;
}

function profileOptionLabel(p: ProfileSearchResult) {
  const sub = [p.email, p.city, p.country].filter(Boolean).join(" · ");
  return (
    <div className="flex w-full flex-col gap-0.5">
      <span className="font-medium">{p.full_name}</span>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {sub ? <span>{sub}</span> : null}
        {p.locker_number && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Casier {p.locker_number}
          </Badge>
        )}
        {p.is_related && (
          <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
            <Star className="h-3 w-3" />
            Carnet d&apos;adresses
          </Badge>
        )}
      </div>
    </div>
  );
}

function displayNameFromClient(
  d: { full_name?: string; name?: string } | undefined,
) {
  if (!d) return "";
  const n = (d.full_name ?? d.name ?? "").trim();
  return n;
}

function RecipientComboboxSection({
  senderId,
  recipientId,
  onRecipientChange,
  onOpenCreateModal,
  errors,
}: {
  senderId: string;
  recipientId: string;
  onRecipientChange: (id: string) => void;
  onOpenCreateModal: (searchHint?: string) => void;
  errors?: Record<string, string[]>;
}) {
  const [recipientQuery, setRecipientQuery] = useState("");
  const senderIdNum = senderId ? Number(senderId) : undefined;
  const { data: recipientResults, isFetching: recipientLoading } =
    useSearchProfiles(recipientQuery, senderIdNum, senderIdNum);
  const { data: recipientClientDetail } = useClient(recipientId || undefined);

  const recipientOptions = useMemo(() => {
    const base = (recipientResults ?? []).map((p) => ({
      value: String(p.id),
      label: profileOptionLabel(p),
      keywords: [
        p.full_name,
        p.email ?? "",
        p.phone ?? "",
        p.locker_number ?? "",
      ].filter(Boolean),
    }));
    const pinned = displayNameFromClient(recipientClientDetail);
    if (
      recipientId &&
      pinned &&
      !base.some((o) => String(o.value) === String(recipientId))
    ) {
      return [
        {
          value: recipientId,
          label: <span className="font-medium">{pinned}</span>,
          keywords: [pinned],
        },
        ...base,
      ];
    }
    return base;
  }, [recipientResults, recipientId, recipientClientDetail]);

  return (
    <div
      className={cn(
        "space-y-4 rounded-xl border p-4 shadow-sm transition-all",
        senderId ? "bg-muted/20 border-border" : "bg-muted/5 border-dashed opacity-50",
      )}
    >
      <div className="flex items-center gap-2 border-b pb-2">
        <User className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm uppercase tracking-wider">Destinataire</h3>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Rechercher une personne (min. 2 caractères)</Label>
        <DbComboboxAsync
          value={recipientId}
          onValueChange={onRecipientChange}
          filterQuery={recipientQuery}
          onFilterQueryChange={setRecipientQuery}
          options={recipientOptions}
          isLoading={recipientLoading}
          disabled={!senderId}
          searchMinLength={2}
          belowMinText="Saisissez au moins 2 caractères pour lancer la recherche."
          emptyText="Aucun profil trouvé."
          placeholder={
            !senderId
              ? "Choisissez d'abord l'expéditeur"
              : recipientQuery.length < 2
                ? "Recherchez puis choisissez…"
                : "Choisir un destinataire…"
          }
          onOpenCreateModal={onOpenCreateModal}
          createButtonTitle="Nouveau destinataire"
        />
        {errors?.recipient_profile_id && (
          <p className="text-sm text-destructive">
            {errors.recipient_profile_id[0]}
          </p>
        )}
        {errors?.recipient_id && (
          <p className="text-sm text-destructive">
            {errors.recipient_id[0]}
          </p>
        )}
      </div>
    </div>
  );
}

export function Step1Actors({
  senderId,
  onSenderChange,
  recipientId,
  onRecipientChange,
  errors,
}: Step1ActorsProps) {
  const [senderQuery, setSenderQuery] = useState("");
  const [profileModal, setProfileModal] = useState<{
    mode: "sender" | "recipient";
    hint?: string;
  } | null>(null);

  const { data: senderResults, isFetching: senderLoading } =
    useSearchProfiles(senderQuery);

  const { data: senderClientDetail } = useClient(senderId || undefined);

  const handleSenderChange = useCallback(
    (id: string) => {
      if (id !== senderId) onRecipientChange("");
      onSenderChange(id);
    },
    [senderId, onSenderChange, onRecipientChange],
  );

  const senderOptions = useMemo(() => {
    const base = (senderResults ?? []).map((p) => ({
      value: String(p.id),
      label: profileOptionLabel(p),
      keywords: [
        p.full_name,
        p.email ?? "",
        p.phone ?? "",
        p.locker_number ?? "",
      ].filter(Boolean),
    }));
    const pinned = displayNameFromClient(senderClientDetail);
    if (
      senderId &&
      pinned &&
      !base.some((o) => String(o.value) === String(senderId))
    ) {
      return [
        {
          value: senderId,
          label: <span className="font-medium">{pinned}</span>,
          keywords: [pinned],
        },
        ...base,
      ];
    }
    return base;
  }, [senderResults, senderId, senderClientDetail]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-muted/20 p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b pb-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Expéditeur</h3>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Rechercher une personne (min. 2 caractères)</Label>
            <DbComboboxAsync
              value={senderId}
              onValueChange={handleSenderChange}
              filterQuery={senderQuery}
              onFilterQueryChange={setSenderQuery}
              options={senderOptions}
              isLoading={senderLoading}
              searchMinLength={2}
              belowMinText="Saisissez au moins 2 caractères pour lancer la recherche."
              emptyText="Aucun profil trouvé."
              placeholder={
                senderQuery.length < 2
                  ? "Recherchez puis choisissez…"
                  : "Choisir un expéditeur…"
              }
              onOpenCreateModal={(hint) =>
                setProfileModal({ mode: "sender", hint })
              }
              createButtonTitle="Nouvel expéditeur"
            />
            {errors?.sender_profile_id && (
              <p className="text-sm text-destructive">
                {errors.sender_profile_id[0]}
              </p>
            )}
            {errors?.sender_client_id && (
              <p className="text-sm text-destructive">
                {errors.sender_client_id[0]}
              </p>
            )}
          </div>
        </div>

        <RecipientComboboxSection
          key={`${senderId}:${recipientId || "none"}`}
          senderId={senderId}
          recipientId={recipientId}
          onRecipientChange={onRecipientChange}
          onOpenCreateModal={(hint) =>
            setProfileModal({ mode: "recipient", hint })
          }
          errors={errors}
        />
      </div>

      {profileModal && (
        <ProfileWizardCreateModal
          open
          onOpenChange={(o) => !o && setProfileModal(null)}
          mode={profileModal.mode}
          senderProfileId={
            profileModal.mode === "recipient" ? Number(senderId) : undefined
          }
          searchHint={profileModal.hint}
          onCreated={(id) => {
            if (profileModal.mode === "sender") {
              onSenderChange(String(id));
              setSenderQuery("");
            } else {
              onRecipientChange(String(id));
            }
            setProfileModal(null);
          }}
        />
      )}
    </div>
  );
}
