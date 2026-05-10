import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export interface LogisticsRouteMismatchAlertProps {
  clientId: string;
  recipientId: string;
  routeOriginMismatchSender: boolean;
  routeDestMismatchRecipient: boolean;
  onUpdateClientCountry: (type: "sender" | "recipient") => void;
}

export function LogisticsRouteMismatchAlert({
  clientId,
  recipientId,
  routeOriginMismatchSender,
  routeDestMismatchRecipient,
  onUpdateClientCountry,
}: LogisticsRouteMismatchAlertProps) {
  if (!routeOriginMismatchSender && !routeDestMismatchRecipient) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Pays : adresse et route logistique</AlertTitle>
      <AlertDescription className="space-y-3 text-sm">
        <p>
          Le pays de départ et le pays d&apos;arrivée doivent correspondre au pays
          d&apos;adresse enregistré sur la fiche de l&apos;expéditeur et du destinataire.
        </p>
        <ul className="list-inside list-disc space-y-2 text-xs">
          {routeOriginMismatchSender && clientId ? (
            <li className="flex flex-wrap items-center gap-2">
              <span>
                <Link className="underline underline-offset-2" to={`/clients/${clientId}`}>
                  Fiche expéditeur
                </Link>{" "}
                : pays d&apos;adresse ≠ pays de départ choisi.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] bg-background/50"
                onClick={() => onUpdateClientCountry("sender")}
              >
                Mettre à jour la fiche
              </Button>
            </li>
          ) : null}
          {routeDestMismatchRecipient && recipientId ? (
            <li className="flex flex-wrap items-center gap-2">
              <span>
                <Link className="underline underline-offset-2" to={`/clients/${recipientId}`}>
                  Fiche destinataire
                </Link>{" "}
                : pays d&apos;adresse ≠ pays d&apos;arrivée choisi.
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] bg-background/50"
                onClick={() => onUpdateClientCountry("recipient")}
              >
                Mettre à jour la fiche
              </Button>
            </li>
          ) : null}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
