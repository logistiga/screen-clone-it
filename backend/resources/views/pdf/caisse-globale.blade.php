<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Caisse Globale</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 9px; color: #333; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; margin-bottom: 20px; }
        .header h1 { font-size: 20px; margin-bottom: 5px; }
        .header p { font-size: 11px; opacity: 0.9; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 15px; padding: 0 10px; }
        .meta-item { font-size: 9px; color: #666; }
        .summary { margin: 0 10px 20px; }
        .summary h2 { font-size: 12px; color: #1e40af; margin-bottom: 10px; border-bottom: 2px solid #1e40af; padding-bottom: 5px; }
        .summary-grid { display: table; width: 100%; }
        .summary-row { display: table-row; }
        .summary-cell { display: table-cell; padding: 8px; border: 1px solid #e5e7eb; }
        .summary-header { background: #f3f4f6; font-weight: bold; }
        .text-success { color: #16a34a; }
        .text-danger { color: #dc2626; }
        .text-primary { color: #1e40af; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 0 10px; font-size: 8px; }
        th { background: #1e40af; color: white; padding: 6px 4px; text-align: left; font-size: 8px; }
        td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 7px; }
        .badge-caisse { background: #dcfce7; color: #166534; }
        .badge-banque { background: #dbeafe; color: #1e40af; }
        .badge-entree { background: #dcfce7; color: #166534; }
        .badge-sortie { background: #fee2e2; color: #dc2626; }
        .totals-row { background: #f3f4f6; font-weight: bold; }
        .footer { position: fixed; bottom: 10px; left: 10px; right: 10px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 5px; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header" style="display: table; width: 100%; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 15px;">
        <div style="display: table-cell; width: 40%; vertical-align: middle;">
            <img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga" style="height: 50px; max-width: 200px;">
        </div>
        <div style="display: table-cell; width: 60%; text-align: right; vertical-align: middle;">
            <h1 style="font-size: 18px; margin-bottom: 3px;">Rapport de Trésorerie Globale</h1>
            <p style="font-size: 10px; opacity: 0.8;">Période du {{ \Carbon\Carbon::parse($filters['date_debut'])->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($filters['date_fin'])->format('d/m/Y') }}</p>
        </div>
    </div>

    <div class="meta">
        <span class="meta-item">Généré le {{ $generated_at }}</span>
        <span class="meta-item">
            Sources: 
            @if($filters['source'] === 'all') Caisse + Banques
            @elseif($filters['source'] === 'caisse') Caisse uniquement
            @else Banques uniquement
            @endif
        </span>
        <span class="meta-item">
            Type: 
            @if($filters['type'] === 'all') Tous mouvements
            @elseif($filters['type'] === 'entrees') Entrées uniquement
            @else Sorties uniquement
            @endif
        </span>
    </div>

    @if($filters['include_summary'] ?? true)
    <div class="summary">
        <h2>Résumé Financier</h2>
        <table style="margin: 0;">
            <thead>
                <tr>
                    <th>Source</th>
                    <th class="text-right">Entrées</th>
                    <th class="text-right">Sorties</th>
                    <th class="text-right">Solde</th>
                </tr>
            </thead>
            <tbody>
                @if($filters['source'] === 'all' || $filters['source'] === 'caisse')
                <tr>
                    <td><span class="badge badge-caisse">Caisse (Espèces)</span></td>
                    <td class="text-right text-success">+{{ number_format($totals['caisse_entrees'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right text-danger">-{{ number_format($totals['caisse_sorties'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right font-bold">{{ number_format($totals['caisse_entrees'] - $totals['caisse_sorties'], 0, ',', ' ') }} FCFA</td>
                </tr>
                @endif
                @if($filters['source'] === 'all' || $filters['source'] === 'banque')
                <tr>
                    <td><span class="badge badge-banque">Banques</span></td>
                    <td class="text-right text-success">+{{ number_format($totals['banque_entrees'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right text-danger">-{{ number_format($totals['banque_sorties'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right font-bold">{{ number_format($totals['banque_entrees'] - $totals['banque_sorties'], 0, ',', ' ') }} FCFA</td>
                </tr>
                @endif
                <tr class="totals-row">
                    <td class="font-bold">TOTAL GLOBAL</td>
                    <td class="text-right text-success font-bold">+{{ number_format($totals['total_entrees'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right text-danger font-bold">-{{ number_format($totals['total_sorties'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right text-primary font-bold">{{ number_format($totals['total_entrees'] - $totals['total_sorties'], 0, ',', ' ') }} FCFA</td>
                </tr>
            </tbody>
        </table>

        @if(count($banques) > 0)
        <h2 style="margin-top: 15px;">Détail par Banque</h2>
        <table style="margin: 0;">
            <thead>
                <tr>
                    <th>Banque</th>
                    <th class="text-right">Entrées</th>
                    <th class="text-right">Sorties</th>
                    <th class="text-right">Solde</th>
                </tr>
            </thead>
            <tbody>
                @foreach($banques as $banque)
                <tr>
                    <td>{{ $banque['nom'] }}</td>
                    <td class="text-right text-success">+{{ number_format($banque['entrees'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right text-danger">-{{ number_format($banque['sorties'], 0, ',', ' ') }} FCFA</td>
                    <td class="text-right font-bold">{{ number_format($banque['entrees'] - $banque['sorties'], 0, ',', ' ') }} FCFA</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
    </div>
    @endif

    @if($filters['include_details'] ?? true)
    <div class="summary">
        <h2>Détail des Mouvements ({{ count($mouvements) }} opérations)</h2>
    </div>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th>Client/Bénéficiaire</th>
                <th class="text-right">Entrée</th>
                <th class="text-right">Sortie</th>
            </tr>
        </thead>
        <tbody>
            @php $solde = 0; @endphp
            @foreach($mouvements as $mouvement)
            @php
                $entree = $mouvement->type === 'entree' ? $mouvement->montant : 0;
                $sortie = $mouvement->type === 'sortie' ? $mouvement->montant : 0;
                $solde += ($entree - $sortie);
                $clientNom = $mouvement->client ? ($mouvement->client->raison_sociale ?? $mouvement->client->nom_complet ?? '-') : ($mouvement->beneficiaire ?? '-');
            @endphp
            <tr>
                <td>{{ $mouvement->date ? $mouvement->date->format('d/m/Y') : '-' }}</td>
                <td>
                    @if($mouvement->source === 'caisse')
                        <span class="badge badge-caisse">Caisse</span>
                    @else
                        <span class="badge badge-banque">{{ $mouvement->banque->nom ?? 'Banque' }}</span>
                    @endif
                </td>
                <td>
                    @if($mouvement->type === 'entree')
                        <span class="badge badge-entree">Entrée</span>
                    @else
                        <span class="badge badge-sortie">Sortie</span>
                    @endif
                </td>
                <td>{{ $mouvement->categorie ?? 'Paiement' }}</td>
                <td>{{ Str::limit($mouvement->description ?? '-', 30) }}</td>
                <td>{{ Str::limit($clientNom, 20) }}</td>
                <td class="text-right text-success">{{ $entree > 0 ? '+' . number_format($entree, 0, ',', ' ') : '' }}</td>
                <td class="text-right text-danger">{{ $sortie > 0 ? '-' . number_format($sortie, 0, ',', ' ') : '' }}</td>
            </tr>
            @endforeach
            <tr class="totals-row">
                <td colspan="6" class="text-right font-bold">TOTAUX:</td>
                <td class="text-right text-success font-bold">+{{ number_format($totals['total_entrees'], 0, ',', ' ') }}</td>
                <td class="text-right text-danger font-bold">-{{ number_format($totals['total_sorties'], 0, ',', ' ') }}</td>
            </tr>
        </tbody>
    </table>
    @endif

    <div style="margin: 20px 10px 40px; border: 2px solid #1e40af; border-radius: 6px; padding: 12px 20px; text-align: right;">
        <table style="margin: 0; width: auto; float: right; border-collapse: collapse;">
            <tr>
                <td style="font-size: 12px; font-weight: bold; padding-right: 30px; color: #333;">SOLDE ACTUEL DE LA CAISSE :</td>
                <td style="font-size: 14px; font-weight: bold; color: {{ ($solde_actuel_caisse ?? 0) >= 0 ? '#16a34a' : '#dc2626' }};">
                    {{ number_format($solde_actuel_caisse ?? 0, 0, ',', ' ') }} FCFA
                </td>
            </tr>
        </table>
        <div style="clear: both;"></div>
    </div>

    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
