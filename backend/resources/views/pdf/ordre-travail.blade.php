<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ordre de Travail - {{ $ordre->numero }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            padding: 15px;
        }
        .header {
            display: table;
            width: 100%;
            margin-bottom: 15px;
            border-bottom: 2px solid #1a365d;
            padding-bottom: 10px;
        }
        .header-left {
            display: table-cell;
            width: 40%;
            vertical-align: top;
        }
        .header-center {
            display: table-cell;
            width: 30%;
            text-align: center;
            vertical-align: middle;
        }
        .header-right {
            display: table-cell;
            width: 30%;
            text-align: right;
            vertical-align: top;
        }
        .logo {
            font-size: 20px;
            font-weight: bold;
            color: #1a365d;
        }
        .logo-subtitle {
            font-size: 8px;
            color: #1a365d;
            font-weight: bold;
        }
        .document-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a365d;
            text-transform: uppercase;
        }
        .document-numero {
            font-size: 12px;
            font-weight: bold;
            margin-top: 3px;
        }
        .qr-placeholder {
            font-size: 8px;
            color: #666;
            text-align: right;
        }
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        .info-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 15px;
        }
        .info-box:last-child {
            padding-right: 0;
            padding-left: 15px;
        }
        .info-box h3 {
            font-size: 10px;
            color: #1a365d;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
        }
        .info-box .name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 3px;
        }
        .info-box p {
            font-size: 9px;
            color: #666;
            margin: 2px 0;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .details-table th {
            background-color: #f1f5f9;
            padding: 8px;
            text-align: left;
            font-size: 9px;
            color: #64748b;
            border-bottom: 2px solid #e2e8f0;
        }
        .details-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9px;
        }
        .details-table .label {
            width: 35%;
            color: #64748b;
        }
        .details-table .value {
            font-weight: 600;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .items-table th {
            background-color: #1a365d;
            color: #fff;
            padding: 8px 5px;
            font-size: 9px;
            text-align: left;
            font-weight: bold;
        }
        .items-table th:nth-child(3),
        .items-table th:nth-child(4),
        .items-table th:nth-child(5) {
            text-align: right;
        }
        .items-table td {
            padding: 6px 5px;
            border-bottom: 1px solid #eee;
            font-size: 9px;
        }
        .items-table td:nth-child(3),
        .items-table td:nth-child(4),
        .items-table td:nth-child(5) {
            text-align: right;
        }
        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .totals-container {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        .totals-spacer {
            display: table-cell;
            width: 60%;
        }
        .totals-box {
            display: table-cell;
            width: 40%;
            border: 1px solid #ddd;
            padding: 0;
        }
        .totals-row {
            display: table;
            width: 100%;
            border-bottom: 1px solid #eee;
        }
        .totals-row:last-child {
            border-bottom: none;
        }
        .totals-label {
            display: table-cell;
            padding: 6px 10px;
            font-size: 9px;
        }
        .totals-value {
            display: table-cell;
            padding: 6px 10px;
            text-align: right;
            font-size: 9px;
            font-weight: 600;
        }
        .totals-row.total {
            background-color: #1a365d;
            color: #fff;
        }
        .totals-row.total .totals-label,
        .totals-row.total .totals-value {
            font-size: 11px;
            font-weight: bold;
            padding: 8px 10px;
        }
        .totals-row.paye .totals-value {
            color: #16a34a;
        }
        .totals-row.reste .totals-value {
            color: #dc2626;
            font-weight: bold;
        }
        .declaration-box {
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .declaration-box h3 {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .declaration-box p {
            font-size: 8px;
            color: #666;
            margin: 3px 0;
        }
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
        .signature-box .title {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 40px;
        }
        .signature-box .line {
            border-top: 1px dashed #999;
            padding-top: 5px;
            color: #666;
            font-size: 8px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 8px;
            color: #666;
        }
        .footer p {
            margin: 2px 0;
        }
        .footer .company {
            font-weight: bold;
            color: #1a365d;
        }
        .watermark {
            position: fixed;
            top: 40%;
            left: 30%;
            font-size: 48px;
            color: rgba(220, 38, 38, 0.15);
            font-weight: bold;
            transform: rotate(-30deg);
            border: 4px solid rgba(220, 38, 38, 0.15);
            padding: 10px 30px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    @php
        $isAnnule = $ordre->statut === 'annule';
        $montantPaye = (float) ($ordre->montant_paye ?? 0);
        $montantTtc = (float) ($ordre->montant_ttc ?? 0);
        $resteAPayer = $montantTtc - $montantPaye;
        
        $typeLabels = [
            'import' => 'IMPORTATION',
            'export' => 'EXPORTATION',
            'transbordement' => 'TRANSBORDEMENT',
            'cabotage' => 'CABOTAGE',
            'local' => 'LOCAL',
        ];
        $typeLabel = $typeLabels[$ordre->type_operation ?? ''] ?? strtoupper($ordre->type_operation ?? 'N/A');
    @endphp

    @if($isAnnule)
    <div class="watermark">ANNULÉ</div>
    @endif

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-center">
            <div class="document-title">CONNAISSEMENT</div>
            <div class="document-numero">{{ $ordre->numero }}</div>
        </div>
        <div class="header-right">
            <div class="qr-placeholder">
                Réf: {{ $ordre->numero }}<br>
                {{ now()->format('d/m/Y H:i') }}
            </div>
        </div>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
        <div class="info-box">
            <h3>Émetteur</h3>
            <div class="name">LOGISTIGA SAS</div>
            <p>Owendo SETRAG – GABON</p>
            <p>Tel: (+241) 011 70 14 35</p>
            <p>Email: info@logistiga.com</p>
        </div>
        <div class="info-box">
            <h3>Client</h3>
            <div class="name">{{ optional($client)->raison_sociale ?? optional($client)->nom_complet ?? optional($client)->nom ?? 'N/A' }}</div>
            @if(optional($client)->adresse)<p>{{ $client->adresse }}</p>@endif
            @if(optional($client)->telephone)<p>Tél: {{ $client->telephone }}</p>@endif
            @if(optional($client)->email)<p>Email: {{ $client->email }}</p>@endif
        </div>
    </div>

    <!-- Détails opération -->
    <table class="details-table">
        <thead>
            <tr>
                <th colspan="2">Détails de l'opération - {{ $typeLabel }}</th>
            </tr>
        </thead>
        <tbody>
            @if($ordre->bl_numero)
            <tr>
                <td class="label">N° BL</td>
                <td class="value">{{ $ordre->bl_numero }}</td>
            </tr>
            @endif
            @if($ordre->navire)
            <tr>
                <td class="label">Navire</td>
                <td class="value">{{ $ordre->navire }}</td>
            </tr>
            @endif
            @if($ordre->armateur)
            <tr>
                <td class="label">Armateur</td>
                <td class="value">{{ $ordre->armateur->nom ?? 'N/A' }}</td>
            </tr>
            @endif
            @if($ordre->transitaire)
            <tr>
                <td class="label">Transitaire</td>
                <td class="value">{{ $ordre->transitaire->nom ?? 'N/A' }}</td>
            </tr>
            @endif
            @if($ordre->date_execution)
            <tr>
                <td class="label">Date d'exécution</td>
                @php
                    $dateExecution = '-';
                    $rawExec = $ordre->date_execution;
                    if ($rawExec instanceof \DateTimeInterface) {
                        $dateExecution = \Carbon\Carbon::instance($rawExec)->format('d/m/Y');
                    } elseif (is_string($rawExec) && strtotime($rawExec)) {
                        $dateExecution = \Carbon\Carbon::parse($rawExec)->format('d/m/Y');
                    }
                @endphp
                <td class="value">{{ $dateExecution }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- Tableau des lignes -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 8%;">N°</th>
                <th style="width: 42%;">Description</th>
                <th style="width: 12%;">Qté</th>
                <th style="width: 18%;">Prix unit.</th>
                <th style="width: 20%;">Montant HT</th>
            </tr>
        </thead>
        <tbody>
            @php
                $lignes = [];
                
                // Lignes directes
                if (!empty($ordre->lignes) && count($ordre->lignes) > 0) {
                    foreach ($ordre->lignes as $l) {
                        $lignes[] = [
                            'description' => $l->description ?? $l->type_operation ?? 'Prestation',
                            'quantite' => $l->quantite ?? 1,
                            'prix_unitaire' => $l->prix_unitaire ?? 0,
                            'montant_ht' => $l->montant_ht ?? (($l->quantite ?? 1) * ($l->prix_unitaire ?? 0)),
                        ];
                    }
                }
                // Conteneurs
                elseif (!empty($ordre->conteneurs) && count($ordre->conteneurs) > 0) {
                    foreach ($ordre->conteneurs as $c) {
                        if (!empty($c->operations) && count($c->operations) > 0) {
                            foreach ($c->operations as $op) {
                                $lignes[] = [
                                    'description' => ($c->numero ?? 'Conteneur') . ' ' . ($c->taille ?? '') . "' - " . ($op->description ?? $op->type ?? 'Opération'),
                                    'quantite' => $op->quantite ?? 1,
                                    'prix_unitaire' => $op->prix_unitaire ?? 0,
                                    'montant_ht' => $op->prix_total ?? (($op->quantite ?? 1) * ($op->prix_unitaire ?? 0)),
                                ];
                            }
                        } else {
                            $lignes[] = [
                                'description' => 'Conteneur ' . ($c->numero ?? '') . ' ' . ($c->taille ?? '') . "'",
                                'quantite' => 1,
                                'prix_unitaire' => $c->prix_unitaire ?? 0,
                                'montant_ht' => $c->prix_unitaire ?? 0,
                            ];
                        }
                    }
                }
                // Lots
                elseif (!empty($ordre->lots) && count($ordre->lots) > 0) {
                    foreach ($ordre->lots as $l) {
                        $lignes[] = [
                            'description' => $l->description ?? $l->numero_lot ?? 'Lot',
                            'quantite' => $l->quantite ?? 1,
                            'prix_unitaire' => $l->prix_unitaire ?? 0,
                            'montant_ht' => $l->prix_total ?? (($l->quantite ?? 1) * ($l->prix_unitaire ?? 0)),
                        ];
                    }
                }
            @endphp

            @foreach($lignes as $index => $ligne)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $ligne['description'] }}</td>
                <td>{{ $ligne['quantite'] }}</td>
                <td>{{ number_format((float)($ligne['prix_unitaire'] ?? 0), 0, ',', ' ') }} FCFA</td>
                <td>{{ number_format((float)($ligne['montant_ht'] ?? 0), 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach

            @for($i = count($lignes); $i < 6; $i++)
            <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
            @endfor
        </tbody>
    </table>

    <!-- Totaux -->
    <div class="totals-container">
        <div class="totals-spacer"></div>
        <div class="totals-box">
            <div class="totals-row">
                <span class="totals-label">Total HT</span>
                <span class="totals-value">{{ number_format((float)($ordre->montant_ht ?? 0), 0, ',', ' ') }} FCFA</span>
            </div>
            <div class="totals-row">
                <span class="totals-label">TVA (18%)</span>
                <span class="totals-value">{{ number_format((float)($ordre->tva ?? $ordre->montant_tva ?? 0), 0, ',', ' ') }} FCFA</span>
            </div>
            <div class="totals-row">
                <span class="totals-label">CSS (1%)</span>
                <span class="totals-value">{{ number_format((float)($ordre->css ?? $ordre->montant_css ?? 0), 0, ',', ' ') }} FCFA</span>
            </div>
            <div class="totals-row total">
                <span class="totals-label">Total TTC</span>
                <span class="totals-value">{{ number_format((float)($ordre->montant_ttc ?? 0), 0, ',', ' ') }} FCFA</span>
            </div>
            @if($montantPaye > 0)
            <div class="totals-row paye">
                <span class="totals-label">Montant Payé</span>
                <span class="totals-value">-{{ number_format((float)$montantPaye, 0, ',', ' ') }} FCFA</span>
            </div>
            @endif
            <div class="totals-row reste">
                <span class="totals-label">Reste à Payer</span>
                <span class="totals-value">{{ number_format((float)$resteAPayer, 0, ',', ' ') }} FCFA</span>
            </div>
        </div>
    </div>

    <!-- Déclaration -->
    <div class="declaration-box">
        <h3>Déclaration du client</h3>
        <p>Le client déclare que les marchandises ci-dessus décrites sont sa propriété exclusive et qu'il est seul responsable de leur légalité, de leur conformité aux réglementations en vigueur et de leur assurance.</p>
        <p>Le client reconnaît avoir pris connaissance des conditions générales de transport et de stockage de LOGISTIGA SAS et les accepte sans réserve.</p>
    </div>

    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-box">
            <div class="title">Le Client</div>
            <div class="line">Signature et cachet</div>
        </div>
        <div class="signature-box">
            <div class="title">LOGISTIGA SAS</div>
            <div class="line">Signature et cachet</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p class="company">LOGISTIGA SAS au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
