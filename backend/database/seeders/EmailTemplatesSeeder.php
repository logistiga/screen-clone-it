<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            // ── Création ──
            [
                'nom' => 'Nouveau devis créé',
                'type' => 'devis',
                'objet' => 'Nouveau devis {{numero}} - {{entreprise}}',
                'contenu' => '<h2>Nouveau devis</h2><p>Bonjour {{client_nom}},</p><p>Nous avons le plaisir de vous transmettre le devis <strong>{{numero}}</strong> d\'un montant de <strong>{{montant_ttc}} FCFA</strong>.</p><p>Ce devis est valable jusqu\'au <strong>{{date_validite}}</strong>.</p><p>N\'hésitez pas à nous contacter pour toute question.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'montant_ttc', 'date_validite', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Nouvel ordre de travail créé',
                'type' => 'ordre',
                'objet' => 'Ordre de travail {{numero}} créé - {{entreprise}}',
                'contenu' => '<h2>Ordre de travail créé</h2><p>Bonjour {{client_nom}},</p><p>L\'ordre de travail <strong>{{numero}}</strong> a été créé avec succès.</p><p>Type : <strong>{{type_ot}}</strong></p><p>Date prévue : <strong>{{date_prevue}}</strong></p><p>Nous vous tiendrons informé de l\'avancement.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'type_ot', 'date_prevue', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Nouvelle facture créée',
                'type' => 'facture',
                'objet' => 'Facture {{numero}} - {{entreprise}}',
                'contenu' => '<h2>Nouvelle facture</h2><p>Bonjour {{client_nom}},</p><p>Veuillez trouver ci-joint la facture <strong>{{numero}}</strong> d\'un montant de <strong>{{montant_ttc}} FCFA</strong>.</p><p>Date d\'échéance : <strong>{{date_echeance}}</strong></p><p>Merci de procéder au règlement dans les délais impartis.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'montant_ttc', 'date_echeance', 'entreprise'],
                'actif' => true,
            ],

            // ── Modification ──
            [
                'nom' => 'Devis modifié',
                'type' => 'devis',
                'objet' => 'Devis {{numero}} modifié - {{entreprise}}',
                'contenu' => '<h2>Devis modifié</h2><p>Bonjour {{client_nom}},</p><p>Le devis <strong>{{numero}}</strong> a été mis à jour. Le nouveau montant est de <strong>{{montant_ttc}} FCFA</strong>.</p><p>Veuillez consulter la version mise à jour.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'montant_ttc', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Ordre de travail modifié',
                'type' => 'ordre',
                'objet' => 'OT {{numero}} modifié - {{entreprise}}',
                'contenu' => '<h2>Ordre de travail modifié</h2><p>Bonjour {{client_nom}},</p><p>L\'ordre de travail <strong>{{numero}}</strong> a été modifié.</p><p>Veuillez prendre note des changements apportés.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Facture modifiée',
                'type' => 'facture',
                'objet' => 'Facture {{numero}} modifiée - {{entreprise}}',
                'contenu' => '<h2>Facture modifiée</h2><p>Bonjour {{client_nom}},</p><p>La facture <strong>{{numero}}</strong> a été mise à jour. Le nouveau montant est de <strong>{{montant_ttc}} FCFA</strong>.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'montant_ttc', 'entreprise'],
                'actif' => true,
            ],

            // ── Suppression ──
            [
                'nom' => 'Devis supprimé',
                'type' => 'notification',
                'objet' => 'Devis {{numero}} annulé - {{entreprise}}',
                'contenu' => '<h2>Devis annulé</h2><p>Bonjour {{client_nom}},</p><p>Le devis <strong>{{numero}}</strong> a été annulé et n\'est plus valide.</p><p>N\'hésitez pas à nous contacter si vous souhaitez un nouveau devis.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Ordre de travail supprimé',
                'type' => 'notification',
                'objet' => 'OT {{numero}} annulé - {{entreprise}}',
                'contenu' => '<h2>Ordre de travail annulé</h2><p>Bonjour {{client_nom}},</p><p>L\'ordre de travail <strong>{{numero}}</strong> a été annulé.</p><p>Contactez-nous pour plus d\'informations.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Facture supprimée',
                'type' => 'notification',
                'objet' => 'Facture {{numero}} annulée - {{entreprise}}',
                'contenu' => '<h2>Facture annulée</h2><p>Bonjour {{client_nom}},</p><p>La facture <strong>{{numero}}</strong> a été annulée.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'entreprise'],
                'actif' => true,
            ],

            // ── Statuts ──
            [
                'nom' => 'Relance facture impayée',
                'type' => 'relance',
                'objet' => 'Rappel : Facture {{numero}} en attente de paiement',
                'contenu' => '<h2>Rappel de paiement</h2><p>Bonjour {{client_nom}},</p><p>Nous vous rappelons que la facture <strong>{{numero}}</strong> d\'un montant de <strong>{{montant_ttc}} FCFA</strong> est arrivée à échéance le <strong>{{date_echeance}}</strong>.</p><p>Merci de procéder au règlement dans les plus brefs délais.</p><p>Si le paiement a déjà été effectué, veuillez ignorer ce message.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'montant_ttc', 'date_echeance', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Confirmation de paiement',
                'type' => 'confirmation',
                'objet' => 'Paiement reçu - Facture {{numero}}',
                'contenu' => '<h2>Paiement confirmé</h2><p>Bonjour {{client_nom}},</p><p>Nous confirmons la réception de votre paiement de <strong>{{montant_paye}} FCFA</strong> pour la facture <strong>{{numero}}</strong>.</p><p>Merci pour votre confiance.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'montant_paye', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Ordre de travail terminé',
                'type' => 'ordre',
                'objet' => 'OT {{numero}} terminé - {{entreprise}}',
                'contenu' => '<h2>Travail terminé</h2><p>Bonjour {{client_nom}},</p><p>L\'ordre de travail <strong>{{numero}}</strong> a été complété avec succès.</p><p>La facture correspondante vous sera transmise prochainement.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Devis accepté',
                'type' => 'confirmation',
                'objet' => 'Devis {{numero}} accepté - {{entreprise}}',
                'contenu' => '<h2>Devis accepté</h2><p>Bonjour {{client_nom}},</p><p>Votre devis <strong>{{numero}}</strong> a été accepté. Nous allons procéder à la mise en œuvre.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Devis expiré',
                'type' => 'relance',
                'objet' => 'Devis {{numero}} expiré - {{entreprise}}',
                'contenu' => '<h2>Devis expiré</h2><p>Bonjour {{client_nom}},</p><p>Le devis <strong>{{numero}}</strong> a expiré le <strong>{{date_validite}}</strong>.</p><p>Souhaitez-vous que nous vous établissions un nouveau devis ?</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero', 'client_nom', 'date_validite', 'entreprise'],
                'actif' => true,
            ],
            [
                'nom' => 'Devis converti en OT',
                'type' => 'confirmation',
                'objet' => 'Devis {{numero_devis}} converti en OT {{numero_ot}}',
                'contenu' => '<h2>Conversion en ordre de travail</h2><p>Bonjour {{client_nom}},</p><p>Le devis <strong>{{numero_devis}}</strong> a été converti en ordre de travail <strong>{{numero_ot}}</strong>.</p><p>Les travaux seront planifiés prochainement.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['numero_devis', 'numero_ot', 'client_nom', 'entreprise'],
                'actif' => true,
            ],

            // ── Client ──
            [
                'nom' => 'Bienvenue nouveau client',
                'type' => 'notification',
                'objet' => 'Bienvenue chez {{entreprise}}, {{client_nom}} !',
                'contenu' => '<h2>Bienvenue !</h2><p>Bonjour {{client_nom}},</p><p>Nous sommes ravis de vous compter parmi nos clients.</p><p>Notre équipe est à votre disposition pour tout besoin logistique.</p><p>N\'hésitez pas à nous contacter.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['client_nom', 'entreprise'],
                'actif' => true,
            ],

            // ── Crédit ──
            [
                'nom' => 'Rappel échéance crédit',
                'type' => 'relance',
                'objet' => 'Rappel : Échéance de crédit approche - {{entreprise}}',
                'contenu' => '<h2>Rappel d\'échéance</h2><p>Bonjour {{client_nom}},</p><p>Nous vous rappelons qu\'une échéance de crédit de <strong>{{montant_echeance}} FCFA</strong> arrive à terme le <strong>{{date_echeance}}</strong>.</p><p>Merci de prévoir le règlement.</p><p>Cordialement,<br>{{entreprise}}</p>',
                'variables' => ['client_nom', 'montant_echeance', 'date_echeance', 'entreprise'],
                'actif' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::firstOrCreate(
                ['nom' => $template['nom']],
                $template
            );
        }

        $this->command->info('Created ' . count($templates) . ' email templates.');
    }
}
