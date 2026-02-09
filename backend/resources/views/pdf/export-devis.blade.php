<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Devis</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo">LOGISTIGA</div>
            <div class="logo-subtitle">TRANSPORT · STOCKAGE · MANUTENTION</div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT DES DEVIS</div>
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
            <td><div class="kpi-label">Total Devis</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Montant Total TTC</div><div class="kpi-value">{{ number_format($stats['montant_ttc'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-success"><div class="kpi-label">Acceptés</div><div class="kpi-value">{{ $stats['acceptes'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Taux Conversion</div><div class="kpi-value">{{ $stats['taux_conversion'] ?? 0 }}%</div></td>
        </tr>
    </table>

    <div class="section-title">Liste des Devis ({{ count($devis) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Numéro</th>
                <th>Date</th>
                <th>Validité</th>
                <th>Client</th>
                <th class="text-right">Montant HT</th>
                <th class="text-right">TVA</th>
                <th class="text-right">Montant TTC</th>
                <th class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @php $totHT = 0; $totTVA = 0; $totTTC = 0; @endphp
            @foreach($devis as $i => $d)
            @php
                $ht = $d->montant_ht ?? 0; $tva = $d->tva ?? 0; $ttc = $d->montant_ttc ?? 0;
                $totHT += $ht; $totTVA += $tva; $totTTC += $ttc;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $d->numero }}</td>
                <td>{{ $d->date_creation ? $d->date_creation->format('d/m/Y') : '-' }}</td>
                <td>{{ $d->date_validite ? $d->date_validite->format('d/m/Y') : '-' }}</td>
                <td>{{ $d->client->raison_sociale ?? $d->client->nom_complet ?? '-' }}</td>
                <td class="text-right">{{ number_format($ht, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($tva, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($ttc, 0, ',', ' ') }}</td>
                <td class="text-center">{{ ucfirst(str_replace('_', ' ', $d->statut)) }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="5">TOTAUX</td>
                <td class="text-right">{{ number_format($totHT, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($totTVA, 0, ',', ' ') }}</td>
                <td class="text-right text-red">{{ number_format($totTTC, 0, ',', ' ') }}</td>
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
