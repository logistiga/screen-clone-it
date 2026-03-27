<?php

namespace App\Services\Export;

use App\Models\MouvementCaisse;
use App\Models\Banque;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Collection;

/**
 * Export de la caisse globale (CSV + PDF)
 */
class ExportCaisseGlobaleService
{
    use ExportHelpersTrait;

    public function exportCaisseGlobaleCSV(array $filters = []): string
    {
        $data = $this->getCaisseGlobaleData($filters);
        
        $headers = ['Date', 'Heure', 'Source', 'Banque', 'Type', 'Catégorie', 'Description', 'Client/Bénéficiaire', 'N° Document', 'Entrée', 'Sortie', 'Solde'];

        $solde = 0;
        $rows = [];
        
        if ($filters['include_summary'] ?? true) {
            $rows[] = ['=== RÉSUMÉ CAISSE GLOBALE ===', '', '', '', '', '', '', '', '', '', '', ''];
            $rows[] = ['Période:', $filters['date_debut'] . ' au ' . $filters['date_fin'], '', '', '', '', '', '', '', '', '', ''];
            $rows[] = ['', '', '', '', '', '', '', '', '', '', '', ''];
            $rows[] = ['Source', '', '', '', '', '', '', '', 'Entrées', 'Sorties', 'Solde', ''];
            
            if (($filters['source'] === 'all' || $filters['source'] === 'caisse')) {
                $rows[] = ['Caisse (Espèces)', '', '', '', '', '', '', '', 
                    number_format($data['totals']['caisse_entrees'], 0, ',', ' '),
                    number_format($data['totals']['caisse_sorties'], 0, ',', ' '),
                    number_format($data['totals']['caisse_entrees'] - $data['totals']['caisse_sorties'], 0, ',', ' '),
                    ''
                ];
            }
            if (($filters['source'] === 'all' || $filters['source'] === 'banque')) {
                $rows[] = ['Banques', '', '', '', '', '', '', '',
                    number_format($data['totals']['banque_entrees'], 0, ',', ' '),
                    number_format($data['totals']['banque_sorties'], 0, ',', ' '),
                    number_format($data['totals']['banque_entrees'] - $data['totals']['banque_sorties'], 0, ',', ' '),
                    ''
                ];
            }
            $rows[] = ['TOTAL GLOBAL', '', '', '', '', '', '', '',
                number_format($data['totals']['total_entrees'], 0, ',', ' '),
                number_format($data['totals']['total_sorties'], 0, ',', ' '),
                number_format($data['totals']['total_entrees'] - $data['totals']['total_sorties'], 0, ',', ' '),
                ''
            ];
            $rows[] = ['', '', '', '', '', '', '', '', '', '', '', ''];
        }
        
        if ($filters['include_details'] ?? true) {
            $rows[] = ['=== DÉTAIL DES MOUVEMENTS ===', '', '', '', '', '', '', '', '', '', '', ''];
            
            foreach ($data['mouvements'] as $mouvement) {
                $entree = $mouvement->type === 'entree' ? $mouvement->montant : 0;
                $sortie = $mouvement->type === 'sortie' ? $mouvement->montant : 0;
                $solde += ($entree - $sortie);
                
                $clientNom = $mouvement->client 
                    ? ($mouvement->client->raison_sociale ?? $mouvement->client->nom_complet ?? '-')
                    : ($mouvement->beneficiaire ?? '-');
                
                $rows[] = [
                    $mouvement->date ? $mouvement->date->format('d/m/Y') : '-',
                    $mouvement->created_at ? $mouvement->created_at->format('H:i') : '-',
                    $mouvement->source === 'caisse' ? 'Caisse' : 'Banque',
                    $mouvement->banque->nom ?? '-',
                    $mouvement->type === 'entree' ? 'Entrée' : 'Sortie',
                    $mouvement->categorie ?? 'Paiement',
                    $mouvement->description ?? '-',
                    $clientNom,
                    $mouvement->paiement->facture->numero ?? ($mouvement->paiement->ordre->numero ?? '-'),
                    $entree > 0 ? number_format($entree, 0, ',', ' ') : '',
                    $sortie > 0 ? number_format($sortie, 0, ',', ' ') : '',
                    number_format($solde, 0, ',', ' '),
                ];
            }
            
            $rows[] = ['', '', '', '', '', '', '', 'TOTAUX:',
                number_format($data['totals']['total_entrees'], 0, ',', ' '),
                number_format($data['totals']['total_sorties'], 0, ',', ' '),
                number_format($data['totals']['total_entrees'] - $data['totals']['total_sorties'], 0, ',', ' '),
                ''
            ];
        }

        return $this->generateCSV($headers, $rows);
    }

    public function exportCaisseGlobalePDF(array $filters = [])
    {
        $data = $this->getCaisseGlobaleData($filters);
        
        $soldeActuelCaisse = MouvementCaisse::where('source', 'caisse')->where('type', 'entree')->sum('montant')
            - MouvementCaisse::where('source', 'caisse')->where('type', 'sortie')->sum('montant');

        $pdf = Pdf::loadView('pdf.caisse-globale', [
            'mouvements' => $data['mouvements'],
            'totals' => $data['totals'],
            'filters' => $filters,
            'banques' => $data['banques_totals'],
            'generated_at' => now()->format('d/m/Y H:i'),
            'solde_actuel_caisse' => $soldeActuelCaisse,
        ]);
        
        $pdf->setPaper('A4', 'landscape');
        $filename = 'caisse-globale-' . $filters['date_debut'] . '-' . $filters['date_fin'] . '.pdf';
        
        return $pdf->download($filename);
    }

    public function getCaisseGlobaleData(array $filters): array
    {
        $query = MouvementCaisse::with(['client', 'banque', 'paiement.facture', 'paiement.ordre']);

        if (!empty($filters['date_debut'])) $query->where('date', '>=', $filters['date_debut']);
        if (!empty($filters['date_fin'])) $query->where('date', '<=', $filters['date_fin']);
        if (!empty($filters['type']) && $filters['type'] !== 'all') {
            $type = $filters['type'] === 'entrees' ? 'entree' : 'sortie';
            $query->where('type', $type);
        }
        if (!empty($filters['source']) && $filters['source'] !== 'all') $query->where('source', $filters['source']);
        if (!empty($filters['banque_id'])) $query->where('banque_id', $filters['banque_id']);

        $mouvements = $query->orderBy('date', 'asc')->orderBy('created_at', 'asc')->get();

        $caisseEntrees = $mouvements->where('source', 'caisse')->where('type', 'entree')->sum('montant');
        $caisseSorties = $mouvements->where('source', 'caisse')->where('type', 'sortie')->sum('montant');
        $banqueEntrees = $mouvements->where('source', 'banque')->where('type', 'entree')->sum('montant');
        $banqueSorties = $mouvements->where('source', 'banque')->where('type', 'sortie')->sum('montant');

        $banquesTotals = [];
        $mouvementsBanque = $mouvements->where('source', 'banque');
        foreach ($mouvementsBanque->groupBy('banque_id') as $banqueId => $mvts) {
            $banque = Banque::find($banqueId);
            if ($banque) {
                $banquesTotals[] = [
                    'banque_id' => $banqueId,
                    'banque_nom' => $banque->nom,
                    'entrees' => $mvts->where('type', 'entree')->sum('montant'),
                    'sorties' => $mvts->where('type', 'sortie')->sum('montant'),
                    'solde' => $mvts->where('type', 'entree')->sum('montant') - $mvts->where('type', 'sortie')->sum('montant'),
                ];
            }
        }

        return [
            'mouvements' => $mouvements,
            'totals' => [
                'caisse_entrees' => $caisseEntrees,
                'caisse_sorties' => $caisseSorties,
                'banque_entrees' => $banqueEntrees,
                'banque_sorties' => $banqueSorties,
                'total_entrees' => $caisseEntrees + $banqueEntrees,
                'total_sorties' => $caisseSorties + $banqueSorties,
            ],
            'banques_totals' => $banquesTotals,
        ];
    }
}
