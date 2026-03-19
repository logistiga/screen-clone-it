<?php

namespace App\Services;

use App\Models\Prevision;
use App\Models\MouvementCaisse;
use App\Models\Paiement;
use Illuminate\Support\Str;

class PrevisionSyncService
{
    /**
     * Synchroniser les réalisés pour un mois/année donnés
     */
    public function syncMois(int $annee, int $mois): int
    {
        $reelsCaisse = $this->getReelsCaisseParCategorie($annee, $mois);
        $reelsBanque = $this->getReelsBanqueParCategorie($annee, $mois);

        $updated = 0;
        $previsions = Prevision::where('annee', $annee)->where('mois', $mois)->get();

        foreach ($previsions as $prevision) {
            $categorie = $prevision->categorie;
            $type = $prevision->type;

            $sourceEntrees = $type === 'recette' ? 'entrees' : 'sorties';

            // Matching flexible par catégorie
            $realiseCaisse = $this->findMontantByCategorie(
                $reelsCaisse[$sourceEntrees] ?? [],
                $categorie
            );
            $realiseBanque = $this->findMontantByCategorie(
                $reelsBanque[$sourceEntrees] ?? [],
                $categorie
            );

            $prevision->update([
                'realise_caisse' => $realiseCaisse,
                'realise_banque' => $realiseBanque,
            ]);
            $prevision->updateStatut();
            $updated++;
        }

        return $updated;
    }

    /**
     * Sync automatique à partir d'une date (paiement ou mouvement)
     */
    public function syncFromDate(\DateTimeInterface $date): void
    {
        $annee = (int) $date->format('Y');
        $mois = (int) $date->format('n');
        $this->syncMois($annee, $mois);
    }

    /**
     * Matching flexible : insensible à la casse, accents, espaces
     */
    private function findMontantByCategorie(array $reels, string $categorieRecherchee): float
    {
        if (isset($reels[$categorieRecherchee])) {
            return (float) $reels[$categorieRecherchee];
        }

        $normRecherche = $this->normaliserCategorie($categorieRecherchee);

        $totalFlexible = 0;
        foreach ($reels as $cat => $montant) {
            $normCat = $this->normaliserCategorie($cat);

            if ($normCat === $normRecherche) {
                $totalFlexible += (float) $montant;
                continue;
            }

            if (
                $normCat !== ''
                && $normRecherche !== ''
                && (Str::contains($normCat, $normRecherche) || Str::contains($normRecherche, $normCat))
            ) {
                $totalFlexible += (float) $montant;
            }
        }

        if ($totalFlexible > 0) {
            return $totalFlexible;
        }

        foreach ($this->getAliases() as $group) {
            $normGroup = array_map(fn ($alias) => $this->normaliserCategorie($alias), $group);

            if (!in_array($normRecherche, $normGroup, true)) {
                continue;
            }

            $totalAlias = 0;
            foreach ($reels as $cat => $montant) {
                if (in_array($this->normaliserCategorie($cat), $normGroup, true)) {
                    $totalAlias += (float) $montant;
                }
            }

            if ($totalAlias > 0) {
                return $totalAlias;
            }
        }

        return 0;
    }

    /**
     * Normaliser une catégorie pour comparaison
     */
    private function normaliserCategorie(string $categorie): string
    {
        $str = mb_strtolower(trim($categorie));
        $str = str_replace(
            ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ù', 'û', 'ü', 'î', 'ï', 'ô', 'ö', 'ç'],
            ['e', 'e', 'e', 'e', 'a', 'a', 'a', 'u', 'u', 'u', 'i', 'i', 'o', 'o', 'c'],
            $str
        );
        $str = str_replace(['_', '-', '/', '\\'], ' ', $str);
        $str = preg_replace('/[^a-z0-9 ]+/u', ' ', $str);
        $str = preg_replace('/\s+/', ' ', $str);

        return trim($str);
    }

    /**
     * Alias de catégories connues (groupes de noms équivalents)
     */
    private function getAliases(): array
    {
        return [
            ['Facturation clients', 'Paiements clients', 'Paiement client', 'Factures clients'],
            ['Salaires', 'Salaire', 'Paie'],
            ['Carburant', 'Gasoil', 'Essence', 'Fuel'],
            ['Entretien véhicules', 'Entretien vehicules', 'Réparations véhicules'],
            ['Fournitures bureau', 'Fournitures de bureau', 'Fourniture bureau'],
            ['Frais bancaires', 'Frais banque', 'Commissions bancaires'],
            ['Électricité et eau', 'Electricite et eau', 'Eau et électricité', 'SEEG'],
            ['Télécommunications', 'Telecom', 'Téléphone', 'Internet'],
            ['Remboursement crédit', 'Remboursement credit', 'Crédit bancaire', 'remboursement_credit'],
            ['Primes représentants', 'Prime représentant', 'Primes representants', 'Prime representant'],
            ['Prime transitaire', 'Primes transitaires'],
            ['Loyer', 'Loyers'],
            ['Impôts et taxes', 'Impots et taxes', 'Taxes et impots'],
            ['Autres dépenses', 'Autres depenses', 'Divers', 'Autres'],
            ['Autres recettes', 'Autres entrees', 'Divers recettes'],
        ];
    }

    /**
     * Réels caisse par catégorie
     * Sépare les mouvements liés aux paiements (recettes) des autres mouvements (dépenses)
     */
    private function getReelsCaisseParCategorie(int $annee, int $mois): array
    {
        // Mouvements caisse NON liés à un paiement (dépenses manuelles, primes, etc.)
        $mouvements = MouvementCaisse::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where(function ($q) {
                $q->where('source', 'caisse')
                  ->orWhereNull('source');
            })
            ->whereNull('paiement_id')
            ->get();

        $entrees = [];
        $sorties = [];

        foreach ($mouvements as $m) {
            $cat = $m->categorie ?: 'Autres';
            $montant = (float) $m->montant;

            if (in_array(strtolower($m->type), ['entree', 'entrée'])) {
                $entrees[$cat] = ($entrees[$cat] ?? 0) + $montant;
            } else {
                $sorties[$cat] = ($sorties[$cat] ?? 0) + $montant;
            }
        }

        // Paiements en espèces/Mobile Money = entrées caisse clients
        $paiementsEspeces = Paiement::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where(function ($q) {
                $q->where('mode_paiement', 'Espèces')
                  ->orWhere('mode_paiement', 'espèces')
                  ->orWhere('mode_paiement', 'especes')
                  ->orWhere('mode_paiement', 'cash')
                  ->orWhere('mode_paiement', 'Mobile Money');
            })
            ->sum('montant');

        if ($paiementsEspeces > 0) {
            $entrees['Paiements clients'] = ($entrees['Paiements clients'] ?? 0) + (float) $paiementsEspeces;
        }

        return ['entrees' => $entrees, 'sorties' => $sorties];
    }

    /**
     * Réels banque par catégorie
     */
    private function getReelsBanqueParCategorie(int $annee, int $mois): array
    {
        // Paiements par chèque/virement = entrées banque (exclure espèces et Mobile Money)
        $paiementsBanque = Paiement::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where(function ($q) {
                $q->whereNotIn('mode_paiement', ['Espèces', 'espèces', 'especes', 'cash', 'Mobile Money'])
                  ->whereNotNull('mode_paiement');
            })
            ->sum('montant');

        $entrees = [];
        if ($paiementsBanque > 0) {
            $entrees['Paiements clients'] = (float) $paiementsBanque;
        }

        // Sorties banque via mouvements caisse source=banque
        $mouvements = MouvementCaisse::whereYear('date', $annee)
            ->whereMonth('date', $mois)
            ->where('source', 'banque')
            ->where(function ($q) {
                $q->where('type', 'sortie')
                  ->orWhere('type', 'Sortie');
            })
            ->get();

        $sorties = [];
        foreach ($mouvements as $m) {
            $cat = $m->categorie ?: 'Autres dépenses';
            $sorties[$cat] = ($sorties[$cat] ?? 0) + (float) $m->montant;
        }

        return ['entrees' => $entrees, 'sorties' => $sorties];
    }
}
