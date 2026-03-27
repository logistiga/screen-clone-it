<?php

namespace App\Services\Notification;

use App\Models\Facture;
use App\Models\Devis;
use App\Models\Client;
use App\Models\OrdreTravail;
use App\Models\Paiement;
use App\Models\CreditBancaire;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Rappels automatiques, alertes crédit, récapitulatif quotidien, notifications client, emails personnalisés
 */
class NotificationRappelService
{
    use MailConfigTrait;

    public function envoyerRappelFacture(Facture $facture, int $numeroRappel = 1): bool
    {
        $mailConfig = $this->configureMailer();
        $facture->loadMissing('client');
        $client = $facture->client;
        $email = $client?->email;

        if (!$email) {
            Log::warning("Impossible d'envoyer le rappel pour facture {$facture->numero}: pas d'email");
            return false;
        }

        $niveauUrgence = $this->getNiveauUrgence($numeroRappel);

        try {
            Mail::send('emails.rappel-facture', [
                'facture' => $facture, 'client' => $client,
                'numero_rappel' => $numeroRappel, 'niveau_urgence' => $niveauUrgence,
                'signature' => $mailConfig['signature'],
            ], function ($mail) use ($email, $facture, $numeroRappel, $mailConfig) {
                $mail->to($email)
                    ->subject("Rappel N°{$numeroRappel} - Facture {$facture->numero} impayée")
                    ->from($mailConfig['from_email'], $mailConfig['from_name']);
            });

            $facture->increment('nombre_rappels');
            $facture->update(['date_dernier_rappel' => now()]);
            Log::info("Rappel {$numeroRappel} envoyé pour facture {$facture->numero}");
            return true;
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    public function envoyerRappelsAutomatiques(): array
    {
        $resultats = ['envoyes' => 0, 'echecs' => 0, 'details' => []];

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
            if ($numeroRappel > 3) continue;

            try {
                $ok = $this->envoyerRappelFacture($facture, $numeroRappel);
            } catch (\Throwable $e) {
                $ok = false;
                Log::error("Rappel auto échoué pour facture {$facture->numero}", ['message' => $e->getMessage()]);
            }

            $resultats[$ok ? 'envoyes' : 'echecs']++;
            $resultats['details'][] = [
                'facture' => $facture->numero,
                'client' => $facture->client->raison_sociale ?? $facture->client->nom_complet ?? 'N/A',
                'rappel' => $numeroRappel,
                'statut' => $ok ? 'envoyé' : 'échec',
            ];
        }

        return $resultats;
    }

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
                    'credit' => $credit, 'jours_restants' => $joursRestants,
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

    public function envoyerRecapitulatifQuotidien(): bool
    {
        $utilisateursAdmin = User::where('role', 'admin')->get();
        if ($utilisateursAdmin->isEmpty()) return false;

        $stats = $this->getStatistiquesQuotidiennes();

        try {
            foreach ($utilisateursAdmin as $admin) {
                Mail::send('emails.recapitulatif-quotidien', [
                    'stats' => $stats, 'date' => now()->format('d/m/Y'),
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

    public function notifierNouveauClient(Client $client): bool
    {
        $email = $client->email;
        if (!$email) return false;

        try {
            Mail::send('emails.bienvenue-client', ['client' => $client], function ($mail) use ($email) {
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

    public function envoyerEmailPersonnalise(string $destinataire, string $sujet, string $contenu, ?array $pieces_jointes = null): bool
    {
        try {
            Mail::send('emails.personnalise', ['contenu' => $contenu], function ($mail) use ($destinataire, $sujet, $pieces_jointes) {
                $mail->to($destinataire)->subject($sujet)->from(config('mail.from.address'), config('mail.from.name'));
                if ($pieces_jointes) {
                    foreach ($pieces_jointes as $piece) {
                        $mail->attach($piece['path'], ['as' => $piece['name'] ?? null, 'mime' => $piece['mime'] ?? null]);
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

    protected function getNiveauUrgence(int $numeroRappel): string
    {
        return match ($numeroRappel) {
            1 => 'normal', 2 => 'modere', 3 => 'urgent', default => 'critique',
        };
    }

    protected function getStatistiquesQuotidiennes(): array
    {
        $aujourdHui = now()->startOfDay();
        return [
            'factures_creees' => Facture::whereDate('created_at', $aujourdHui)->count(),
            'factures_payees' => Facture::whereDate('updated_at', $aujourdHui)->where('statut', 'paye')->count(),
            'montant_encaisse' => Paiement::whereDate('date_paiement', $aujourdHui)->sum('montant'),
            'devis_crees' => Devis::whereDate('created_at', $aujourdHui)->count(),
            'ordres_crees' => OrdreTravail::whereDate('created_at', $aujourdHui)->count(),
            'factures_en_retard' => Facture::where('statut', '!=', 'paye')->where('statut', '!=', 'annule')->where('date_echeance', '<', now())->count(),
            'total_creances' => Facture::where('statut', '!=', 'paye')->where('statut', '!=', 'annule')->sum('reste_a_payer'),
        ];
    }
}
