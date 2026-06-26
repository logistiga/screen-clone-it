<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Conteneurs</title>
    @include('pdf.partials.header-footer')
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo"><img src="{{ public_path('images/logistiga-logo.png') }}" alt="Logistiga"></div>
        </div>
        <div class="header-right">
            <div class="doc-title">RAPPORT DES CONTENEURS</div>
            <div class="doc-meta">{{ $periode ?? '' }}</div>
            <div class="doc-date">Généré le {{ now()->format('d/m/Y H:i') }}</div>
        </div>
    </div>

    {{-- Filtres appliqués --}}
    <div class="filter-info">
        <span><strong>Période:</strong> {{ $date_debut ?? '-' }} au {{ $date_fin ?? '-' }}</span>
        @if(!empty($statut_label))<span><strong>Statut:</strong> {{ $statut_label }}</span>@endif
        @if(!empty($armateur_label))<span><strong>Armateur:</strong> {{ $armateur_label }}</span>@endif
        @if(!empty($type_transport_label))<span><strong>Transport:</strong> {{ $type_transport_label }}</span>@endif
    </div>

    {{-- KPIs --}}
    <table class="kpi-table">
        <tr>
            <td><div class="kpi-label">Total Conteneurs</div><div class="kpi-value">{{ $stats['total'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Import</div><div class="kpi-value">{{ $stats['nb_import'] ?? 0 }}</div></td>
            <td><div class="kpi-label">Export</div><div class="kpi-value">{{ $stats['nb_export'] ?? 0 }}</div></td>
            <td class="kpi-success"><div class="kpi-label">Affectés</div><div class="kpi-value">{{ $stats['nb_affectes'] ?? 0 }}</div></td>
            <td class="kpi-danger"><div class="kpi-label">Montant Total</div><div class="kpi-value">{{ number_format($stats['total_prix'] ?? 0, 0, ',', ' ') }} FCFA</div></td>
        </tr>
    </table>

    {{-- Tableau --}}
    <div class="section-title">Liste des Conteneurs ({{ count($conteneurs) }})</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width:18px">#</th>
                <th>N° Conteneur</th>
                <th>Client</th>
                <th>Type</th>
                <th class="text-center">Transport</th>
                <th>N° BL</th>
                <th>Armateur</th>
                <th>N° Camion</th>
                <th>Date sortie</th>
                <th class="text-center">Statut</th>
                <th class="text-right">Prix (FCFA)</th>
            </tr>
        </thead>
        <tbody>
            @php $totPrix = 0; @endphp
            @foreach($conteneurs as $i => $c)
            @php $totPrix += $c->prix; @endphp
            <tr class="{{ $i % 2 === 1 ? 'row-alt' : '' }}">
                <td>{{ $i + 1 }}</td>
                <td><strong>{{ $c->numero_conteneur }}</strong></td>
                <td>{{ $c->client_nom }}</td>
                <td>{{ $c->type_conteneur }}</td>
                <td class="text-center">{{ $c->type_transport }}</td>
                <td>{{ $c->numero_bl }}</td>
                <td>{{ $c->armateur_nom }}</td>
                <td>{{ $c->camion_plaque }}</td>
                <td>{{ $c->date_sortie ? \Carbon\Carbon::parse($c->date_sortie)->format('d/m/Y') : '-' }}</td>
                <td class="text-center">{{ $c->statut_label }}</td>
                <td class="text-right">{{ number_format($c->prix, 0, ',', ' ') }}</td>
            </tr>
            @endforeach
            @if(count($conteneurs) === 0)
            <tr><td colspan="12" class="text-center" style="padding:20px;color:#999">Aucun conteneur trouvé pour la période</td></tr>
            @endif
            @if(count($conteneurs) > 0)
            <tr class="row-total">
                <td colspan="11">TOTAL</td>
                <td class="text-right text-red">{{ number_format($totPrix, 0, ',', ' ') }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        <p><strong>LOGISTIGA SAS</strong> au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</p>
        <p>Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</p>
        <p>Email: info@logistiga.com – Site web: www.logistiga.com</p>
    </div>
</body>
</html>
