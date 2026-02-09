<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Clients</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT DES CLIENTS</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Clients</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Actifs</div><div class="kpi-value">{{ $stats['actifs'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Entreprises</div><div class="kpi-value">{{ $stats['entreprises'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Particuliers</div><div class="kpi-value">{{ $stats['particuliers'] ?? 0 }}</div></td>
        </tr>
    </table>

    <div class="section-title">Liste des Clients ({{ count($clients) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Code</th>
                <th>Raison Sociale / Nom</th>
                <th>Type</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Ville</th>
                <th class="text-right">Nb Factures</th>
                <th class="text-right">Solde</th>
                <th class="text-center">Actif</th>
            </tr>
        </thead>
        <tbody>
            @foreach($clients as $i => $c)
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $c->code ?? '-' }}</td>
                <td><strong>{{ $c->raison_sociale ?? $c->nom_complet ?? '-' }}</strong></td>
                <td>{{ $c->type === 'entreprise' ? 'Entreprise' : 'Particulier' }}</td>
                <td>{{ $c->email ?? '-' }}</td>
                <td>{{ $c->telephone ?? '-' }}</td>
                <td>{{ $c->ville ?? '-' }}</td>
                <td class="text-right">{{ $c->factures_count ?? 0 }}</td>
                <td class="text-right {{ ($c->solde ?? 0) > 0 ? 'text-red' : '' }}">{{ number_format($c->solde ?? 0, 0, ',', ' ') }}</td>
                <td class="text-center">{{ $c->actif ? '✓' : '✗' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
