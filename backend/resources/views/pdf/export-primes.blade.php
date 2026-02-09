<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Primes</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT DES PRIMES</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
        @if(!empty($statut_label))<span><strong>Statut:</strong> {{ $statut_label }}</span>@endif
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Primes</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Montant Total</div><div class="kpi-value">{{ number_format($stats['montant_total'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-success"><div class="kpi-label">Montant Payé</div><div class="kpi-value">{{ number_format($stats['montant_paye'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-danger"><div class="kpi-label">Reste à Payer</div><div class="kpi-value">{{ number_format($stats['reste_a_payer'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
        </tr>
    </table>

    <div class="section-title">Liste des Primes ({{ count($primes) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Référence</th>
                <th>Date</th>
                <th>Représentant</th>
                <th>Source</th>
                <th class="text-right">Montant</th>
                <th class="text-right">Payé</th>
                <th class="text-right">Reste</th>
                <th class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @php $totMontant = 0; $totPaye = 0; $totReste = 0; @endphp
            @foreach($primes as $i => $p)
            @php
                $paye = $p->paiements->sum('montant');
                $reste = ($p->montant ?? 0) - $paye;
                $totMontant += $p->montant ?? 0; $totPaye += $paye; $totReste += $reste;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $p->reference ?? '-' }}</td>
                <td>{{ $p->date ? $p->date->format('d/m/Y') : '-' }}</td>
                <td>{{ $p->representant->nom ?? '-' }}</td>
                <td>{{ $p->source ?? '-' }}</td>
                <td class="text-right">{{ number_format($p->montant ?? 0, 0, ',', ' ') }}</td>
                <td class="text-right text-green">{{ number_format($paye, 0, ',', ' ') }}</td>
                <td class="text-right {{ $reste > 0 ? 'text-red' : '' }}">{{ number_format($reste, 0, ',', ' ') }}</td>
                <td class="text-center">{{ ucfirst(str_replace('_', ' ', $p->statut ?? 'en_attente')) }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="5">TOTAUX</td>
                <td class="text-right">{{ number_format($totMontant, 0, ',', ' ') }} FCFA</td>
                <td class="text-right text-green">{{ number_format($totPaye, 0, ',', ' ') }} FCFA</td>
                <td class="text-right text-red">{{ number_format($totReste, 0, ',', ' ') }} FCFA</td>
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
