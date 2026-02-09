<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Crédits Bancaires</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo">LOGISTIGA</div>
            <div class="logo-subtitle">TRANSPORT · STOCKAGE · MANUTENTION</div>
        </div>
        <div class="header-right">
            <div class="doc-title">CRÉDITS BANCAIRES</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Crédits</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Montant Emprunté</div><div class="kpi-value">{{ number_format($stats['montant_emprunte'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-success"><div class="kpi-label">Remboursé</div><div class="kpi-value">{{ number_format($stats['montant_rembourse'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-danger"><div class="kpi-label">Reste à Rembourser</div><div class="kpi-value">{{ number_format($stats['reste'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
        </tr>
    </table>

    <div class="section-title">Liste des Crédits ({{ count($credits) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Référence</th>
                <th>Banque</th>
                <th>Type</th>
                <th>Date Obtention</th>
                <th class="text-right">Montant</th>
                <th class="text-center">Taux</th>
                <th class="text-right">Remboursé</th>
                <th class="text-right">Reste</th>
                <th class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @php $totMontant = 0; $totRembourse = 0; $totReste = 0; @endphp
            @foreach($credits as $i => $c)
            @php
                $rembourse = $c->remboursements->sum('montant');
                $reste = ($c->montant ?? 0) - $rembourse;
                $totMontant += $c->montant ?? 0; $totRembourse += $rembourse; $totReste += $reste;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $c->reference }}</td>
                <td>{{ $c->banque->nom ?? '-' }}</td>
                <td>{{ $c->type ?? '-' }}</td>
                <td>{{ $c->date_obtention ? $c->date_obtention->format('d/m/Y') : '-' }}</td>
                <td class="text-right">{{ number_format($c->montant ?? 0, 0, ',', ' ') }}</td>
                <td class="text-center">{{ number_format($c->taux_interet ?? 0, 2) }}%</td>
                <td class="text-right text-green">{{ number_format($rembourse, 0, ',', ' ') }}</td>
                <td class="text-right {{ $reste > 0 ? 'text-red' : '' }}">{{ number_format($reste, 0, ',', ' ') }}</td>
                <td class="text-center">{{ ucfirst($c->statut ?? '-') }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="5">TOTAUX</td>
                <td class="text-right">{{ number_format($totMontant, 0, ',', ' ') }} FCFA</td>
                <td></td>
                <td class="text-right text-green">{{ number_format($totRembourse, 0, ',', ' ') }} FCFA</td>
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
