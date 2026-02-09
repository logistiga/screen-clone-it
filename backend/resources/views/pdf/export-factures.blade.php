<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Factures</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT DES FACTURES</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    {{-- Filtres appliqués --}}
    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
        @if(!empty($client_nom))<span><strong>Client:</strong> {{ $client_nom }}</span>@endif
        @if(!empty($statut_label))<span><strong>Statut:</strong> {{ $statut_label }}</span>@endif
    </div>

    {{-- KPIs --}}
    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Factures</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Montant Total TTC</div><div class="kpi-value">{{ number_format($stats['montant_ttc'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-success"><div class="kpi-label">Montant Payé</div><div class="kpi-value">{{ number_format($stats['montant_paye'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td class="kpi-danger"><div class="kpi-label">Reste à Payer</div><div class="kpi-value">{{ number_format($stats['reste_a_payer'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
        </tr>
    </table>

    {{-- Tableau --}}
    <div class="section-title">Liste des Factures ({{ count($factures) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Numéro</th>
                <th>Date</th>
                <th>Client</th>
                <th class="text-right">Montant HT</th>
                <th class="text-right">TVA</th>
                <th class="text-right">Montant TTC</th>
                <th class="text-right">Payé</th>
                <th class="text-right">Reste</th>
                <th class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @php
                $totHT = 0; $totTVA = 0; $totTTC = 0; $totPaye = 0; $totReste = 0;
            @endphp
            @foreach($factures as $i => $f)
            @php
                $ht = $f->montant_ht ?? 0;
                $tva = $f->tva ?? 0;
                $ttc = $f->montant_ttc ?? 0;
                $paye = $f->montant_paye ?? 0;
                $reste = $ttc - $paye;
                $totHT += $ht; $totTVA += $tva; $totTTC += $ttc; $totPaye += $paye; $totReste += $reste;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $f->numero }}</td>
                <td>{{ $f->date_creation ? $f->date_creation->format('d/m/Y') : '-' }}</td>
                <td>{{ $f->client->raison_sociale ?? $f->client->nom_complet ?? '-' }}</td>
                <td class="text-right">{{ number_format($ht, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($tva, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($ttc, 0, ',', ' ') }}</td>
                <td class="text-right text-green">{{ number_format($paye, 0, ',', ' ') }}</td>
                <td class="text-right {{ $reste > 0 ? 'text-red' : '' }}">{{ number_format($reste, 0, ',', ' ') }}</td>
                <td class="text-center">{{ ucfirst(str_replace('_', ' ', $f->statut)) }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="4">TOTAUX</td>
                <td class="text-right">{{ number_format($totHT, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($totTVA, 0, ',', ' ') }}</td>
                <td class="text-right text-red">{{ number_format($totTTC, 0, ',', ' ') }}</td>
                <td class="text-right text-green">{{ number_format($totPaye, 0, ',', ' ') }}</td>
                <td class="text-right text-red">{{ number_format($totReste, 0, ',', ' ') }}</td>
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
