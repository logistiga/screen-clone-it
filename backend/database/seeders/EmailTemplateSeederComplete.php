<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeederComplete extends Seeder
{
    /**
     * Seed des templates d'emails complets pour LOJISTIGA
     */
    public function run(): void
    {
        $templates = [
            // 1. ENVOI DE DEVIS
            [
                'nom' => 'Envoi de Devis',
                'type' => 'devis',
                'objet' => 'Votre Devis N°{{numero_devis}} - LOJISTIGA',
                'contenu' => $this->getTemplateDevis(),
                'variables' => [
                    'client_nom', 'numero_devis', 'date_devis', 'date_validite',
                    'montant_ht', 'remise_montant', 'remise_type', 'montant_tva',
                    'montant_css', 'montant_ttc', 'message_personnalise', 'signature'
                ],
                'actif' => true,
            ],

            // 2. ENVOI DE FACTURE
            [
                'nom' => 'Envoi de Facture',
                'type' => 'facture',
                'objet' => 'Votre Facture N°{{numero_facture}} - LOJISTIGA',
                'contenu' => $this->getTemplateFacture(),
                'variables' => [
                    'client_nom', 'numero_facture', 'date_facture', 'date_echeance',
                    'montant_ht', 'remise_montant', 'remise_type', 'montant_tva',
                    'montant_css', 'montant_ttc', 'reste_a_payer', 'statut',
                    'message_personnalise', 'signature'
                ],
                'actif' => true,
            ],

            // 3. ENVOI D'ORDRE DE TRAVAIL
            [
                'nom' => 'Envoi d\'Ordre de Travail',
                'type' => 'ordre',
                'objet' => 'Ordre de Travail N°{{numero_ordre}} - LOJISTIGA',
                'contenu' => $this->getTemplateOrdre(),
                'variables' => [
                    'client_nom', 'numero_ordre', 'date_creation', 'conteneurs',
                    'statut', 'montant_ht', 'remise_montant', 'montant_ttc',
                    'message_personnalise', 'signature'
                ],
                'actif' => true,
            ],

            // 4. CONFIRMATION DE PAIEMENT
            [
                'nom' => 'Confirmation de Paiement',
                'type' => 'confirmation',
                'objet' => 'Confirmation de Paiement - Réf. {{reference_paiement}}',
                'contenu' => $this->getTemplateConfirmationPaiement(),
                'variables' => [
                    'client_nom', 'reference_paiement', 'numero_facture',
                    'date_paiement', 'montant_paye', 'mode_paiement',
                    'reste_a_payer', 'signature'
                ],
                'actif' => true,
            ],

            // 5. RAPPEL DE PAIEMENT - NIVEAU 1
            [
                'nom' => 'Rappel de Paiement - Niveau 1',
                'type' => 'relance',
                'objet' => 'Rappel : Facture N°{{numero_facture}} en attente de règlement',
                'contenu' => $this->getTemplateRappelNiveau1(),
                'variables' => [
                    'client_nom', 'numero_facture', 'date_facture',
                    'date_echeance', 'montant_du', 'jours_retard', 'signature'
                ],
                'actif' => true,
            ],

            // 6. RAPPEL DE PAIEMENT - NIVEAU 2
            [
                'nom' => 'Rappel de Paiement - Niveau 2',
                'type' => 'relance',
                'objet' => '⚠️ URGENT : Facture N°{{numero_facture}} - {{jours_retard}} jours de retard',
                'contenu' => $this->getTemplateRappelNiveau2(),
                'variables' => [
                    'client_nom', 'numero_facture', 'date_facture',
                    'date_echeance', 'montant_du', 'jours_retard', 'signature'
                ],
                'actif' => true,
            ],

            // 7. RAPPEL DE PAIEMENT - NIVEAU 3
            [
                'nom' => 'Rappel de Paiement - Niveau 3',
                'type' => 'relance',
                'objet' => '🚨 DERNIER RAPPEL : Facture N°{{numero_facture}} - Action imminente',
                'contenu' => $this->getTemplateRappelNiveau3(),
                'variables' => [
                    'client_nom', 'numero_facture', 'date_facture',
                    'date_echeance', 'montant_du', 'jours_retard', 'signature'
                ],
                'actif' => true,
            ],

            // 8. RAPPORT QUOTIDIEN
            [
                'nom' => 'Rapport Quotidien',
                'type' => 'notification',
                'objet' => '📊 Récapitulatif Quotidien - {{date}}',
                'contenu' => $this->getTemplateRapportQuotidien(),
                'variables' => [
                    'date', 'factures_creees', 'factures_payees', 'devis_crees',
                    'ordres_crees', 'montant_encaisse', 'factures_impayees',
                    'montant_impaye', 'signature'
                ],
                'actif' => true,
            ],

            // 9. RAPPORT DES FACTURES IMPAYÉES
            [
                'nom' => 'Rapport des Factures Impayées',
                'type' => 'notification',
                'objet' => '🚨 Rapport Factures Impayées - {{date}} ({{nombre_factures}} factures)',
                'contenu' => $this->getTemplateRapportFacturesImpayees(),
                'variables' => [
                    'date', 'nombre_factures', 'montant_total',
                    'liste_factures', 'signature'
                ],
                'actif' => true,
            ],

            // 10. RAPPORT DES ORDRES DE TRAVAIL
            [
                'nom' => 'Rapport des Ordres de Travail',
                'type' => 'notification',
                'objet' => '📦 Rapport OT - {{date}} ({{nombre_ordres}} ordres)',
                'contenu' => $this->getTemplateRapportOrdres(),
                'variables' => [
                    'date', 'nombre_ordres', 'ordres_en_cours', 'ordres_termines',
                    'ordres_en_attente', 'montant_total', 'liste_ordres', 'signature'
                ],
                'actif' => true,
            ],

            // 11. RAPPORT DE PAIEMENTS
            [
                'nom' => 'Rapport de Paiements',
                'type' => 'notification',
                'objet' => '💰 Rapport des Paiements - {{periode}} ({{montant_total}} FCFA)',
                'contenu' => $this->getTemplateRapportPaiements(),
                'variables' => [
                    'periode', 'date_debut', 'date_fin', 'nombre_paiements',
                    'montant_total', 'paiements_especes', 'paiements_virement',
                    'paiements_cheque', 'paiements_mobile', 'liste_paiements', 'signature'
                ],
                'actif' => true,
            ],

            // 12. BIENVENUE NOUVEAU CLIENT
            [
                'nom' => 'Bienvenue Nouveau Client',
                'type' => 'notification',
                'objet' => '🎉 Bienvenue chez LOJISTIGA, {{client_nom}} !',
                'contenu' => $this->getTemplateBienvenueClient(),
                'variables' => [
                    'client_nom', 'client_email', 'client_telephone',
                    'date_creation', 'signature'
                ],
                'actif' => true,
            ],

            // 13. ALERTE ÉCHÉANCE CRÉDIT
            [
                'nom' => 'Alerte Échéance Crédit',
                'type' => 'notification',
                'objet' => '⏰ Alerte : Échéance crédit {{reference}} dans {{jours_restants}} jours',
                'contenu' => $this->getTemplateAlerteCredit(),
                'variables' => [
                    'reference', 'banque', 'montant_total', 'montant_echeance',
                    'date_echeance', 'jours_restants', 'signature'
                ],
                'actif' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['nom' => $template['nom']],
                $template
            );
        }

        $this->command->info('✅ ' . count($templates) . ' templates d\'emails créés avec succès !');
    }

    // ==================== TEMPLATES HTML ====================

    private function getTemplateDevis(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px;">Solutions Logistiques Professionnelles</p>
  </div>
  <div style="padding: 30px;">
    <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px;">📄 Devis N°{{numero_devis}}</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Suite à votre demande, nous avons le plaisir de vous transmettre notre devis détaillé.</p>
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
      <p style="color: #1e40af; margin: 0; font-size: 14px;">{{message_personnalise}}</p>
    </div>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">💰 Détails Financiers</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant HT</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{montant_ht}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #059669; font-size: 14px;">Remise ({{remise_type}})</td><td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600;">-{{remise_montant}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">TVA (18%)</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_tva}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">CSS (1%)</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_css}} FCFA</td></tr>
        <tr style="border-top: 2px solid #1e40af;"><td style="padding: 12px 0; color: #1e40af; font-size: 16px; font-weight: 700;">TOTAL TTC</td><td style="padding: 12px 0; color: #1e40af; font-size: 18px; text-align: right; font-weight: 700;">{{montant_ttc}} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Ce devis est valable jusqu'au <strong>{{date_validite}}</strong>.</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">Cordialement,<br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Solutions Logistiques</p>
  </div>
</div>
HTML;
    }

    private function getTemplateFacture(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px;">Facture Professionnelle</p>
  </div>
  <div style="padding: 30px;">
    <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 20px;">🧾 Facture N°{{numero_facture}}</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Veuillez trouver ci-joint votre facture pour les prestations réalisées.</p>
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="color: #047857; margin: 0; font-size: 14px;">{{message_personnalise}}</p>
    </div>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">💰 Récapitulatif</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant HT</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{montant_ht}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #059669; font-size: 14px;">Remise ({{remise_type}})</td><td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600;">-{{remise_montant}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">TVA (18%)</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_tva}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">CSS (1%)</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_css}} FCFA</td></tr>
        <tr style="border-top: 2px solid #059669;"><td style="padding: 12px 0; color: #059669; font-size: 16px; font-weight: 700;">TOTAL TTC</td><td style="padding: 12px 0; color: #059669; font-size: 18px; text-align: right; font-weight: 700;">{{montant_ttc}} FCFA</td></tr>
        <tr style="background: #fef2f2;"><td style="padding: 12px; color: #dc2626; font-size: 14px; font-weight: 600;">Reste à payer</td><td style="padding: 12px; color: #dc2626; font-size: 16px; text-align: right; font-weight: 700;">{{reste_a_payer}} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Merci de procéder au règlement avant le <strong>{{date_echeance}}</strong>.</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">Cordialement,<br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Pour toute question, contactez notre service comptabilité.</p>
  </div>
</div>
HTML;
    }

    private function getTemplateOrdre(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 14px;">Ordre de Travail</p>
  </div>
  <div style="padding: 30px;">
    <h2 style="color: #7c3aed; margin: 0 0 20px 0; font-size: 20px;">📦 Ordre de Travail N°{{numero_ordre}}</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Nous vous confirmons la prise en charge de votre ordre de travail.</p>
    <div style="background: #faf5ff; border-left: 4px solid #a855f7; padding: 15px; margin: 20px 0;">
      <p style="color: #6b21a8; margin: 0; font-size: 14px;">{{message_personnalise}}</p>
    </div>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📋 Détails de l'Ordre</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">N° Ordre</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_ordre}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date de création</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_creation}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Conteneur(s)</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{conteneurs}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Statut</td><td style="padding: 8px 0; text-align: right;"><span style="background: #ddd6fe; color: #5b21b6; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">{{statut}}</span></td></tr>
      </table>
    </div>
    <div style="background: #faf5ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant HT</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_ht}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #059669; font-size: 14px;">Remise</td><td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right;">-{{remise_montant}} FCFA</td></tr>
        <tr style="border-top: 2px solid #7c3aed;"><td style="padding: 12px 0; color: #7c3aed; font-size: 16px; font-weight: 700;">TOTAL TTC</td><td style="padding: 12px 0; color: #7c3aed; font-size: 18px; text-align: right; font-weight: 700;">{{montant_ttc}} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">Cordialement,<br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Solutions Logistiques</p>
  </div>
</div>
HTML;
    }

    private function getTemplateConfirmationPaiement(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #059669 0%, #34d399 100%); padding: 30px; text-align: center;">
    <div style="background: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 30px;">✓</span>
    </div>
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Paiement Reçu</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px;">Merci pour votre confiance</p>
  </div>
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Nous accusons réception de votre paiement et vous en remercions.</p>
    <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #a7f3d0;">
      <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px;">💳 Détails du Paiement</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Référence</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{reference_paiement}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{numero_facture}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_paiement}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mode</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{mode_paiement}}</td></tr>
        <tr style="border-top: 2px solid #059669; background: #d1fae5;"><td style="padding: 12px 8px; color: #059669; font-size: 16px; font-weight: 700;">Montant payé</td><td style="padding: 12px 8px; color: #059669; font-size: 18px; text-align: right; font-weight: 700;">{{montant_paye}} FCFA</td></tr>
      </table>
    </div>
    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Reste à payer :</strong> {{reste_a_payer}} FCFA</p>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">Cordialement,<br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Ce reçu fait foi de paiement.</p>
  </div>
</div>
HTML;
    }

    private function getTemplateRappelNiveau1(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 14px;">Rappel de Paiement</p>
  </div>
  <div style="padding: 30px;">
    <h2 style="color: #f59e0b; margin: 0 0 20px 0; font-size: 20px;">🔔 Rappel Amical</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture suivante :</p>
    <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #fcd34d;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_facture}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date de facturation</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_facture}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Échéance</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{date_echeance}}</td></tr>
        <tr style="border-top: 2px solid #f59e0b;"><td style="padding: 12px 0; color: #f59e0b; font-size: 16px; font-weight: 700;">Montant dû</td><td style="padding: 12px 0; color: #f59e0b; font-size: 18px; text-align: right; font-weight: 700;">{{montant_du}} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Si le paiement a déjà été effectué, nous vous prions de ne pas tenir compte de ce message.</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">Cordialement,<br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Service Comptabilité</p>
  </div>
</div>
HTML;
    }

    private function getTemplateRappelNiveau2(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 14px;">Rappel Urgent</p>
  </div>
  <div style="padding: 30px;">
    <h2 style="color: #ea580c; margin: 0 0 20px 0; font-size: 20px;">⚠️ Second Rappel - Retard de {{jours_retard}} jours</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Bonjour <strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Malgré notre précédent rappel, nous constatons que la facture ci-dessous reste impayée :</p>
    <div style="background: #fef2f2; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: 600;">⏰ Retard de paiement : {{jours_retard}} jours</p>
    </div>
    <div style="background: #fff7ed; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #fdba74;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_facture}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Échéance dépassée</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{date_echeance}}</td></tr>
        <tr style="border-top: 2px solid #ea580c;"><td style="padding: 12px 0; color: #ea580c; font-size: 16px; font-weight: 700;">Montant dû</td><td style="padding: 12px 0; color: #ea580c; font-size: 18px; text-align: right; font-weight: 700;">{{montant_du}} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.</strong></p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">Cordialement,<br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Service Recouvrement</p>
  </div>
</div>
HTML;
    }

    private function getTemplateRappelNiveau3(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">Dernier Avertissement</p>
  </div>
  <div style="padding: 30px;">
    <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 20px;">🚨 DERNIER RAPPEL AVANT ACTIONS</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Malgré nos multiples relances, votre facture reste impayée depuis <strong>{{jours_retard}} jours</strong>.</p>
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">⚠️ ATTENTION</h3>
      <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.6;">Sans règlement de votre part sous <strong>48 heures</strong>, nous serons contraints d'engager des procédures de recouvrement.</p>
      <ul style="color: #7f1d1d; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
        <li>Suspension de tous les services en cours</li>
        <li>Application de pénalités de retard</li>
        <li>Transmission au service contentieux</li>
      </ul>
    </div>
    <div style="background: #fee2e2; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_facture}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Retard</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{jours_retard}} jours</td></tr>
        <tr style="border-top: 2px solid #dc2626;"><td style="padding: 12px 0; color: #dc2626; font-size: 16px; font-weight: 700;">MONTANT DÛ</td><td style="padding: 12px 0; color: #dc2626; font-size: 20px; text-align: right; font-weight: 700;">{{montant_du}} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #1f2937; padding: 20px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">LOJISTIGA - Service Contentieux<br>Ce courrier vaut mise en demeure.</p>
  </div>
</div>
HTML;
    }

    private function getTemplateRapportQuotidien(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Rapport Quotidien</h1>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">{{date}}</p>
  </div>
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Bonjour,<br>Voici le récapitulatif de l'activité du jour :</p>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
      <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #166534; margin: 0; font-size: 12px;">📄 Factures créées</p>
        <p style="color: #14532d; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{factures_creees}}</p>
      </div>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #047857; margin: 0; font-size: 12px;">✅ Factures payées</p>
        <p style="color: #065f46; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{factures_payees}}</p>
      </div>
      <div style="background: #eff6ff; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #1e40af; margin: 0; font-size: 12px;">📋 Devis créés</p>
        <p style="color: #1e3a8a; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{devis_crees}}</p>
      </div>
      <div style="background: #faf5ff; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #7c3aed; margin: 0; font-size: 12px;">📦 Ordres créés</p>
        <p style="color: #5b21b6; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{ordres_crees}}</p>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
      <p style="color: #d1fae5; margin: 0; font-size: 14px;">💰 Montant encaissé aujourd'hui</p>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 32px; font-weight: 700;">{{montant_encaisse}} FCFA</p>
    </div>
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⚠️ Attention - Factures impayées</h3>
      <p style="color: #7f1d1d; margin: 0; font-size: 14px;"><strong>{{factures_impayees}}</strong> facture(s) en retard pour un total de <strong>{{montant_impaye}} FCFA</strong></p>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">Connectez-vous à LOJISTIGA pour plus de détails.<br><br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">Rapport généré automatiquement par LOJISTIGA</p>
  </div>
</div>
HTML;
    }

    private function getTemplateRapportFacturesImpayees(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #f87171 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚨 Factures Impayées</h1>
    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">Rapport du {{date}}</p>
  </div>
  <div style="background: #fef2f2; padding: 20px; display: flex; justify-content: space-around; border-bottom: 1px solid #fecaca;">
    <div style="text-align: center;">
      <p style="color: #991b1b; margin: 0; font-size: 12px;">Nombre de factures</p>
      <p style="color: #7f1d1d; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{nombre_factures}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #991b1b; margin: 0; font-size: 12px;">Montant total dû</p>
      <p style="color: #7f1d1d; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{montant_total}} FCFA</p>
    </div>
  </div>
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Voici la liste des factures en attente de règlement :</p>
    <div style="margin: 25px 0; overflow-x: auto;">{{liste_factures}}</div>
    <p style="color: #6b7280; font-size: 13px; font-style: italic;">* Les factures sont triées par ordre de retard décroissant</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;"><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #1f2937; padding: 20px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">LOJISTIGA - Service Recouvrement</p>
  </div>
</div>
HTML;
    }

    private function getTemplateRapportOrdres(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📦 Rapport Ordres de Travail</h1>
    <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 14px;">{{date}}</p>
  </div>
  <div style="background: #faf5ff; padding: 20px; display: flex; justify-content: space-around; border-bottom: 1px solid #e9d5ff;">
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">🔄 En cours</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">{{ordres_en_cours}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">✅ Terminés</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">{{ordres_termines}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">⏳ En attente</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">{{ordres_en_attente}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">💰 Total</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 18px; font-weight: 700;">{{montant_total}}</p>
    </div>
  </div>
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Synthèse des ordres de travail :</p>
    <div style="margin: 25px 0; overflow-x: auto;">{{liste_ordres}}</div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;"><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Gestion des Opérations</p>
  </div>
</div>
HTML;
    }

    private function getTemplateRapportPaiements(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #059669 0%, #34d399 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💰 Rapport des Paiements</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px;">{{periode}}</p>
  </div>
  <div style="background: #ecfdf5; padding: 25px; text-align: center; border-bottom: 2px solid #10b981;">
    <p style="color: #047857; margin: 0; font-size: 14px;">Total encaissé</p>
    <p style="color: #065f46; margin: 10px 0 0 0; font-size: 36px; font-weight: 700;">{{montant_total}} FCFA</p>
    <p style="color: #059669; margin: 10px 0 0 0; font-size: 13px;">{{nombre_paiements}} paiement(s) reçu(s)</p>
  </div>
  <div style="padding: 25px; background: #f8fafc;">
    <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 14px; text-align: center;">Répartition par mode de paiement</h3>
    <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 100px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">💵 Espèces</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_especes}}</p>
      </div>
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 100px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">🏦 Virement</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_virement}}</p>
      </div>
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 100px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">📝 Chèque</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_cheque}}</p>
      </div>
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 100px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">📱 Mobile</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_mobile}}</p>
      </div>
    </div>
  </div>
  <div style="padding: 30px;">
    <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Détail des paiements</h3>
    <div style="margin: 15px 0; overflow-x: auto;">{{liste_paiements}}</div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;"><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Service Comptabilité</p>
  </div>
</div>
HTML;
    }

    private function getTemplateBienvenueClient(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px; text-align: center;">
    <div style="background: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 40px;">🎉</span>
    </div>
    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Bienvenue !</h1>
    <p style="color: #bfdbfe; margin: 15px 0 0 0; font-size: 16px;">Nous sommes ravis de vous compter parmi nous</p>
  </div>
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">Bonjour <strong>{{client_nom}}</strong>,</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Toute l'équipe LOJISTIGA vous souhaite la bienvenue ! Nous sommes honorés de votre confiance.</p>
    <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📋 Vos informations</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nom / Société</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{client_nom}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{client_email}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Téléphone</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{client_telephone}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Compte créé le</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_creation}}</td></tr>
      </table>
    </div>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">🚀 Nos services</h3>
      <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Gestion logistique complète</li>
        <li>Suivi des conteneurs en temps réel</li>
        <li>Devis et facturation professionnels</li>
        <li>Support réactif et personnalisé</li>
      </ul>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">À très bientôt,<br><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #1e40af; padding: 25px; text-align: center;">
    <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 600;">LOJISTIGA</p>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 12px;">Solutions Logistiques Professionnelles</p>
  </div>
</div>
HTML;
    }

    private function getTemplateAlerteCredit(): string
    {
        return <<<'HTML'
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Alerte Échéance</h1>
    <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 14px;">Crédit Bancaire</p>
  </div>
  <div style="background: #fffbeb; padding: 20px; text-align: center; border-bottom: 3px solid #f59e0b;">
    <p style="color: #f59e0b; margin: 0; font-size: 14px; font-weight: 600;">⚠️ ATTENTION</p>
    <p style="color: #92400e; margin: 10px 0 0 0; font-size: 32px; font-weight: 700;">{{jours_restants}} jours</p>
    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 13px;">avant l'échéance</p>
  </div>
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Une échéance de crédit approche. Voici les détails :</p>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🏦 Informations du Crédit</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Référence</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{reference}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Banque</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{banque}}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant total</td><td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_total}} FCFA</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date d'échéance</td><td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{date_echeance}}</td></tr>
        <tr style="border-top: 2px solid #f59e0b; background: #fffbeb;"><td style="padding: 12px 8px; color: #f59e0b; font-size: 16px; font-weight: 700;">Montant à payer</td><td style="padding: 12px 8px; color: #f59e0b; font-size: 18px; text-align: right; font-weight: 700;">{{montant_echeance}} FCFA</td></tr>
      </table>
    </div>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Merci de vous assurer que les fonds sont disponibles pour honorer cette échéance.</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;"><strong>{{signature}}</strong></p>
  </div>
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">LOJISTIGA - Gestion Financière</p>
  </div>
</div>
HTML;
    }
}
