<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture - {{ $facture->numero }}</title>
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
            font-size: 18px;
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
        .info-row {
            margin-bottom: 15px;
        }
        .info-row p {
            margin: 2px 0;
            font-size: 9px;
        }
        .info-row strong {
            color: #1a365d;
        }
        .client-box {
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .client-box h3 {
            font-size: 10px;
            color: #1a365d;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: bold;
        }
        .client-box .name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 3px;
        }
        .client-box p {
            font-size: 9px;
            color: #666;
            margin: 2px 0;
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
        .empty-row td {
            height: 20px;
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
        .notes-box {
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .notes-box h3 {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .notes-box p {
            font-size: 9px;
        }
        .bank-info {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .bank-info h3 {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .bank-grid {
            display: table;
            width: 100%;
        }
        .bank-item {
            display: table-cell;
            width: 50%;
            font-size: 9px;
        }
        .bank-item .name {
            font-weight: bold;
            margin-bottom: 2px;
        }
        .bank-item .number {
            color: #666;
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
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paye { background-color: #d1fae5; color: #065f46; }
        .status-partiel { background-color: #fef3c7; color: #92400e; }
        .status-impaye { background-color: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    @php
        $isAnnule = $facture->statut === 'annule';
        $isPaye = $facture->statut === 'paye';
        $montantPaye = $facture->montant_paye ?? 0;
        $resteAPayer = ($facture->montant_ttc ?? 0) - $montantPaye;
    @endphp

    @if($isAnnule)
    <div class="watermark">ANNULÉE</div>
    @endif

    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-center">
            <div class="document-title">FACTURE</div>
            <div class="document-numero">{{ $facture->numero }}</div>
            @if($isPaye)
            <span class="status-badge status-paye">PAYÉE</span>
            @elseif($montantPaye > 0)
            <span class="status-badge status-partiel">PAIEMENT PARTIEL</span>
            @endif
        </div>
        <div class="header-right">
            <div class="qr-placeholder">
                Réf: {{ $facture->numero }}<br>
                {{ now()->format('d/m/Y H:i') }}
            </div>
        </div>
    </div>

    <!-- Infos document -->
    <div class="info-row">
        <p><strong>Date:</strong> {{ $facture->date_facture ? \Carbon\Carbon::parse($facture->date_facture)->format('d/m/Y') : 'N/A' }}</p>
        <p><strong>Échéance:</strong> {{ $facture->date_echeance ? \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') : 'N/A' }}</p>
    </div>

    <!-- Client -->
    <div class="client-box">
        <h3>Client</h3>
        <div class="name">{{ $client->raison_sociale ?? $client->nom_complet ?? $client->nom ?? 'N/A' }}</div>
        <p>{{ $client->adresse ?? '' }}{{ $client->ville ? ' - ' . $client->ville : '' }}, Gabon</p>
        <p>
            @if($client->telephone)Tél: {{ $client->telephone }}@endif
            @if($client->email) | Email: {{ $client->email }}@endif
        </p>
        @if($client->nif || $client->rccm)
        <p>
            @if($client->nif)NIF: {{ $client->nif }}@endif
            @if($client->rccm) | RCCM: {{ $client->rccm }}@endif
        </p>
        @endif
    </div>

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
                if (!empty($facture->lignes) && count($facture->lignes) > 0) {
                    foreach ($facture->lignes as $l) {
                        $lignes[] = [
                            'description' => $l->description ?? $l->type_operation ?? 'Prestation',
                            'quantite' => $l->quantite ?? 1,
                            'prix_unitaire' => $l->prix_unitaire ?? 0,
                            'montant_ht' => $l->montant_ht ?? (($l->quantite ?? 1) * ($l->prix_unitaire ?? 0)),
                        ];
                    }
                }
            @endphp

            @foreach($lignes as $index => $ligne)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $ligne['description'] }}</td>
                <td>{{ $ligne['quantite'] }}</td>
                <td>{{ number_format($ligne['prix_unitaire'], 0, ',', ' ') }} FCFA</td>
                <td>{{ number_format($ligne['montant_ht'], 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach

            @for($i = count($lignes); $i < 8; $i++)
            <tr class="empty-row">
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
                <span class="totals-value">{{ number_format($facture->montant_ht ?? 0, 0, ',', ' ') }} FCFA</span>
            </div>
            @if(($facture->remise_montant ?? 0) > 0)
            <div class="totals-row">
                <span class="totals-label">Remise</span>
                <span class="totals-value">-{{ number_format($facture->remise_montant, 0, ',', ' ') }} FCFA</span>
            </div>
            @endif
            <div class="totals-row">
                <span class="totals-label">TVA (18%)</span>
                <span class="totals-value">{{ number_format($facture->tva ?? $facture->montant_tva ?? 0, 0, ',', ' ') }} FCFA</span>
            </div>
            <div class="totals-row">
                <span class="totals-label">CSS (1%)</span>
                <span class="totals-value">{{ number_format($facture->css ?? $facture->montant_css ?? 0, 0, ',', ' ') }} FCFA</span>
            </div>
            <div class="totals-row total">
                <span class="totals-label">Total TTC</span>
                <span class="totals-value">{{ number_format($facture->montant_ttc ?? 0, 0, ',', ' ') }} FCFA</span>
            </div>
            @if($montantPaye > 0)
            <div class="totals-row paye">
                <span class="totals-label">Montant Payé</span>
                <span class="totals-value">-{{ number_format($montantPaye, 0, ',', ' ') }} FCFA</span>
            </div>
            @endif
            <div class="totals-row reste">
                <span class="totals-label">Reste à Payer</span>
                <span class="totals-value">{{ number_format($resteAPayer, 0, ',', ' ') }} FCFA</span>
            </div>
        </div>
    </div>

    <!-- Notes -->
    @if($facture->notes)
    <div class="notes-box">
        <h3>Notes</h3>
        <p>{{ $facture->notes }}</p>
    </div>
    @endif

    <!-- Coordonnées bancaires -->
    <div class="bank-info">
        <h3>Coordonnées Bancaires</h3>
        <div class="bank-grid">
            <div class="bank-item">
                <div class="name">BGFI Bank Gabon</div>
                <div class="number">N°: 40003 04140 41041658011 78</div>
            </div>
            <div class="bank-item">
                <div class="name">UGB</div>
                <div class="number">N°: 40002 00043 90000338691 84</div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p class="company">LOGISTIGA SAS au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
        <p>BGFI N°: 40003 04140 41041658011 78 | UGB N°: 40002 00043 90000338691 84</p>
    </div>
</body>
</html>
