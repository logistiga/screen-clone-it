<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Paiements</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo">LOGISTIGA</div>
            <div class="logo-subtitle">TRANSPORT · STOCKAGE · MANUTENTION</div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT DES PAIEMENTS</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
        @if(!empty($mode_label))<span><strong>Mode:</strong> {{ $mode_label }}</span>@endif
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Paiements</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td class="kpi-success"><div class="kpi-label">Montant Total</div><div class="kpi-value">{{ number_format($stats['montant_total'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">Espèces</div><div class="kpi-value">{{ number_format($stats['especes'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">Virements/Chèques</div><div class="kpi-value">{{ number_format($stats['autres'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
        </tr>
    </table>

    <div class="section-title">Liste des Paiements ({{ count($paiements) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Référence</th>
                <th>Date</th>
                <th>Facture</th>
                <th>Client</th>
                <th class="text-right">Montant</th>
                <th class="text-center">Mode</th>
                <th>Observations</th>
            </tr>
        </thead>
        <tbody>
            @php $total = 0; @endphp
            @foreach($paiements as $i => $p)
            @php $total += $p->montant ?? 0; @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $p->reference ?? '-' }}</td>
                <td>{{ $p->date ? $p->date->format('d/m/Y') : '-' }}</td>
                <td>{{ $p->facture->numero ?? '-' }}</td>
                <td>{{ $p->facture->client->raison_sociale ?? $p->facture->client->nom_complet ?? '-' }}</td>
                <td class="text-right text-green">{{ number_format($p->montant ?? 0, 0, ',', ' ') }}</td>
                <td class="text-center">{{ ucfirst($p->mode_paiement ?? '-') }}</td>
                <td>{{ \Illuminate\Support\Str::limit($p->notes ?? '-', 30) }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="5">TOTAL</td>
                <td class="text-right text-green">{{ number_format($total, 0, ',', ' ') }} FCFA</td>
                <td colspan="2"></td>
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
