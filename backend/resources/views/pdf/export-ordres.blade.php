<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Ordres de Travail</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo">LOGISTIGA</div>
            <div class="logo-subtitle">TRANSPORT · STOCKAGE · MANUTENTION</div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT DES ORDRES DE TRAVAIL</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
        @if(!empty($client_nom))<span><strong>Client:</strong> {{ $client_nom }}</span>@endif
        @if(!empty($statut_label))<span><strong>Statut:</strong> {{ $statut_label }}</span>@endif
        @if(!empty($categorie_label))<span><strong>Catégorie:</strong> {{ $categorie_label }}</span>@endif
    </div>

    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Ordres</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Montant Total TTC</div><div class="kpi-value">{{ number_format($stats['montant_ttc'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
            <td><div class="kpi-label">En Cours</div><div class="kpi-value">{{ $stats['en_cours'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Terminés</div><div class="kpi-value">{{ $stats['termines'] ?? 0 }}</div></td>
        </tr>
    </table>

    <div class="section-title">Liste des Ordres de Travail ({{ count($ordres) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:15px">#</th>
                <th>Numéro</th>
                <th>Date</th>
                <th>Client</th>
                <th>Catégorie</th>
                <th class="text-right">Montant HT</th>
                <th class="text-right">Montant TTC</th>
                <th class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @php $totHT = 0; $totTTC = 0; @endphp
            @foreach($ordres as $i => $o)
            @php
                $ht = $o->montant_ht ?? 0;
                $ttc = $o->montant_ttc ?? 0;
                $totHT += $ht; $totTTC += $ttc;
            @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td>{{ $o->numero }}</td>
                <td>{{ $o->date_creation ? $o->date_creation->format('d/m/Y') : '-' }}</td>
                <td>{{ $o->client->raison_sociale ?? $o->client->nom ?? $o->client->nom_complet ?? '-' }}</td>
                <td>{{ ucfirst($o->categorie ?? '-') }}</td>
                <td class="text-right">{{ number_format($ht, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($ttc, 0, ',', ' ') }}</td>
                <td class="text-center">{{ ucfirst(str_replace('_', ' ', $o->statut)) }}</td>
            </tr>
            @endforeach
            <tr class="row-total">
                <td colspan="5">TOTAUX</td>
                <td class="text-right">{{ number_format($totHT, 0, ',', ' ') }}</td>
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
