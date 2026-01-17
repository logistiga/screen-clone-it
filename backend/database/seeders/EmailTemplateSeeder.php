<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\EmailAutomation;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Templates par défaut avec messages professionnels
        $templates = [
            [
                'nom' => 'Envoi de devis',
                'type' => 'devis',
                'objet' => '📄 Votre Devis N°{{numero_devis}} - LOGISTIGA',
                'contenu' => "Bonjour {{nom_client}},

Suite à votre demande, nous avons le plaisir de vous transmettre notre devis détaillé N°{{numero_devis}} d'un montant de {{montant_ttc}} FCFA TTC.

Ce devis est valable jusqu'au {{date_validite}}. Nous restons à votre entière disposition pour toute information complémentaire ou pour discuter des modalités de mise en œuvre.

Nous vous remercions pour votre confiance et espérons avoir le plaisir de collaborer avec vous.

Cordialement,
{{signature}}
L'équipe LOGISTIGA",
                'variables' => ['nom_client', 'numero_devis', 'montant_ttc', 'date_validite', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Envoi d\'ordre de travail',
                'type' => 'ordre',
                'objet' => '📦 Ordre de Travail N°{{numero_ordre}} - LOGISTIGA',
                'contenu' => "Bonjour {{nom_client}},

Nous avons le plaisir de vous confirmer la prise en charge de votre ordre de travail N°{{numero_ordre}}.

📋 Détails de l'opération :
• Conteneur : {{numero_conteneur}}
• Type d'intervention : {{type_travail}}
• Date prévue : {{date_prevue}}

Notre équipe s'engage à vous fournir un service de qualité dans les meilleurs délais. Nous vous tiendrons informé de l'avancement des travaux.

N'hésitez pas à nous contacter pour toute question.

Cordialement,
{{signature}}
L'équipe LOGISTIGA",
                'variables' => ['nom_client', 'numero_ordre', 'numero_conteneur', 'type_travail', 'date_prevue', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Envoi de facture',
                'type' => 'facture',
                'objet' => '🧾 Facture N°{{numero_facture}} - LOGISTIGA',
                'contenu' => "Bonjour {{nom_client}},

Nous vous prions de trouver ci-joint la facture N°{{numero_facture}} d'un montant de {{montant_ttc}} FCFA TTC pour les prestations réalisées.

📅 Date d'échéance : {{date_echeance}}
💳 Mode de paiement : {{mode_paiement}}

Nous vous remercions de procéder au règlement avant la date d'échéance indiquée. Pour toute question concernant cette facture, notre service comptabilité reste à votre disposition.

Merci pour votre confiance.

Cordialement,
{{signature}}
L'équipe LOGISTIGA",
                'variables' => ['nom_client', 'numero_facture', 'montant_ttc', 'date_echeance', 'mode_paiement', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Relance paiement - Niveau 1',
                'type' => 'relance',
                'objet' => '📬 Rappel - Facture N°{{numero_facture}} en attente',
                'contenu' => "Bonjour {{nom_client}},

Sauf erreur ou omission de notre part, nous nous permettons de vous rappeler que la facture N°{{numero_facture}} d'un montant de {{montant_ttc}} FCFA TTC reste en attente de règlement.

📅 Date d'échéance dépassée : {{date_echeance}}
⏱️ Retard : {{jours_retard}} jours

Nous vous saurions gré de bien vouloir procéder au règlement dans les meilleurs délais. Si vous avez déjà effectué le paiement, veuillez ignorer ce message.

En cas de difficulté, n'hésitez pas à nous contacter pour trouver une solution ensemble.

Cordialement,
{{signature}}
Le Service Comptabilité - LOGISTIGA",
                'variables' => ['nom_client', 'numero_facture', 'montant_ttc', 'date_echeance', 'jours_retard', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Confirmation de paiement',
                'type' => 'confirmation',
                'objet' => '✅ Confirmation de Paiement - Facture N°{{numero_facture}}',
                'contenu' => "Bonjour {{nom_client}},

Nous accusons bonne réception de votre paiement et vous en remercions sincèrement.

💳 Détails du paiement :
• Montant reçu : {{montant_paye}} FCFA
• Date de paiement : {{date_paiement}}
• Mode de paiement : {{mode_paiement}}
• Facture concernée : N°{{numero_facture}}

Votre confiance nous honore et nous nous engageons à continuer de vous offrir un service de qualité.

Cordialement,
{{signature}}
L'équipe LOGISTIGA",
                'variables' => ['nom_client', 'numero_facture', 'montant_paye', 'date_paiement', 'mode_paiement', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Notification travaux terminés',
                'type' => 'notification',
                'objet' => '✅ Travaux Terminés - Ordre N°{{numero_ordre}}',
                'contenu' => "Bonjour {{nom_client}},

Nous avons le plaisir de vous informer que les travaux concernant l'ordre N°{{numero_ordre}} sont maintenant terminés avec succès.

📦 Conteneur : {{numero_conteneur}}
📅 Date de fin : {{date_fin}}

Vous pouvez récupérer votre conteneur ou nous contacter pour organiser la livraison selon vos convenances.

Nous vous remercions pour votre confiance.

Cordialement,
{{signature}}
L'équipe LOGISTIGA",
                'variables' => ['nom_client', 'numero_ordre', 'numero_conteneur', 'date_fin', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Envoi de note de début',
                'type' => 'note_debut',
                'objet' => '📝 Note de Début N°{{numero_note}} - LOGISTIGA',
                'contenu' => "Bonjour {{nom_client}},

Nous vous prions de trouver ci-joint votre note de début N°{{numero_note}} concernant l'opération de {{type_operation}}.

📋 Récapitulatif :
• Conteneur : {{numero_conteneur}}
• Période : {{periode}}
• Montant total : {{montant_total}} FCFA

Ce document récapitule les détails de l'opération et les montants associés. N'hésitez pas à nous contacter pour toute question.

Cordialement,
{{signature}}
L'équipe LOGISTIGA",
                'variables' => ['nom_client', 'numero_note', 'type_operation', 'numero_conteneur', 'periode', 'montant_total', 'signature'],
                'actif' => true,
            ],
        ];

        foreach ($templates as $templateData) {
            EmailTemplate::updateOrCreate(
                ['nom' => $templateData['nom']],
                $templateData
            );
        }

        // Automatisations par défaut
        $automations = [
            [
                'nom' => 'Envoi automatique devis',
                'declencheur' => 'creation_devis',
                'template_id' => 1,
                'delai' => 0,
                'delai_unite' => 'minutes',
                'actif' => true,
                'conditions' => 'Envoi immédiat après création',
            ],
            [
                'nom' => 'Envoi automatique facture',
                'declencheur' => 'creation_facture',
                'template_id' => 3,
                'delai' => 0,
                'delai_unite' => 'minutes',
                'actif' => false,
                'conditions' => 'Envoi immédiat après création',
            ],
            [
                'nom' => 'Relance automatique J+7',
                'declencheur' => 'facture_impayee',
                'template_id' => 4,
                'delai' => 7,
                'delai_unite' => 'jours',
                'actif' => true,
                'conditions' => '7 jours après date d\'échéance',
            ],
            [
                'nom' => 'Relance automatique J+15',
                'declencheur' => 'facture_impayee',
                'template_id' => 4,
                'delai' => 15,
                'delai_unite' => 'jours',
                'actif' => true,
                'conditions' => '15 jours après date d\'échéance',
            ],
            [
                'nom' => 'Confirmation paiement reçu',
                'declencheur' => 'paiement_recu',
                'template_id' => 5,
                'delai' => 0,
                'delai_unite' => 'minutes',
                'actif' => true,
                'conditions' => 'Envoi immédiat après enregistrement du paiement',
            ],
            [
                'nom' => 'Notification fin travaux',
                'declencheur' => 'ordre_termine',
                'template_id' => 6,
                'delai' => 1,
                'delai_unite' => 'heures',
                'actif' => false,
                'conditions' => '1 heure après clôture de l\'ordre',
            ],
        ];

        foreach ($automations as $automationData) {
            EmailAutomation::updateOrCreate(
                ['nom' => $automationData['nom']],
                $automationData
            );
        }
    }
}