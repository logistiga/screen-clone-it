<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Annulations</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">DOCUMENTS ANNULÉS & AVOIRS</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Annulations</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td class="kpi-danger"><div class="kpi-label">Montant Total</div><div class="kpi-value">{{ number_format($stats['montant_total'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">Factures Annulées</div><div class="kpi-value">{{ $stats['factures'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Autres Documents</div><div class="kpi-value">{{ $stats['autres'] ?? 0 }}</div></td>
        </tr>
    </table>

    <div class="section-title">Liste des Annulations ({{ count($annulations) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Date</th>
                <th>Type Document</th>
                <th>N° Document</th>
                <th>Client</th>
                <th class="text-right">Montant</th>
                <th>Motif</th>
            </tr>
        </thead>
        <tbody>
            @php $total = 0; @endphp
            @foreach($annulations as $i => $a)
            @php $total += $a->montant ?? 0; @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $a->date ? $a->date->format('d/m/Y') : '-' }}</td>
                <td>{{ ucfirst($a->type ?? '-') }}</td>
                <td>{{ $a->document_numero ?? '-' }}</td>
                <td>{{ $a->client->raison_sociale ?? $a->client->nom ?? '-' }}</td>
                <td class="text-right text-red">{{ number_format($a->montant ?? 0, 0, ',', ' ') }}</td>
                <td>{{ \Illuminate\Support\Str::limit($a->motif ?? '-', 40) }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="5">TOTAL</td>
                <td class="text-right text-red">{{ number_format($total, 0, ',', ' ') }} FCFA</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
