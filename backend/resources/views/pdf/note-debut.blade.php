<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Note de Début - {{ $note->numero }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .company-info {
            font-size: 9px;
            color: #666;
        }
        .document-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-top: 15px;
            text-transform: uppercase;
        }
        .document-numero {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
        }
        .type-badge {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            padding: 5px 15px;
            border-radius: 15px;
            font-weight: bold;
            margin-top: 10px;
        }
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }
        .info-box {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 10px;
        }
        .info-box h3 {
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .info-box p {
            margin: 3px 0;
        }
        .info-box .name {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .details-table th {
            background-color: #f1f5f9;
            padding: 10px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            border-bottom: 2px solid #e2e8f0;
        }
        .details-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .details-table .label {
            width: 40%;
            color: #64748b;
        }
        .details-table .value {
            font-weight: 600;
        }
        .totals-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }
        .totals-table {
            width: 100%;
        }
        .totals-table td {
            padding: 8px 0;
        }
        .totals-table .label {
            color: #64748b;
        }
        .totals-table .value {
            text-align: right;
            font-weight: 600;
        }
        .totals-table .total-row {
            border-top: 2px solid #2563eb;
            font-size: 14px;
        }
        .totals-table .total-row .label {
            color: #1e40af;
            font-weight: bold;
        }
        .totals-table .total-row .value {
            color: #1e40af;
            font-size: 16px;
        }
        .totals-table .reste-row .value {
            color: #dc2626;
        }
        .totals-table .paye-row .value {
            color: #16a34a;
        }
        .bank-info {
            background-color: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 25px;
        }
        .bank-info h3 {
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 10px;
        }
        .bank-grid {
            display: table;
            width: 100%;
        }
        .bank-item {
            display: table-cell;
            width: 50%;
        }
        .bank-item .name {
            font-weight: bold;
            margin-bottom: 3px;
        }
        .bank-item .number {
            color: #666;
            font-size: 10px;
        }
        .signatures {
            display: table;
            width: 100%;
            margin-top: 40px;
        }
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 0 20px;
        }
        .signature-box .title {
            font-weight: bold;
            margin-bottom: 50px;
        }
        .signature-box .line {
            border-top: 1px dashed #999;
            padding-top: 5px;
            color: #666;
            font-size: 9px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #666;
        }
        .footer p {
            margin: 3px 0;
        }
        .footer .company {
            font-weight: bold;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga" style="height:50px;"></div>
        <div class="company-info">
            Owendo SETRAG – GABON | Tel: (+241) 011 70 14 35 | Email: info@logistiga.com
        </div>
        <div class="document-title">Note de Début</div>
        <div class="document-numero">{{ $note->numero }}</div>
        <div class="type-badge">{{ $note->type_label }}</div>
    </div>

    <!-- Info Grid -->
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
            <p class="name">{{ $client->raison_sociale ?? $client->nom_complet ?? $client->nom }}</p>
            @if($client->adresse)
            <p>{{ $client->adresse }}</p>
            @endif
            @if($client->telephone)
            <p>Tel: {{ $client->telephone }}</p>
            @endif
            @if($client->email)
            <p>Email: {{ $client->email }}</p>
            @endif
        </div>
    </div>

    <!-- Details Table -->
    <table class="details-table">
        <thead>
            <tr>
                <th colspan="2">Détails de l'opération</th>
            </tr>
        </thead>
        <tbody>
            @if($note->conteneur_numero)
            <tr>
                <td class="label">N° Conteneur</td>
                <td class="value">{{ $note->conteneur_numero }}</td>
            </tr>
            @endif
            @if($note->bl_numero)
            <tr>
                <td class="label">N° BL</td>
                <td class="value">{{ $note->bl_numero }}</td>
            </tr>
            @endif
            @if($note->navire)
            <tr>
                <td class="label">Navire</td>
                <td class="value">{{ $note->navire }}</td>
            </tr>
            @endif
            @if($note->date_debut)
            <tr>
                <td class="label">Date de début</td>
                <td class="value">{{ \Carbon\Carbon::parse($note->date_debut)->format('d/m/Y') }}</td>
            </tr>
            @endif
            @if($note->date_fin)
            <tr>
                <td class="label">Date de fin</td>
                <td class="value">{{ \Carbon\Carbon::parse($note->date_fin)->format('d/m/Y') }}</td>
            </tr>
            @endif
            @if($note->nombre_jours)
            <tr>
                <td class="label">Nombre de jours</td>
                <td class="value">{{ $note->nombre_jours }} jours</td>
            </tr>
            @endif
            @if($note->tarif_journalier)
            <tr>
                <td class="label">Tarif journalier</td>
                <td class="value">{{ number_format($note->tarif_journalier, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            @if($note->description)
            <tr>
                <td class="label">Description</td>
                <td class="value">{{ $note->description }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- Totals Box -->
    <div class="totals-box">
        <table class="totals-table">
            <tr class="total-row">
                <td class="label">Montant Total</td>
                <td class="value">{{ number_format($note->montant_total ?? $note->montant_ht ?? 0, 0, ',', ' ') }} FCFA</td>
            </tr>
            @if(($note->montant_avance ?? 0) > 0)
            <tr class="paye-row">
                <td class="label">Avance</td>
                <td class="value">-{{ number_format($note->montant_avance, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            @if(($note->montant_paye ?? 0) > 0)
            <tr class="paye-row">
                <td class="label">Montant Payé</td>
                <td class="value">-{{ number_format($note->montant_paye, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endif
            @php
                $reste = ($note->montant_total ?? $note->montant_ht ?? 0) - ($note->montant_paye ?? 0) - ($note->montant_avance ?? 0);
            @endphp
            <tr class="reste-row" style="border-top: 1px solid #e2e8f0;">
                <td class="label" style="font-weight: bold;">Reste à Payer</td>
                <td class="value" style="font-size: 14px;">{{ number_format($reste, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
    </div>

    <!-- Bank Info -->
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
        <p>BGFI N°: 40003 04140 41041658011 78 | UGB N°: 40002 00043 90000338691 84</p>
    </div>
</body>
</html>
