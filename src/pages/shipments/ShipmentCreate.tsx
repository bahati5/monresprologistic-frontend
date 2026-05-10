import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DraftStatusIndicator } from "@/components/drafts/DraftStatusIndicator";
import { DraftResumeDialog } from "@/components/drafts/DraftResumeDialog";
import { ShipmentWizardStepper } from "@/components/workflow/ShipmentWizardStepper";
import { ShipmentWorkflowProvider } from "@/contexts/ShipmentWorkflowContext";
import { ShipmentProcessSteps } from "@/components/workflow/ShipmentProcessSteps";
import { DocumentPreviewStep } from "@/components/workflow/DocumentPreviewStep";
import { CheckoutStep } from "@/components/workflow/CheckoutStep";
import { ProfileWizardEditModal } from "@/components/workflow/ProfileWizardEditModal";
import {
  WizardPackagingCreateDialog,
  WizardShipLineCreateDialog,
  WizardTransportCreateDialog,
} from "@/components/workflow/ShipmentWizardCreateDialogs";
import { userCan } from "@/lib/permissions";
import { Step1PartiesCard } from "@/components/shipments/create/Step1PartiesCard";
import { Step2Logistics } from "@/components/shipments/create/Step2Logistics";
import { Step3Packaging } from "@/components/shipments/create/Step3Packaging";
import { ShipmentCreateSummary } from "@/components/shipments/create/ShipmentCreateSummary";
import { useShipmentCreateForm } from "@/hooks/shipments/useShipmentCreateForm";
import { toast } from "sonner";

function ShipmentCreateContent() {
  const f = useShipmentCreateForm();
  const {
    currentStep: workflowStep,
    completedSteps,
    goToStep,
    shipmentId: createdShipmentId,
  } = f.meta.workflow;

  const canManageSettings = userCan(f.user, "manage_settings");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {!f.meta.isEditing && (
        <DraftResumeDialog
          draft={f.drafts.existingDraft ?? null}
          open={f.drafts.draftDialogOpen}
          onResume={f.drafts.handleResumeDraft}
          onDiscard={f.drafts.handleDiscardDraft}
          onOpenChange={f.drafts.setDraftDialogOpen}
        />
      )}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => f.meta.navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {f.meta.isEditing ? "Modifier l'expédition" : "Nouvelle expédition"}
          </h1>
          <div className="flex items-center gap-2">
            {createdShipmentId && (
              <p className="text-sm text-muted-foreground">{f.submit.trackingNumber}</p>
            )}
            {!f.meta.isEditing && (
              <DraftStatusIndicator
                lastSavedAt={f.drafts.draftLastSavedAt}
                isSaving={f.drafts.draftIsSaving}
              />
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ShipmentProcessSteps
            currentStep={workflowStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {workflowStep === "registration" && (
        <>
          {f.q.loadingOptions && (
            <p className="text-sm text-muted-foreground">
              Chargement des options de l&apos;assistant…
            </p>
          )}

          <ShipmentWizardStepper step={f.meta.step} onStepChange={f.meta.setStep} />

          <div className="space-y-4">
            {f.meta.step === 1 && (
              <Step1PartiesCard
                clientId={f.clientId}
                onSenderChange={f.actors.handleUserSenderChange}
                recipientId={f.recipientId}
                onRecipientChange={f.setRecipientId}
                errors={f.meta.errors}
                senderMissingCountry={f.actors.senderMissingCountry}
                recipientMissingCountry={f.actors.recipientMissingCountry}
                onCompleteSenderCountry={() => f.actors.handleUpdateClientCountry("sender")}
                onCompleteRecipientCountry={() => f.actors.handleUpdateClientCountry("recipient")}
                canProceedStep1={f.canProceedStep1}
                setStep={f.meta.setStep}
              />
            )}

            {f.meta.step === 2 && (
              <Step3Packaging
                itemsEntryMode={f.itemsBlock.itemsEntryMode}
                setItemsEntryMode={f.itemsBlock.setItemsEntryMode}
                globalTotalWeightKg={f.itemsBlock.globalTotalWeightKg}
                setGlobalTotalWeightKg={f.itemsBlock.setGlobalTotalWeightKg}
                globalTotalDeclaredValue={f.itemsBlock.globalTotalDeclaredValue}
                setGlobalTotalDeclaredValue={f.itemsBlock.setGlobalTotalDeclaredValue}
                currencyUiLabel={f.q.currencyUiLabel}
                articleCategoryList={f.q.articleCategoryList}
                displayVolumetricDivisor={f.logistics.displayVolumetricDivisor}
                items={f.itemsBlock.items}
                addItem={f.itemsBlock.addItem}
                removeItem={f.itemsBlock.removeItem}
                updateItem={f.itemsBlock.updateItem}
                totalVolEquivKg={f.totalVolEquivKg}
                itemsSumValue={f.itemsBlock.itemsSumValue}
                formatMoney={f.q.formatMoney}
                canProceedStep2={f.itemsBlock.canProceedStep2}
                setStep={f.meta.setStep}
              />
            )}

            {f.meta.step === 3 && (
              <Step2Logistics
                clientId={f.clientId}
                recipientId={f.recipientId}
                wizardRouteOriginId={f.logistics.wizardRouteOriginId}
                setWizardRouteOriginId={f.logistics.setWizardRouteOriginId}
                setUserOverrodeOrigin={f.logistics.setUserOverrodeOrigin}
                wizardRouteDestId={f.logistics.wizardRouteDestId}
                setWizardRouteDestId={f.logistics.setWizardRouteDestId}
                setUserOverrodeDest={f.logistics.setUserOverrodeDest}
                countryOptions={f.logistics.countryOptions}
                loadingOptions={f.q.loadingOptions}
                fetchingCountriesList={f.q.fetchingCountriesList}
                routeOriginMismatchSender={f.routeOriginMismatchSender}
                routeDestMismatchRecipient={f.routeDestMismatchRecipient}
                onUpdateClientCountry={f.actors.handleUpdateClientCountry}
                routeLinesLoading={f.logistics.routeLinesLoading}
                routeSelectionLabels={f.logistics.routeSelectionLabels}
                hasRouteLines={f.logistics.hasRouteLines}
                routeShipLines={f.logistics.routeShipLines}
                shipLineRateId={f.logistics.shipLineRateId}
                setShipLineRateId={f.logistics.setShipLineRateId}
                shippingModeId={f.logistics.shippingModeId}
                setShippingModeId={f.logistics.setShippingModeId}
                showModeCards={f.logistics.showModeCards}
                modeList={f.q.modeList as { id: number; name: unknown }[]}
                modesFiltered={f.logistics.modesFiltered as { id: number; name: unknown }[]}
                shippingModeFilter={f.logistics.shippingModeFilter}
                setShippingModeFilter={f.logistics.setShippingModeFilter}
                errors={f.meta.errors}
                baseDeliveryLabelForItems={f.logistics.baseDeliveryLabelForItems}
                packagingTypeId={f.logistics.packagingTypeId}
                setPackagingTypeId={f.logistics.setPackagingTypeId}
                packagingOptions={f.logistics.packagingOptions}
                packagingListLength={f.q.packagingList.length}
                transportCompanyId={f.logistics.transportCompanyId}
                setTransportCompanyId={f.logistics.setTransportCompanyId}
                transportCompanyOptions={f.logistics.transportCompanyOptions}
                transportCompanyListLength={f.q.transportCompanyList.length}
                canManageSettings={canManageSettings}
                setLogisticsModal={f.logistics.setLogisticsModal}
                setShipLineWizardOpen={f.logistics.setShipLineWizardOpen}
                saveDraftManually={f.drafts.saveDraftManually}
                draftIsSaving={f.drafts.draftIsSaving}
                canProceedStep3={f.canProceedStep3}
                setStep={f.meta.setStep}
                formatMoney={f.q.formatMoney}
              />
            )}

            {f.meta.step === 4 && (
              <ShipmentCreateSummary
                insurancePct={f.pricing.insurancePct}
                setInsurancePct={f.pricing.setInsurancePct}
                customsDutyPct={f.pricing.customsDutyPct}
                setCustomsDutyPct={f.pricing.setCustomsDutyPct}
                taxPct={f.pricing.taxPct}
                setTaxPct={f.pricing.setTaxPct}
                discountPct={f.pricing.discountPct}
                setDiscountPct={f.pricing.setDiscountPct}
                manualFee={f.pricing.manualFee}
                setManualFee={f.pricing.setManualFee}
                manualFeeLabel={f.pricing.manualFeeLabel}
                setManualFeeLabel={f.pricing.setManualFeeLabel}
                legalDeclarationAccepted={f.pricing.legalDeclarationAccepted}
                setLegalDeclarationAccepted={f.pricing.setLegalDeclarationAccepted}
                notes={f.pricing.notes}
                setNotes={f.pricing.setNotes}
                errors={f.meta.errors}
                previewPending={f.previewPending}
                snap={f.snap}
                formatMoney={f.q.formatMoney}
                saveDraftManually={f.drafts.saveDraftManually}
                draftIsSaving={f.drafts.draftIsSaving}
                canSubmit={f.submit.canSubmit}
                createMutationPending={f.q.createMutation.isPending}
                updateMutationPending={f.q.updateMutation.isPending}
                isEditing={f.meta.isEditing}
                onSubmit={f.submit.handleSubmit}
                setStep={f.meta.setStep}
              />
            )}
          </div>

          <WizardPackagingCreateDialog
            open={f.logistics.logisticsModal?.k === "packaging"}
            onOpenChange={(o) => {
              if (!o) f.logistics.setLogisticsModal(null);
            }}
            user={f.user}
            onCreated={(id) => {
              f.logistics.setPackagingTypeId(id);
              f.logistics.setLogisticsModal(null);
            }}
          />
          <WizardTransportCreateDialog
            open={f.logistics.logisticsModal?.k === "transport"}
            onOpenChange={(o) => {
              if (!o) f.logistics.setLogisticsModal(null);
            }}
            user={f.user}
            onCreated={(id) => {
              f.logistics.setTransportCompanyId(id);
              f.logistics.setLogisticsModal(null);
            }}
          />
          <WizardShipLineCreateDialog
            open={f.logistics.shipLineWizardOpen}
            onOpenChange={f.logistics.setShipLineWizardOpen}
            user={f.user}
            prefillOriginCountryId={f.logistics.wizardRouteOriginId || undefined}
            prefillDestCountryId={f.logistics.wizardRouteDestId || undefined}
            onCreated={() => {
              f.logistics.setShipLineWizardOpen(false);
              toast.success(
                "Ligne créée. Les tarifs pour cette route vont se recharger.",
              );
            }}
          />
        </>
      )}

      {workflowStep === "documents" && createdShipmentId && (
        <DocumentPreviewStep
          shipmentId={createdShipmentId}
          trackingNumber={f.submit.trackingNumber}
          onValidate={f.submit.handleDocumentsValidate}
        />
      )}

      {workflowStep === "checkout" && createdShipmentId && (
        <CheckoutStep
          shipment={f.submit.shipmentData}
          docSettings={f.submit.docSettings}
          onPaymentRecorded={f.submit.handlePaymentComplete}
          onRecordPayment={f.submit.handleRecordPayment}
          onInvoiceOptionsSaved={() => {
            if (createdShipmentId) void f.submit.fetchShipmentData(createdShipmentId);
          }}
          onViewForm={() => goToStep("documents")}
          isProcessing={false}
        />
      )}

      <ProfileWizardEditModal
        open={f.actors.editProfileModal.open}
        onOpenChange={(open) =>
          f.actors.setEditProfileModal((p) => ({ ...p, open }))
        }
        profile={f.actors.editProfileModal.profile}
        onUpdated={() => {}}
      />
    </div>
  );
}

export default function ShipmentCreate() {
  return (
    <ShipmentWorkflowProvider>
      <ShipmentCreateContent />
    </ShipmentWorkflowProvider>
  );
}
