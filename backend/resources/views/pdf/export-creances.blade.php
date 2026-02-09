<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Créances</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">ÉTAT DES CRÉANCES</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <table class="kpi-table">
        <tr>
            <td class="kpi-danger"><div class="kpi-label">Total Créances</div><div class="kpi-value">{{ number_format($stats['total_creances'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">Factures Impayées</div><div class="kpi-value">{{ $stats['nb_factures'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Âge Moyen</div><div class="kpi-value">{{ $stats['age_moyen'] ?? 0 }} jours</div></td>
            <td><div class="kpi-label">Nb Clients Débiteurs</div><div class="kpi-value">{{ $stats['nb_clients'] ?? 0 }}</div></td>
        </tr>
    </table>

    {{-- Par tranche d'âge --}}
    @if(!empty($tranches))
    <div class="section-title">Répartition par Tranche d'Âge</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Tranche</th>
                <th class="text-right">Montant</th>
                <th class="text-right">% du Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($tranches as $t)
            <tr>
                <td>{{ $t['tranche'] ?? '-' }}</td>
                <td class="text-right text-red">{{ number_format($t['montant'] ?? 0, 0, ',', ' ') }} FCFA</td>
                <td class="text-right">{{ ($stats['total_creances'] ?? 0) > 0 ? round((($t['montant'] ?? 0) / $stats['total_creances']) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    {{-- Top débiteurs --}}
    <div class="section-title">Détail par Client</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Client</th>
                <th class="text-right">Montant Dû</th>
                <th class="text-center">Nb Factures</th>
                <th class="text-right">% du Total</th>
            </tr>
        </thead>
        <tbody>
            @php $totalCreances = 0; $totalFactures = 0; @endphp
            @foreach($debiteurs as $i => $d)
            @php
                $totalCreances += $d['montant_du'] ?? $d['total_du'] ?? 0;
                $totalFactures += $d['nb_factures'] ?? $d['nombre_factures'] ?? 0;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td><strong>{{ $d['client_nom'] ?? 'Inconnu' }}</strong></td>
                <td class="text-right text-red">{{ number_format($d['montant_du'] ?? $d['total_du'] ?? 0, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $d['nb_factures'] ?? $d['nombre_factures'] ?? 0 }}</td>
                <td class="text-right">{{ ($stats['total_creances'] ?? 0) > 0 ? round((($d['montant_du'] ?? $d['total_du'] ?? 0) / $stats['total_creances']) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="2">TOTAL</td>
                <td class="text-right text-red">{{ number_format($totalCreances, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $totalFactures }}</td>
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
