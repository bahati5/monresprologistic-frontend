import { Users, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Step1Actors } from "@/components/workflow/Step1Actors";

export interface Step1PartiesCardProps {
  clientId: string;
  onSenderChange: (id: string) => void;
  recipientId: string;
  onRecipientChange: (id: string) => void;
  errors: Record<string, string[]>;
  senderMissingCountry: boolean;
  recipientMissingCountry: boolean;
  onCompleteSenderCountry: () => void;
  onCompleteRecipientCountry: () => void;
  canProceedStep1: boolean;
  setStep: (n: number) => void;
}

export function Step1PartiesCard({
  clientId,
  onSenderChange,
  recipientId,
  onRecipientChange,
  errors,
  senderMissingCountry,
  recipientMissingCountry,
  onCompleteSenderCountry,
  onCompleteRecipientCountry,
  canProceedStep1,
  setStep,
}: Step1PartiesCardProps) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/10 shadow-md">
        <CardHeader className="bg-primary/[0.03] border-b border-primary/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Parties prenantes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Step1Actors
            senderId={clientId}
            onSenderChange={onSenderChange}
            recipientId={recipientId}
            onRecipientChange={onRecipientChange}
            errors={errors}
          />
        </CardContent>
      </Card>

      {(senderMissingCountry || recipientMissingCountry) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pays manquant sur le profil</AlertTitle>
          <AlertDescription className="space-y-3 text-sm">
            <p>
              Le pays doit être renseigné sur chaque profil pour déterminer la route logistique.
            </p>
            <ul className="list-inside list-disc space-y-2 text-xs">
              {senderMissingCountry && (
                <li className="flex flex-wrap items-center gap-2">
                  <span>
                    <strong>Expéditeur</strong> : aucun pays enregistré.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] bg-background/50"
                    onClick={onCompleteSenderCountry}
                  >
                    Compléter la fiche
                  </Button>
                </li>
              )}
              {recipientMissingCountry && (
                <li className="flex flex-wrap items-center gap-2">
                  <span>
                    <strong>Destinataire</strong> : aucun pays enregistré.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] bg-background/50"
                    onClick={onCompleteRecipientCountry}
                  >
                    Compléter la fiche
                  </Button>
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          className="px-8 shadow-lg shadow-primary/20"
          onClick={() => setStep(2)}
          disabled={!canProceedStep1}
        >
          Suivant <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
