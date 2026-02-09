<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Activité Clients</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">ACTIVITÉ PAR CLIENT</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Clients Actifs</div><div class="kpi-value">{{ $stats['nb_clients'] ?? 0 }}</div></td>
            <td><div class="kpi-label">CA Total</div><div class="kpi-value">{{ number_format($stats['ca_total'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-success"><div class="kpi-label">Paiements</div><div class="kpi-value">{{ number_format($stats['paiements'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-danger"><div class="kpi-label">Solde Dû</div><div class="kpi-value">{{ number_format($stats['solde'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
        </tr>
    </table>

    <div class="section-title">Classement des Clients par Chiffre d'Affaires</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Client</th>
                <th class="text-right">CA Total</th>
                <th class="text-center">Nb Factures</th>
                <th class="text-right">Paiements</th>
                <th class="text-right">Solde Dû</th>
                <th class="text-right">Taux Paiement</th>
            </tr>
        </thead>
        <tbody>
            @php $totCA = 0; $totFact = 0; $totPaie = 0; $totSolde = 0; @endphp
            @foreach($clients as $i => $c)
            @php
                $ca = $c->factures_sum_montant_ttc ?? 0;
                $paie = $c->paiements_sum_montant ?? 0;
                $solde = $c->solde ?? 0;
                $nbFact = $c->factures_count ?? 0;
                $taux = $ca > 0 ? round(($paie / $ca) * 100, 1) : 100;
                $totCA += $ca; $totFact += $nbFact; $totPaie += $paie; $totSolde += $solde;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td><strong>{{ $c->raison_sociale ?? $c->nom ?? 'Inconnu' }}</strong></td>
                <td class="text-right">{{ number_format($ca, 0, ',', ' ') }}</td>
                <td class="text-center">{{ $nbFact }}</td>
                <td class="text-right text-green">{{ number_format($paie, 0, ',', ' ') }}</td>
                <td class="text-right {{ $solde > 0 ? 'text-red' : '' }}">{{ number_format($solde, 0, ',', ' ') }}</td>
                <td class="text-right">{{ $taux }}%</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="2">TOTAUX</td>
                <td class="text-right text-red">{{ number_format($totCA, 0, ',', ' ') }} FCFA</td>
                <td class="text-center">{{ $totFact }}</td>
                <td class="text-right text-green">{{ number_format($totPaie, 0, ',', ' ') }} FCFA</td>
                <td class="text-right text-red">{{ number_format($totSolde, 0, ',', ' ') }} FCFA</td>
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
