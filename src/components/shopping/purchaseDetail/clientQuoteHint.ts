export function clientQuoteHint(statusCode: string): string | undefined {
  switch (statusCode) {
    case 'awaiting_payment':
      return 'Utilisez les moyens de paiement indiqués ci-dessous. Après votre règlement, vous pouvez nous prévenir pour accélérer la validation côté équipe.'
    case 'paid':
      return 'Votre paiement est validé. Notre équipe passe ou a passé la commande chez le fournisseur.'
    case 'ordered':
      return 'Les articles ont été commandés. Vous serez informé lors de l’arrivée à l’entrepôt.'
    case 'arrived_at_hub':
      return 'Votre colis est arrivé à l’entrepôt. Suivez les prochaines étapes depuis votre tableau de bord.'
    case 'converted_to_shipment':
      return 'Cet achat a été converti en dossier d’expédition. Consultez vos expéditions pour le suivi.'
    default:
      return undefined
  }
}
