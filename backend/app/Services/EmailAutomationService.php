<?php

namespace App\Services;

use App\Models\EmailAutomation;
use App\Models\EmailTemplate;
use App\Models\Devis;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;

class EmailAutomationService
{
    /**
     * Déclencher les automatisations pour un événement
     */
    public function trigger(string $declencheur, $entity): void
    {
        $automations = EmailAutomation::with('template')
            ->actif()
            ->forDeclencheur($declencheur)
            ->orderBy('delai')
            ->get();

        foreach ($automations as $automation) {
            $this->scheduleEmail($automation, $entity);
        }
    }

    /**
     * Planifier l'envoi d'un email
     */
    protected function scheduleEmail(EmailAutomation $automation, $entity): void
    {
        if ($automation->isImmediate()) {
            $this->sendEmail($automation, $entity);
        } else {
            // Utiliser le système de jobs de Laravel pour les emails différés
            $delay = $automation->delai_en_secondes;
            
            // Log pour le suivi
            Log::info("Email automation scheduled", [
                'automation_id' => $automation->id,
                'entity_type' => get_class($entity),
                'entity_id' => $entity->id,
                'delay_seconds' => $delay,
            ]);

            // Dans un environnement de production, utiliser dispatch()->delay()
            // Pour l'instant, on log simplement la planification
        }
    }

    /**
     * Envoyer un email automatisé
     */
    public function sendEmail(EmailAutomation $automation, $entity): bool
    {
        $template = $automation->template;
        
        if (!$template || !$template->actif) {
            Log::warning("Template inactive or missing for automation", [
                'automation_id' => $automation->id,
            ]);
            return false;
        }

        $data = $this->extractEntityData($entity);
        $rendered = $template->render($data);
        
        $email = $this->getEntityEmail($entity);
        
        if (!$email) {
            Log::warning("No email found for entity", [
                'automation_id' => $automation->id,
                'entity_type' => get_class($entity),
                'entity_id' => $entity->id,
            ]);
            return false;
        }

        try {
            $fromName = Setting::get('mail.from_name', config('mail.from.name'));
            $fromAddress = Setting::get('mail.from_address', config('mail.from.address'));

            Mail::raw($rendered['contenu'], function ($mail) use ($email, $rendered, $fromName, $fromAddress) {
                $mail->to($email)
                    ->subject($rendered['objet'])
                    ->from($fromAddress, $fromName);
            });

            Log::info("Automated email sent", [
                'automation_id' => $automation->id,
                'template_id' => $template->id,
                'to' => $email,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send automated email", [
                'automation_id' => $automation->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Extraire les données d'une entité pour le template
     */
    protected function extractEntityData($entity): array
    {
        $data = [
            'nom_entreprise' => Setting::get('mail.from_name', 'LOJISTIGA'),
            'signature' => Setting::get('mail.signature', "L'équipe LOJISTIGA"),
        ];

        if ($entity instanceof Devis) {
            $data = array_merge($data, [
                'numero_devis' => $entity->numero,
                'nom_client' => $entity->client->raison_sociale ?? $entity->client->nom_complet,
                'montant_ht' => number_format($entity->montant_ht, 0, ',', ' ') . ' FCFA',
                'montant_ttc' => number_format($entity->montant_ttc, 0, ',', ' ') . ' FCFA',
                'date_validite' => $entity->date_validite?->format('d/m/Y'),
            ]);
        } elseif ($entity instanceof Facture) {
            $data = array_merge($data, [
                'numero_facture' => $entity->numero,
                'nom_client' => $entity->client->raison_sociale ?? $entity->client->nom_complet,
                'montant_ht' => number_format($entity->montant_ht, 0, ',', ' ') . ' FCFA',
                'montant_ttc' => number_format($entity->montant_ttc, 0, ',', ' ') . ' FCFA',
                'date_echeance' => $entity->date_echeance?->format('d/m/Y'),
                'jours_retard' => $entity->date_echeance && $entity->date_echeance->isPast() 
                    ? $entity->date_echeance->diffInDays(now()) 
                    : 0,
            ]);
        } elseif ($entity instanceof OrdreTravail) {
            $data = array_merge($data, [
                'numero_ordre' => $entity->numero,
                'nom_client' => $entity->client->raison_sociale ?? $entity->client->nom_complet,
                'type_travail' => $entity->type_travail ?? 'Non spécifié',
                'numero_conteneur' => $entity->numero_conteneur ?? 'N/A',
                'date_prevue' => $entity->date_prevue?->format('d/m/Y'),
                'date_fin' => $entity->date_fin?->format('d/m/Y'),
            ]);
        } elseif ($entity instanceof Paiement) {
            $facture = $entity->facture;
            $data = array_merge($data, [
                'numero_facture' => $facture->numero,
                'nom_client' => $facture->client->raison_sociale ?? $facture->client->nom_complet,
                'montant_paye' => number_format($entity->montant, 0, ',', ' ') . ' FCFA',
                'mode_paiement' => $entity->mode_paiement ?? 'Non spécifié',
                'date_paiement' => $entity->date_paiement?->format('d/m/Y'),
            ]);
        }

        return $data;
    }

    /**
     * Obtenir l'email du destinataire depuis l'entité
     */
    protected function getEntityEmail($entity): ?string
    {
        return 'omar@logistiga.com';
    }

    /**
     * Déclencher automatisation: Création devis
     */
    public function onDevisCreated(Devis $devis): void
    {
        $this->trigger('creation_devis', $devis);
    }

    /**
     * Déclencher automatisation: Devis accepté
     */
    public function onDevisAccepted(Devis $devis): void
    {
        $this->trigger('devis_accepte', $devis);
    }

    /**
     * Déclencher automatisation: Devis expiré
     */
    public function onDevisExpired(Devis $devis): void
    {
        $this->trigger('devis_expire', $devis);
    }

    /**
     * Déclencher automatisation: Création ordre
     */
    public function onOrdreCreated(OrdreTravail $ordre): void
    {
        $this->trigger('creation_ordre', $ordre);
    }

    /**
     * Déclencher automatisation: Ordre terminé
     */
    public function onOrdreTerminated(OrdreTravail $ordre): void
    {
        $this->trigger('ordre_termine', $ordre);
    }

    /**
     * Déclencher automatisation: Création facture
     */
    public function onFactureCreated(Facture $facture): void
    {
        $this->trigger('creation_facture', $facture);
    }

    /**
     * Déclencher automatisation: Facture impayée
     */
    public function onFactureUnpaid(Facture $facture): void
    {
        $this->trigger('facture_impayee', $facture);
    }

    /**
     * Déclencher automatisation: Paiement reçu
     */
    public function onPaiementReceived(Paiement $paiement): void
    {
        $this->trigger('paiement_recu', $paiement);
    }
}
