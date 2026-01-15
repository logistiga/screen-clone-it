<?php

namespace App\Services;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\Client;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Models\CreditBancaire;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class NotificationService
{
    /**
     * Configurer le mailer SMTP depuis les paramètres de la base de données
     */
    private function configureMailer(): array
    {
        $smtpHost = Setting::get('mail.smtp_host');
        $smtpPort = Setting::get('mail.smtp_port');
        $smtpUser = Setting::get('mail.smtp_user');
        $smtpPassword = Setting::get('mail.smtp_password');
        $ssl = Setting::get('mail.ssl', true);
        $fromName = Setting::get('mail.from_name', 'Logistiga');
        $fromEmail = Setting::get('mail.from_address', 'contact@logistiga.com');
        $signature = Setting::get('mail.signature', '');

        // Log diagnostic des paramètres SMTP (sans le mot de passe)
        Log::debug('Configuration SMTP chargée', [
            'host' => $smtpHost,
            'port' => $smtpPort,
            'user' => $smtpUser,
            'password_set' => !empty($smtpPassword),
            'ssl' => $ssl,
            'from_email' => $fromEmail,
            'from_name' => $fromName,
        ]);

        // Configurer dynamiquement le mailer si les paramètres sont définis
        if ($smtpHost && $smtpPort && $smtpUser && $smtpPassword) {
            Config::set('mail.mailers.smtp.host', $smtpHost);
            Config::set('mail.mailers.smtp.port', (int) $smtpPort);
            Config::set('mail.mailers.smtp.username', $smtpUser);
            Config::set('mail.mailers.smtp.password', $smtpPassword);
            Config::set('mail.mailers.smtp.encryption', $ssl ? 'tls' : null);
            Config::set('mail.from.address', $fromEmail);
            Config::set('mail.from.name', $fromName);
            
            Log::info('Mailer SMTP configuré dynamiquement depuis la base de données');
        } else {
            Log::warning('Configuration SMTP incomplète, utilisation des valeurs par défaut', [
                'missing' => array_filter([
                    'host' => empty($smtpHost) ? 'manquant' : null,
                    'port' => empty($smtpPort) ? 'manquant' : null,
                    'user' => empty($smtpUser) ? 'manquant' : null,
                    'password' => empty($smtpPassword) ? 'manquant' : null,
                ]),
            ]);
        }

        return [
            'from_name' => $fromName,
            'from_email' => $fromEmail,
            'signature' => $signature,
        ];
    }

    /**
     * Envoyer une facture par email
     */
    public function envoyerFacture(Facture $facture, ?string $emailDestinataire = null, ?string $message = null): bool
    {
        $mailConfig = $this->configureMailer();
        
        // Charger le client si pas déjà chargé
        $facture->loadMissing('client');
        $client = $facture->client;
        
        // Déterminer l'email destinataire
        $email = $emailDestinataire;
        if (!$email && $client) {
            $email = $client->email;
        }

        if (!$email) {
            Log::warning("Impossible d'envoyer la facture {$facture->numero}: pas d'email", [
                'facture_id' => $facture->id,
                'client_id' => $facture->client_id,
                'client_exists' => (bool) $client,
            ]);
            return false;
        }

        try {
            Mail::send('emails.facture', [
                'facture' => $facture,
                'client' => $client,
                'message_personnalise' => $message ?? '',
                'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $facture, $mailConfig) {
                $mail->to($email)
                    ->subject("Facture N° {$facture->numero}")
                    ->from($mailConfig['from_email'], $mailConfig['from_name']);
            });


            // Mettre à jour le statut et la date d'envoi
            $facture->forceFill([
                'statut' => 'envoye',
                'date_envoi' => now(),
            ])->save();

            Log::info("Facture {$facture->numero} envoyée avec succès à {$email}");
            return true;
        } catch (\Throwable $e) {
            // Ne pas logger ici, le controller s'en charge
            throw $e;
        }
    }

    /**
     * Envoyer un devis par email
     */
    public function envoyerDevis(Devis $devis, ?string $emailDestinataire = null, ?string $message = null): bool
    {
        $mailConfig = $this->configureMailer();
        
        // Charger le client si pas déjà chargé
        $devis->loadMissing('client');
        $client = $devis->client;
        
        // Déterminer l'email destinataire
        $email = $emailDestinataire;
        if (!$email && $client) {
            $email = $client->email;
        }

        if (!$email) {
            Log::warning("Impossible d'envoyer le devis {$devis->numero}: pas d'email", [
                'devis_id' => $devis->id,
                'client_id' => $devis->client_id,
                'client_exists' => (bool) $client,
            ]);
            return false;
        }

        try {
            // Log pour debug uniquement
            if (config('app.debug')) {
                Log::info('Envoi devis email - payload', [
                    'devis_id' => $devis->id,
                    'devis_numero' => $devis->numero,
                    'client_exists' => (bool) $client,
                    'email_destinataire' => $email,
                    'date_creation' => $devis->date_creation,
                    'date_validite' => $devis->date_validite,
                    'tva' => $devis->tva,
                    'montant_ht' => $devis->montant_ht,
                    'montant_ttc' => $devis->montant_ttc,
                ]);
            }

            Mail::send('emails.devis', [
                'devis' => $devis,
                'client' => $client,
                'message_personnalise' => $message ?? '',
                'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $devis, $mailConfig) {
                $mail->to($email)
                    ->subject("Devis N° {$devis->numero}")
                    ->from($mailConfig['from_email'], $mailConfig['from_name']);
            });


            // Mettre à jour le statut et la date d'envoi
            $devis->forceFill([
                'statut' => 'envoye',
                'date_envoi' => now(),
            ])->save();

            Log::info("Devis {$devis->numero} envoyé avec succès à {$email}");
            return true;
        } catch (\Throwable $e) {
            // Ne pas logger ici, le controller s'en charge
            throw $e;
        }
    }

    /**
     * Envoyer un ordre de travail par email
     */
    public function envoyerOrdreTravail(OrdreTravail $ordre, ?string $emailDestinataire = null, ?string $message = null): bool
    {
        $mailConfig = $this->configureMailer();
        
        // Charger le client si pas déjà chargé
        $ordre->loadMissing('client');
        $client = $ordre->client;
        
        // Déterminer l'email destinataire
        $email = $emailDestinataire;
        if (!$email && $client) {
            $email = $client->email;
        }

        if (!$email) {
            Log::warning("Impossible d'envoyer l'ordre {$ordre->numero}: pas d'email", [
                'ordre_id' => $ordre->id,
                'client_id' => $ordre->client_id,
                'client_exists' => (bool) $client,
            ]);
            return false;
        }

        try {
            Mail::send('emails.ordre-travail', [
                'ordre' => $ordre,
                'client' => $client,
                'message_personnalise' => $message ?? '',
                'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $ordre, $mailConfig) {
                $mail->to($email)
                    ->subject("Ordre de Travail N° {$ordre->numero}")
                    ->from($mailConfig['from_email'], $mailConfig['from_name']);
            });

            Log::info("Ordre de travail {$ordre->numero} envoyé à {$email}");
            return true;
        } catch (\Throwable $e) {
            // Ne pas logger ici, le controller s'en charge
            throw $e;
        }
    }

    /**
     * Envoyer une confirmation de paiement
     */
    public function envoyerConfirmationPaiement(Paiement $paiement, ?string $emailDestinataire = null): bool
    {
        $mailConfig = $this->configureMailer();
        
        $paiement->loadMissing(['facture.client', 'ordre.client']);
        $facture = $paiement->facture;
        $ordre = $paiement->ordre;
        $client = $facture?->client ?? $ordre?->client;
        
        $email = $emailDestinataire;
        if (!$email && $client) {
            $email = $client->email;
        }

        if (!$email) {
            Log::warning("Impossible d'envoyer la confirmation de paiement: pas d'email", [
                'paiement_id' => $paiement->id,
            ]);
            return false;
        }

        try {
            Mail::send('emails.confirmation-paiement', [
                'paiement' => $paiement,
                'facture' => $facture,
                'ordre' => $ordre,
                'client' => $client,
                'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $paiement, $mailConfig) {
                $mail->to($email)
                    ->subject("Confirmation de paiement - {$paiement->reference}")
                    ->from($mailConfig['from_email'], $mailConfig['from_name']);
            });

            Log::info("Confirmation de paiement envoyée à {$email}");
            return true;
        } catch (\Throwable $e) {
            // Ne pas logger ici, le controller s'en charge
            throw $e;
        }
    }

    /**
     * Envoyer un rappel de facture impayée
     */
    public function envoyerRappelFacture(Facture $facture, int $numeroRappel = 1): bool
    {
        $mailConfig = $this->configureMailer();
        
        $facture->loadMissing('client');
        $client = $facture->client;
        
        $email = $client?->email;

        if (!$email) {
            Log::warning("Impossible d'envoyer le rappel pour facture {$facture->numero}: pas d'email", [
                'facture_id' => $facture->id,
                'client_exists' => (bool) $client,
            ]);
            return false;
        }

        $niveauUrgence = $this->getNiveauUrgence($numeroRappel);

        try {
            Mail::send('emails.rappel-facture', [
                'facture' => $facture,
                'client' => $client,
                'numero_rappel' => $numeroRappel,
                'niveau_urgence' => $niveauUrgence,
                'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $facture, $numeroRappel, $mailConfig) {
                $mail->to($email)
                    ->subject("Rappel N°{$numeroRappel} - Facture {$facture->numero} impayée")
                    ->from($mailConfig['from_email'], $mailConfig['from_name']);
            });

            // Enregistrer le rappel
            $facture->increment('nombre_rappels');
            $facture->update(['date_dernier_rappel' => now()]);

            Log::info("Rappel {$numeroRappel} envoyé pour facture {$facture->numero}");
            return true;
        } catch (\Throwable $e) {
            // Ne pas logger ici, le controller s'en charge
            throw $e;
        }
    }

    /**
     * Envoyer les rappels automatiques pour les factures en retard
     */
    public function envoyerRappelsAutomatiques(): array
    {
        $resultats = [
            'envoyes' => 0,
            'echecs' => 0,
            'details' => [],
        ];

        // Factures impayées depuis plus de 30 jours
        $facturesEnRetard = Facture::where('statut', '!=', 'paye')
            ->where('statut', '!=', 'annule')
            ->where('date_echeance', '<', now())
            ->where(function ($query) {
                $query->whereNull('date_dernier_rappel')
                    ->orWhere('date_dernier_rappel', '<', now()->subDays(7));
            })
            ->with('client')
            ->get();

        foreach ($facturesEnRetard as $facture) {
            $numeroRappel = ($facture->nombre_rappels ?? 0) + 1;
            
            if ($numeroRappel > 3) {
                continue; // Maximum 3 rappels
            }

            try {
                $ok = $this->envoyerRappelFacture($facture, $numeroRappel);
            } catch (\Throwable $e) {
                $ok = false;
                Log::error("Rappel auto échoué pour facture {$facture->numero}", [
                    'facture_id' => $facture->id,
                    'message' => $e->getMessage(),
                ]);
            }

            if ($ok) {
                $resultats['envoyes']++;
                $resultats['details'][] = [
                    'facture' => $facture->numero,
                    'client' => $facture->client->raison_sociale ?? $facture->client->nom_complet ?? 'N/A',
                    'rappel' => $numeroRappel,
                    'statut' => 'envoyé',
                ];
            } else {
                $resultats['echecs']++;
                $resultats['details'][] = [
                    'facture' => $facture->numero,
                    'client' => $facture->client->raison_sociale ?? $facture->client->nom_complet ?? 'N/A',
                    'rappel' => $numeroRappel,
                    'statut' => 'échec',
                ];
            }
        }

        return $resultats;
    }

    /**
     * Envoyer une alerte d'échéance de crédit
     */
    public function envoyerAlerteEcheanceCredit(CreditBancaire $credit, int $joursRestants): bool
    {
        $utilisateursAdmin = User::where('role', 'admin')->get();

        if ($utilisateursAdmin->isEmpty()) {
            Log::warning("Pas d'administrateur pour recevoir l'alerte crédit");
            return false;
        }

        try {
            foreach ($utilisateursAdmin as $admin) {
                Mail::send('emails.alerte-echeance-credit', [
                    'credit' => $credit,
                    'jours_restants' => $joursRestants,
                ], function ($mail) use ($admin, $credit, $joursRestants) {
                    $mail->to($admin->email)
                        ->subject("⚠️ Échéance crédit dans {$joursRestants} jours - {$credit->reference}")
                        ->from(config('mail.from.address'), config('mail.from.name'));
                });
            }

            Log::info("Alerte échéance crédit {$credit->reference} envoyée");
            return true;
        } catch (\Throwable $e) {
            Log::error("Erreur envoi alerte crédit: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un récapitulatif quotidien aux administrateurs
     */
    public function envoyerRecapitulatifQuotidien(): bool
    {
        $utilisateursAdmin = User::where('role', 'admin')->get();

        if ($utilisateursAdmin->isEmpty()) {
            return false;
        }

        $stats = $this->getStatistiquesQuotidiennes();

        try {
            foreach ($utilisateursAdmin as $admin) {
                Mail::send('emails.recapitulatif-quotidien', [
                    'stats' => $stats,
                    'date' => now()->format('d/m/Y'),
                ], function ($mail) use ($admin) {
                    $mail->to($admin->email)
                        ->subject("📊 Récapitulatif quotidien - " . now()->format('d/m/Y'))
                        ->from(config('mail.from.address'), config('mail.from.name'));
                });
            }

            Log::info("Récapitulatif quotidien envoyé");
            return true;
        } catch (\Throwable $e) {
            Log::error("Erreur envoi récapitulatif: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Notifier un nouveau client
     */
    public function notifierNouveauClient(Client $client): bool
    {
        $email = $client->email;

        if (!$email) {
            return false;
        }

        try {
            Mail::send('emails.bienvenue-client', [
                'client' => $client,
            ], function ($mail) use ($email, $client) {
                $mail->to($email)
                    ->subject("Bienvenue chez " . config('app.name'))
                    ->from(config('mail.from.address'), config('mail.from.name'));
            });

            Log::info("Email de bienvenue envoyé à {$email}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Erreur envoi email bienvenue: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un email personnalisé
     */
    public function envoyerEmailPersonnalise(
        string $destinataire,
        string $sujet,
        string $contenu,
        ?array $pieces_jointes = null
    ): bool {
        try {
            Mail::send('emails.personnalise', [
                'contenu' => $contenu,
            ], function ($mail) use ($destinataire, $sujet, $pieces_jointes) {
                $mail->to($destinataire)
                    ->subject($sujet)
                    ->from(config('mail.from.address'), config('mail.from.name'));

                if ($pieces_jointes) {
                    foreach ($pieces_jointes as $piece) {
                        $mail->attach($piece['path'], [
                            'as' => $piece['name'] ?? null,
                            'mime' => $piece['mime'] ?? null,
                        ]);
                    }
                }
            });

            Log::info("Email personnalisé envoyé à {$destinataire}");
            return true;
        } catch (\Throwable $e) {
            Log::error("Erreur envoi email personnalisé: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtenir le niveau d'urgence selon le numéro de rappel
     */
    protected function getNiveauUrgence(int $numeroRappel): string
    {
        return match ($numeroRappel) {
            1 => 'normal',
            2 => 'modere',
            3 => 'urgent',
            default => 'critique',
        };
    }

    /**
     * Obtenir les statistiques quotidiennes
     */
    protected function getStatistiquesQuotidiennes(): array
    {
        $aujourdHui = now()->startOfDay();

        return [
            'factures_creees' => Facture::whereDate('created_at', $aujourdHui)->count(),
            'factures_payees' => Facture::whereDate('updated_at', $aujourdHui)
                ->where('statut', 'paye')
                ->count(),
            'montant_encaisse' => Paiement::whereDate('date_paiement', $aujourdHui)->sum('montant'),
            'devis_crees' => Devis::whereDate('created_at', $aujourdHui)->count(),
            'ordres_crees' => OrdreTravail::whereDate('created_at', $aujourdHui)->count(),
            'factures_en_retard' => Facture::where('statut', '!=', 'paye')
                ->where('statut', '!=', 'annule')
                ->where('date_echeance', '<', now())
                ->count(),
            'total_creances' => Facture::where('statut', '!=', 'paye')
                ->where('statut', '!=', 'annule')
                ->sum('reste_a_payer'),
        ];
    }
}
