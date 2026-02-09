<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $titre ?? 'Note de Début' }} - {{ $note->numero }}</title>
    @php
        // Couleurs Logistiga basées sur le logo
        $logistigaRouge = '#E63946';   // Rouge primaire
        $logistigaGris = '#4A4A4A';    // Gris foncé
        $logistigaRougeClair = '#FEE2E8'; // Rouge clair pour badges
        
        // Utiliser les couleurs du logo comme base, avec accent par type
        $couleurPrimaire = $logistigaRouge;
        $couleurAccent = $couleur ?? $logistigaRouge;
        $badgeBg = $badge_bg ?? $logistigaRougeClair;
    @endphp
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            padding: 20px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            border-bottom: 3px solid {{ $couleurPrimaire }};
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header-left {
            display: table-cell;
            width: 40%;
            vertical-align: middle;
        }
        .header-left img { height: 60px; }
        .header-right {
            display: table-cell;
            width: 60%;
            vertical-align: middle;
            text-align: right;
        }
        .doc-title {
            font-size: 18px;
            font-weight: bold;
            color: {{ $couleurPrimaire }};
            text-transform: uppercase;
        }
        .doc-numero {
            font-size: 14px;
            font-weight: bold;
            margin-top: 3px;
        }
        .doc-date {
            font-size: 10px;
            color: #888;
            margin-top: 3px;
        }
        .type-badge {
            display: inline-block;
            background-color: {{ $badgeBg }};
            color: {{ $couleurAccent }};
            padding: 4px 12px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 10px;
            margin-top: 5px;
        }

        /* Info boxes */
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .info-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 10px;
        }
        .info-box h3 {
            font-size: 9px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 6px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            letter-spacing: 0.5px;
        }
        .info-box .name {
            font-size: 13px;
            font-weight: bold;
            color: {{ $couleurPrimaire }};
        }
        .info-box p { margin: 2px 0; font-size: 10px; }

        /* Details table */
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .details-table th {
            background-color: #f3f4f6;
            padding: 8px 10px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            border-bottom: 2px solid #d1d5db;
        }
        .details-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-table .label {
            width: 40%;
            color: #6b7280;
            font-size: 10px;
        }
        .details-table .value {
            font-weight: 600;
            font-size: 10px;
        }

        /* Lignes table (multi-conteneurs) */
        .lignes-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
        }
        .lignes-table th {
            background: #f3f4f6;
            font-weight: 600;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 6px 8px;
            border-bottom: 2px solid #d1d5db;
        }
        .lignes-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .lignes-table .row-alt { background: #f9fafb; }
        .lignes-table .row-total {
            background: #fef2f2;
            font-weight: bold;
        }

        /* Totals */
        .totals-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 12px;
            margin-bottom: 20px;
        }
        .totals-table { width: 100%; }
        .totals-table td { padding: 5px 0; font-size: 10px; }
        .totals-table .label { color: #6b7280; }
        .totals-table .value { text-align: right; font-weight: 600; }
        .totals-table .total-row {
            border-top: 2px solid {{ $couleur ?? '#dc2626' }};
        }
        .totals-table .total-row .label {
            color: {{ $couleur ?? '#dc2626' }};
            font-weight: bold;
            font-size: 12px;
        }
        .totals-table .total-row .value {
            color: {{ $couleur ?? '#dc2626' }};
            font-size: 14px;
        }
        .totals-table .paye-row .value { color: #16a34a; }
        .totals-table .reste-row .value { color: #dc2626; font-size: 12px; }

        /* Bank info */
        .bank-info {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 20px;
        }
        .bank-info h3 {
            font-size: 9px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 8px;
        }
        .bank-grid { display: table; width: 100%; }
        .bank-item { display: table-cell; width: 50%; }
        .bank-item .bname { font-weight: bold; font-size: 10px; }
        .bank-item .bnumber { color: #666; font-size: 9px; }

        /* Signatures */
        .signatures {
            display: table;
            width: 100%;
            margin-top: 30px;
        }
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 0 20px;
        }
        .signature-box .stitle {
            font-weight: bold;
            margin-bottom: 40px;
            font-size: 10px;
        }
        .signature-box .sline {
            border-top: 1px dashed #999;
            padding-top: 5px;
            color: #666;
            font-size: 8px;
        }

        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 8px;
            color: #6b7280;
        }
        .footer strong { color: #555; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Section specifique */
        .section-specific {
            background: {{ $badge_bg ?? '#fee2e2' }};
            border-left: 3px solid {{ $couleur ?? '#dc2626' }};
            padding: 8px 12px;
            margin-bottom: 15px;
            font-size: 10px;
        }
        .section-specific strong { color: {{ $couleur ?? '#dc2626' }}; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga">
        </div>
        <div class="header-right">
            <div class="doc-title">{{ $titre }}</div>
            <div class="doc-numero">{{ $note->numero }}</div>
            <div class="doc-date">Date: {{ $note->date_creation ? $note->date_creation->format('d/m/Y') : now()->format('d/m/Y') }}</div>
            <div class="type-badge">{{ $type_label }}</div>
        </div>
    </div>

    <!-- Émetteur / Client -->
    <div class="info-grid">
        <div class="info-box">
            <h3>Émetteur</h3>
            <p class="name">LOGISTIGA SAS</p>
            <p>Owendo SETRAG – GABON</p>
            <p>Tel: (+241) 011 70 14 35</p>
            <p>Email: info@logistiga.com</p>
        </div>
        <div class="info-box">
            <h3>Client</h3>
            <p class="name">{{ $client->raison_sociale ?? $client->nom ?? $client->nom_complet ?? '-' }}</p>
            @if($client->adresse)<p>{{ $client->adresse }}</p>@endif
            @if($client->telephone)<p>Tel: {{ $client->telephone }}</p>@endif
            @if($client->email)<p>Email: {{ $client->email }}</p>@endif
        </div>
    </div>

    {{-- Section spécifique selon le type --}}
    @if($note->type === 'detention' || $note->type === 'Detention')
        <div class="section-specific">
            <strong>NOTE DE DÉTENTION</strong> — Frais de détention de conteneur au-delà de la période de franchise.
            @if($note->jours_franchise)
                Franchise : {{ $note->jours_franchise }} jours.
            @endif
        </div>
    @elseif($note->type === 'ouverture_port' || $note->type === 'Ouverture Port')
        <div class="section-specific">
            <strong>NOTE D'OUVERTURE DE PORT</strong> — Frais relatifs à l'ouverture et aux opérations portuaires.
        </div>
    @elseif($note->type === 'reparation' || $note->type === 'Reparation')
        <div class="section-specific">
            <strong>NOTE DE RÉPARATION</strong> — Frais de réparation de conteneur.
        </div>
    @elseif($note->type === 'relache' || $note->type === 'Relache')
        <div class="section-specific">
            <strong>NOTE DE RELÂCHE</strong> — Frais de relâche conteneur.
        </div>
    @endif

    <!-- Details de l'opération -->
    <table class="details-table">
        <thead>
            <tr><th colspan="2">Détails de l'opération</th></tr>
        </thead>
        <tbody>
            @if($note->conteneur_numero)
            <tr><td class="label">N° Conteneur</td><td class="value">{{ $note->conteneur_numero }}</td></tr>
            @endif
            @if($note->conteneur_taille)
            <tr><td class="label">Taille</td><td class="value">{{ $note->conteneur_taille }}</td></tr>
            @endif
            @if($note->bl_numero || $note->numero_bl)
            <tr><td class="label">N° BL</td><td class="value">{{ $note->bl_numero ?? $note->numero_bl }}</td></tr>
            @endif
            @if($note->navire)
            <tr><td class="label">Navire</td><td class="value">{{ $note->navire }}</td></tr>
            @endif
            @if($note->armateur)
            <tr><td class="label">Armateur</td><td class="value">{{ $note->armateur->nom ?? '-' }}</td></tr>
            @endif
            @if($note->transitaire)
            <tr><td class="label">Transitaire</td><td class="value">{{ $note->transitaire->nom ?? '-' }}</td></tr>
            @endif
            @if($note->date_debut || $note->date_debut_stockage)
            <tr><td class="label">Date de début</td><td class="value">{{ ($note->date_debut ?? $note->date_debut_stockage)?->format('d/m/Y') }}</td></tr>
            @endif
            @if($note->date_fin || $note->date_fin_stockage)
            <tr><td class="label">Date de fin</td><td class="value">{{ ($note->date_fin ?? $note->date_fin_stockage)?->format('d/m/Y') }}</td></tr>
            @endif
            @if($note->nombre_jours || $note->jours_stockage)
            <tr><td class="label">Nombre de jours</td><td class="value">{{ $note->nombre_jours ?? $note->jours_stockage }} jours</td></tr>
            @endif
            @if($note->tarif_journalier)
            <tr><td class="label">Tarif journalier</td><td class="value">{{ number_format($note->tarif_journalier, 0, ',', ' ') }} FCFA</td></tr>
            @endif
            @if($note->description)
            <tr><td class="label">Description</td><td class="value">{{ $note->description }}</td></tr>
            @endif
            @if($note->observations)
            <tr><td class="label">Observations</td><td class="value">{{ $note->observations }}</td></tr>
            @endif
        </tbody>
    </table>

    {{-- Tableau des lignes (multi-conteneurs pour relâche) --}}
    @if($note->lignes && $note->lignes->count() > 0)
    <table class="lignes-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Conteneur</th>
                <th>BL</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th class="text-center">Jours</th>
                <th class="text-right">Tarif/jour</th>
                <th class="text-right">Montant HT</th>
            </tr>
        </thead>
        <tbody>
            @php $totalLignes = 0; @endphp
            @foreach($note->lignes as $i => $ligne)
            @php $totalLignes += $ligne->montant_ht ?? 0; @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $ligne->conteneur_numero ?? '-' }}</td>
                <td>{{ $ligne->bl_numero ?? '-' }}</td>
                <td>{{ $ligne->date_debut ? $ligne->date_debut->format('d/m/Y') : '-' }}</td>
                <td>{{ $ligne->date_fin ? $ligne->date_fin->format('d/m/Y') : '-' }}</td>
                <td class="text-center">{{ $ligne->nombre_jours ?? '-' }}</td>
                <td class="text-right">{{ $ligne->tarif_journalier ? number_format($ligne->tarif_journalier, 0, ',', ' ') : '-' }}</td>
                <td class="text-right">{{ number_format($ligne->montant_ht ?? 0, 0, ',', ' ') }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="7">TOTAL</td>
                <td class="text-right">{{ number_format($totalLignes, 0, ',', ' ') }} FCFA</td>
            </tr>
        </tbody>
    </table>
    @endif

    <!-- Récapitulatif financier -->
    <div class="totals-box">
        <table class="totals-table">
            @php
                $montantTotal = $note->montant_total ?? $note->montant_ttc ?? $note->montant_ht ?? 0;
                $montantPaye = $note->montant_paye ?? 0;
                $montantAvance = $note->montant_avance ?? 0;
                $reste = $montantTotal - $montantPaye - $montantAvance;
            @endphp
            <tr class="total-row">
                <td class="label">Montant Total</td>
                <td class="value">{{ number_format($montantTotal, 0, ',', ' ') }} FCFA</td>
            </tr>
            @if($montantAvance > 0)
            <tr class="paye-row">
                <td class="label">Avance</td>
                <td class="value">-{{ number_format($montantAvance, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            @if($montantPaye > 0)
            <tr class="paye-row">
                <td class="label">Montant Payé</td>
                <td class="value">-{{ number_format($montantPaye, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            <tr class="reste-row" style="border-top: 1px solid #e2e8f0;">
                <td class="label" style="font-weight: bold;">Reste à Payer</td>
                <td class="value">{{ number_format($reste, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>

    <!-- Coordonnées bancaires -->
    <div class="bank-info">
        <h3>Coordonnées Bancaires</h3>
        <div class="bank-grid">
            <div class="bank-item">
                <div class="bname">BGFI Bank Gabon</div>
                <div class="bnumber">N°: 40003 04140 41041658011 78</div>
            </div>
            <div class="bank-item">
                <div class="bname">UGB</div>
                <div class="bnumber">N°: 40002 00043 90000338691 84</div>
            </div>
        </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-box">
            <div class="stitle">Le Client</div>
            <div class="sline">Signature et cachet</div>
        </div>
        <div class="signature-box">
            <div class="stitle">LOGISTIGA SAS</div>
            <div class="sline">Signature et cachet</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
