<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use App\Models\EmailAutomation;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Templates par défaut
        $templates = [
            [
                'nom' => 'Envoi de devis',
                'type' => 'devis',
                'objet' => 'Votre devis {{numero_devis}} - {{nom_entreprise}}',
                'contenu' => "Bonjour {{nom_client}},

Veuillez trouver ci-joint le devis n°{{numero_devis}} d'un montant de {{montant_ttc}} TTC.

Ce devis est valable jusqu'au {{date_validite}}.

N'hésitez pas à nous contacter pour toute question.

Cordialement,
{{signature}}",
                'variables' => ['nom_client', 'numero_devis', 'montant_ttc', 'date_validite', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Envoi d\'ordre de travail',
                'type' => 'ordre',
                'objet' => 'Ordre de travail {{numero_ordre}} - {{nom_entreprise}}',
                'contenu' => "Bonjour {{nom_client}},

Nous vous confirmons la prise en charge de votre ordre de travail n°{{numero_ordre}}.

Conteneur: {{numero_conteneur}}
Type d'intervention: {{type_travail}}
Date prévue: {{date_prevue}}

Nous vous tiendrons informé de l'avancement.

Cordialement,
{{signature}}",
                'variables' => ['nom_client', 'numero_ordre', 'numero_conteneur', 'type_travail', 'date_prevue', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Envoi de facture',
                'type' => 'facture',
                'objet' => 'Facture {{numero_facture}} - {{nom_entreprise}}',
                'contenu' => "Bonjour {{nom_client}},

Veuillez trouver ci-joint la facture n°{{numero_facture}} d'un montant de {{montant_ttc}} TTC.

Date d'échéance: {{date_echeance}}

Mode de paiement: {{mode_paiement}}

Merci de votre confiance.

Cordialement,
{{signature}}",
                'variables' => ['nom_client', 'numero_facture', 'montant_ttc', 'date_echeance', 'mode_paiement', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Relance paiement',
                'type' => 'relance',
                'objet' => 'Rappel - Facture {{numero_facture}} en attente',
                'contenu' => "Bonjour {{nom_client}},

Nous nous permettons de vous rappeler que la facture n°{{numero_facture}} d'un montant de {{montant_ttc}} TTC reste impayée.

Date d'échéance dépassée: {{date_echeance}}
Retard: {{jours_retard}} jours

Merci de procéder au règlement dans les meilleurs délais.

Cordialement,
{{signature}}",
                'variables' => ['nom_client', 'numero_facture', 'montant_ttc', 'date_echeance', 'jours_retard', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Confirmation de paiement',
                'type' => 'confirmation',
                'objet' => 'Confirmation de paiement - Facture {{numero_facture}}',
                'contenu' => "Bonjour {{nom_client}},

Nous accusons réception de votre paiement de {{montant_paye}} pour la facture n°{{numero_facture}}.

Date de paiement: {{date_paiement}}
Mode de paiement: {{mode_paiement}}

Merci de votre confiance.

Cordialement,
{{signature}}",
                'variables' => ['nom_client', 'numero_facture', 'montant_paye', 'date_paiement', 'mode_paiement', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
            [
                'nom' => 'Notification travaux terminés',
                'type' => 'notification',
                'objet' => 'Travaux terminés - Ordre {{numero_ordre}}',
                'contenu' => "Bonjour {{nom_client}},

Nous avons le plaisir de vous informer que les travaux concernant l'ordre n°{{numero_ordre}} sont terminés.

Conteneur: {{numero_conteneur}}
Date de fin: {{date_fin}}

Vous pouvez récupérer votre conteneur ou nous contacter pour organiser la livraison.

Cordialement,
{{signature}}",
                'variables' => ['nom_client', 'numero_ordre', 'numero_conteneur', 'date_fin', 'nom_entreprise', 'signature'],
                'actif' => true,
            ],
        ];

        foreach ($templates as $templateData) {
            EmailTemplate::create($templateData);
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
            EmailAutomation::create($automationData);
        }
    }
}
